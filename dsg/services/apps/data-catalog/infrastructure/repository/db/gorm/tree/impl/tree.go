package impl

import (
	"context"
	"errors"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/errorcode/mariadb"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/models"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/util"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/tree"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"gorm.io/gorm"
)

func NewRepo(data *db.Data) tree.Repo {
	return &repo{data: data}
}

type repo struct {
	data *db.Data
}

func (r *repo) do(ctx context.Context) *gorm.DB {
	return r.data.DB.WithContext(ctx)
}

func (r *repo) ExistByName(ctx context.Context, name string, excludedIds ...models.ModelID) (bool, error) {
	do := r.do(ctx)
	var count int64
	if len(excludedIds) > 0 {
		do = do.Where("id NOT IN ?", excludedIds)
	}

	if err := do.Model(&model.TreeInfo{}).Where("name = ?", name).Limit(1).Count(&count).Error; err != nil {
		log.WithContext(ctx).Errorf("failed to access db, err: %v", err)
		return false, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}

	return count > 0, nil
}

func (r *repo) ExistById(ctx context.Context, id models.ModelID) (bool, error) {
	do := r.do(ctx)
	var count int64
	if err := do.Model(&model.TreeInfo{}).Where("id = ?", id).Limit(1).Count(&count).Error; err != nil {
		log.WithContext(ctx).Errorf("failed to access db, err: %v", err)
		return false, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}

	return count > 0, nil
}

func (r *repo) Create(ctx context.Context, m *model.TreeInfo) error {
	// 生成该树的root节点
	rootNodeID, err := util.NewUniqueID()
	if err != nil {
		return err
	}

	rootNodeM := &model.TreeNode{
		ID:           models.NewModelID(rootNodeID),
		TreeID:       models.NewModelID(0),
		ParentID:     models.NewModelID(0), // root节点默认父节点为0
		Name:         m.Name,
		SortWeight:   0,
		CreatedByUID: m.CreatedByUID,
		UpdatedByUID: m.UpdatedByUID,
	}

	if m.ID.Uint64() == 0 {
		treeID, err := util.NewUniqueID()
		if err != nil {
			return err
		}

		m.ID = models.NewModelID(treeID)
	}

	rootNodeM.TreeID = m.ID
	m.RootNodeID = rootNodeM.ID

	if err = r.data.DB.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(m).Error; err != nil {
			return err
		}

		return tx.Create(rootNodeM).Error
	}); err != nil {
		log.WithContext(ctx).Errorf("failed to access db, err: %v", err)
		if mariadb.Is(err, mariadb.ER_DUP_ENTRY) {
			return errorcode.Desc(errorcode.TreeNameRepeat)
		}

		return errorcode.Detail(errorcode.PublicDatabaseError, err)
	}

	return nil
}

func (r *repo) Delete(ctx context.Context, id models.ModelID) (bool, error) {
	do := r.do(ctx)
	tx := do.Delete(&model.TreeInfo{}, id)
	if tx.Error != nil {
		log.WithContext(ctx).Errorf("failed to access db, err: %v", tx.Error)
		return false, errorcode.Detail(errorcode.PublicDatabaseError, tx.Error)
	}

	return tx.RowsAffected > 0, nil
}

func (r *repo) UpdateByEdit(ctx context.Context, m *model.TreeInfo) error {
	do := r.do(ctx)
	tx := do.Select("name", "updated_by_uid").Updates(m)
	if tx.Error != nil {
		log.WithContext(ctx).Errorf("failed to access db, err: %v", tx.Error)
		if mariadb.Is(tx.Error, mariadb.ER_DUP_ENTRY) {
			return errorcode.Desc(errorcode.TreeNameRepeat)
		}
		return errorcode.Detail(errorcode.PublicDatabaseError, tx.Error)
	}

	return nil
}

func (r *repo) Get(ctx context.Context, id models.ModelID) (*model.TreeInfo, error) {
	do := r.do(ctx)
	m := &model.TreeInfo{}
	if err := do.Take(m, id).Error; err != nil {
		log.WithContext(ctx).Errorf("failed to access db, err: %v", err)
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errorcode.Desc(errorcode.TreeNotExist)
		}

		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}

	return m, nil
}

func (r *repo) ListByPage(ctx context.Context, offset, limit int, sort, direction, keyword string) ([]*model.TreeInfo, int64, error) {
	var total int64
	var modelSli []*model.TreeInfo
	offset = limit * (offset - 1)

	if err := r.data.DB.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		tx = tx.WithContext(ctx)

		if len(keyword) > 0 {
			tx = tx.Where("name LIKE ?", "%"+util.KeywordEscape(keyword)+"%")
		}

		if err := tx.Model(&model.TreeInfo{}).Count(&total).Error; err != nil {
			return err
		} else if total < 1 {
			// 没有满足条件的记录
			return nil
		}

		if limit > 0 {
			tx = tx.Limit(limit).Offset(offset)
		}

		tx = tx.Order(sort + " " + direction).Order("id " + direction)

		return tx.Select("id", "name", "root_node_id").Find(&modelSli).Error
	}); err != nil {
		log.WithContext(ctx).Errorf("failed to access db, err: %v", err)
		return nil, 0, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}

	return modelSli, total, nil
}

func (r *repo) GetRootNodeId(ctx context.Context, id models.ModelID) (rootNodeId models.ModelID, err error) {
	do := r.do(ctx)
	// SELECT `root_node_id` FROM `tree_info` WHERE `id` = 1 AND `tree_info`.`deleted_at` = 0 LIMIT 1
	if err = do.Model(&model.TreeInfo{}).Select("root_node_id").Where("id = ?", id).Limit(1).Scan(&rootNodeId).Error; err != nil {
		log.WithContext(ctx).Errorf("failed to access db, err: %v", err)
		if errors.Is(err, gorm.ErrRecordNotFound) {
			err = errorcode.Desc(errorcode.TreeNotExist)
			return
		}

		err = errorcode.Detail(errorcode.PublicDatabaseError, err)
		return
	}

	return rootNodeId, nil
}
