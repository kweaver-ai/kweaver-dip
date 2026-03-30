package impl

import (
	"context"
	"errors"
	"time"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/common_model"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/constant"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/errorcode/mariadb"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/category"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"gorm.io/gorm"
)

const (
	beginSortWeight     uint64 = 0
	startSortWeight     uint64 = 1 << 9
	sortWeightMax       uint64 = 1 << 62
	sortWeightIncrement uint64 = 1 << 9
)

type repo struct {
	data *db.Data
	DB   *gorm.DB
}

func NewRepo(data *db.Data) category.Repo {
	return &repo{
		data: data,
		DB:   data.DB,
	}
}

func (r *repo) do(ctx context.Context) *gorm.DB {
	return r.data.DB.WithContext(ctx)
}
func (r *repo) db(tx []*gorm.DB) *gorm.DB {
	if len(tx) > 0 && tx[0] != nil {
		return tx[0]
	}
	return r.DB
}

func (r *repo) CreateCategory(ctx context.Context, m *model.Category, nodes []*model.CategoryNode, n *model.CategoryNode) error {
	if len(nodes) == 0 {
		return errors.New("category nodes cannot be empty")
	}
	for i := 0; i < 3; i++ {
		if err := r.data.DB.Transaction(func(tx *gorm.DB) (err error) {
			tx = tx.WithContext(ctx)
			if err = tx.Create(m).Error; err != nil {
				return err
			}
			now := time.Now()
			extNodes := make([]*model.CategoryNodeExtModel, 0, len(nodes))
			for _, node := range nodes {
				if node == nil {
					continue
				}

				extNodes = append(extNodes, &model.CategoryNodeExtModel{
					CategoryNodeID: node.CategoryNodeID,
					CategoryID:     node.CategoryID,
					ParentID:       node.ParentID,
					Name:           node.Name,
					Owner:          node.Owner,
					OwnerUID:       node.OwnerUID,
					Required:       node.Required,
					Selected:       node.Selected,
					SortWeight:     node.SortWeight,
					CreatorUID:     node.CreatorUID,
					CreatorName:    node.CreatorName,
					UpdaterUID:     node.UpdaterUID,
					UpdaterName:    node.UpdaterName,
					CreatedAt:      now,
					UpdatedAt:      now,
				})
			}
			if len(extNodes) > 0 {
				if err = tx.Table(model.TableNameCategoryNodeExt).Create(&extNodes).Error; err != nil {
					return err
				}
			}
			if err = tx.Create(n).Error; err != nil {
				return err
			}
			return nil
		}); err != nil {
			log.WithContext(ctx).Errorf("failed to access db, err: %v", err)
			if mariadb.Is(err, mariadb.ER_DUP_ENTRY) {
				log.WithContext(ctx).Warnf("txn conflict in create node, retry count: %v", i)
				continue
			}
			return errorcode.Detail(errorcode.PublicDatabaseError, err)
		}

		break
	}

	return nil
}

func (r *repo) Delete(ctx context.Context, id string) (bool, error) {
	var deleteRowsAffected int64
	if err := r.do(ctx).Transaction(func(tx *gorm.DB) error {

		var nodes *model.Category

		tx = tx.WithContext(ctx).Debug()

		if err := tx.Select("using").
			Where("category_id = ?", id).
			Find(&nodes).
			Error; err != nil {
			log.WithContext(ctx).Errorf("failed to access db, err: %v", err)
			return err
		}

		if nodes.Using == 1 {
			return errorcode.Desc(errorcode.CategoryUsingDelete)
		}

		t := tx.Where("category_id = ?", id).Delete(&model.Category{})
		// deleteRowsAffected = t.RowsAffected
		if t.Error != nil {
			return t.Error
		}

		c := tx.Where("category_id = ?", id).Delete(&model.CategoryNode{})
		if c.Error != nil {
			return c.Error
		}
		deleteRowsAffected = c.RowsAffected

		ext := tx.Table(model.TableNameCategoryNodeExt).
			Where("`category_id` = ?", id).
			Delete(&model.CategoryNodeExtModel{})
		if ext.Error != nil {
			return ext.Error
		}
		return nil

	}); err != nil {
		log.WithContext(ctx).Errorf("failed to access db, err: %v", err)
		return false, err
	}
	return deleteRowsAffected > 0, nil
}

func (r *repo) UpdateByEdit(ctx context.Context, m *model.Category) error {
	do := r.do(ctx)
	if err := do.
		Select("name", "description", "updated_by_uid", "updater_name", "updater_uid").
		Where("category_id = ?", m.CategoryID).
		Updates(m).
		Error; err != nil {
		log.WithContext(ctx).Errorf("failed to access db, err: %v", err)
		if mariadb.Is(err, mariadb.ER_DUP_ENTRY) {
			return errorcode.Desc(errorcode.TreeNameRepeat)
		}
		return errorcode.Detail(errorcode.PublicDatabaseError, err)
	}
	return nil
}

func (r *repo) EditUsing(ctx context.Context, m *model.Category) error {
	do := r.do(ctx)
	do = do.Select("using", "updater_name", "updater_uid")
	if m.Using == 0 {
		do = do.Select("using", "sort_weight", "updater_name", "updater_uid")
	}
	if err := do.
		Where("category_id = ?", m.CategoryID).
		Updates(m).
		Error; err != nil {
		log.WithContext(ctx).Errorf("failed to access db, err: %v", err)
		if mariadb.Is(err, mariadb.ER_DUP_ENTRY) {
			return errorcode.Desc(errorcode.TreeNameRepeat)
		}
		return errorcode.Detail(errorcode.PublicDatabaseError, err)
	}

	return nil
}

func (r *repo) BatchEdit(ctx context.Context, BatchEdit []model.Category) error {

	if err := r.data.DB.Transaction(func(tx *gorm.DB) (err error) {
		tx = tx.WithContext(ctx)
		for _, m := range BatchEdit {
			var nodes *model.Category
			if err := tx.Select("using").
				Where("category_id = ?", m.CategoryID).
				Find(&nodes).
				Error; err != nil {
				log.WithContext(ctx).Errorf("failed to access db, err: %v", err)
				return err
			}
			if nodes.Using == 0 {
				return errorcode.Desc(errorcode.CategoryNotUsing)
			}
			if err := tx.
				Select("sort_weight", "updater_name", "updater_uid").
				Where("`category_id` = ?", m.CategoryID).
				Updates(m).
				Error; err != nil {
				log.WithContext(ctx).Errorf("failed to access db, err: %v", err)
				if mariadb.Is(err, mariadb.ER_DUP_ENTRY) {
					return errorcode.Desc(errorcode.TreeNameRepeat)
				}
				return errorcode.Detail(errorcode.PublicDatabaseError, err)
			}

		}

		return nil
	}); err != nil {
		log.WithContext(ctx).Errorf("failed to access db, err: %v", err)
		if mariadb.Is(err, mariadb.ER_DUP_ENTRY) {
			log.WithContext(ctx).Warnf("txn conflict in create node, retry count: %v", "i")

		}
		return err
	}

	return nil

}

func (r *repo) ExistByName(ctx context.Context, name, id string) (bool, error) {
	do := r.do(ctx).Model(&model.Category{}).Debug()
	if id != "" {
		do = do.Where("category_id != ?", id)
	}
	var count int64
	if err := do.
		Where("name = ?", name).
		Limit(1).
		Count(&count).
		Error; err != nil {
		log.WithContext(ctx).Errorf("failed to access db, err: %v", err)
		return false, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}

	return count > 0, nil
}

func (r *repo) ExistByID(ctx context.Context, id string) (bool, error) {
	do := r.do(ctx).Model(&model.Category{}).Debug()
	var count int64
	if err := do.
		Where("category_id = ?", id).
		Limit(1).
		Count(&count).
		Error; err != nil {
		log.WithContext(ctx).Errorf("failed to access db, err: %v", err)
		return false, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}

	return count > 0, nil
}

func (r *repo) GetCategory(ctx context.Context, id string) (*model.Category, error) {
	var nodes *model.Category
	if err := r.do(ctx).
		// SELECT
		//	`id`,`parent_id`,`name`,`describe`,`category_num`,`mgm_dep_id`,`mgm_dep_name`,`sort_weight`,`created_at`,`updated_at`
		// FROM
		//	`tree_node`
		// WHERE
		//	`tree_id` = 1 AND
		//	`tree_node`.`deleted_at` = 0
		Select("category_id", "name", "using", "type", "required", "description", "created_at", "creator_name", "updated_at", "updater_name").
		// Select(*).
		Where("category_id = ?", id).
		Find(&nodes).
		Error; err != nil {
		log.WithContext(ctx).Errorf("failed to access db, err: %v", err)
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}

	return nodes, nil
}

func (r *repo) GetCategoryByUsing(ctx context.Context, using int) ([]*model.Category, error) {
	var nodes []*model.Category
	if err := r.do(ctx).
		// SELECT
		//	`id`,`parent_id`,`name`,`describe`,`category_num`,`mgm_dep_id`,`mgm_dep_name`,`sort_weight`,`created_at`,`updated_at`
		// FROM
		//	`tree_node`
		// WHERE
		//	`tree_id` = 1 AND
		//	`tree_node`.`deleted_at` = 0
		Select("category_id", "name", "using", "type", "required", "description", "created_at", "creator_name", "updated_at", "updater_name").
		// Select(*).
		Where("`using` = ?", using).
		Where("`type` = ?", "customize").
		Find(&nodes).
		Error; err != nil {
		log.WithContext(ctx).Errorf("failed to access db, err: %v", err)
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}

	return nodes, nil
}

func (r *repo) GetAllCategory(ctx context.Context, keyword string) ([]*model.Category, error) {
	var nodes []*model.Category

	// tx = tx.WithContext(ctx)
	var minSortWeight *uint64
	// SELECT MIN(`sort_weight`) FROM `tree_node`
	// WHERE
	// 	`tree_id` = 1 AND
	//	`tree_node`.`deleted_at` = 0
	// if err = tx.Model(&model.TreeNode{}).
	tx := r.do(ctx)
	if err := tx.Model(&model.Category{}).
		Select("MIN(`sort_weight`)").
		Where("`using` = ?", 1).
		Scan(&minSortWeight).
		Error; err != nil {
		return nil, err
	}

	// if keyword != "" {
	// 	tx = tx.Where("name like ?", "%"+keyword+"%")
	// }

	if *minSortWeight == middleMax {
		if err := tx.
			// SELECT
			//	`id`,`parent_id`,`name`,`describe`,`category_num`,`mgm_dep_id`,`mgm_dep_name`,`sort_weight`,`created_at`,`updated_at`
			// FROM
			//	`tree_node`
			// WHERE
			//	`tree_id` = 1 AND
			//	`tree_node`.`deleted_at` = 0
			Select("category_id", "name", "using", "type", "required", "description", "created_at", "updated_at").
			Where("name like ?", "%"+keyword+"%").
			Order("`using` desc").
			Order("`type` desc").
			Order("`updated_at` desc").
			Find(&nodes).
			Error; err != nil {
			log.WithContext(ctx).Errorf("failed to access db, err: %v", err)
			return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
		}
	} else {
		var a []*model.Category
		if err := tx.
			// SELECT
			// 	`category_id`,`name`,`using`,`type`,`required`,`description`,`created_at`,`updated_at`
			// FROM
			// 	`category`
			// WHERE
			// 	`using` = 1 AND
			// 	`category`.`deleted_at` = 0 ORDER BY `sort_weight` asc,`updated_at` asc

			Select("category_id", "name", "using", "type", "required", "description", "created_at", "updated_at").
			Where("name like ?", "%"+keyword+"%").
			Where("`using` = ?", 1).
			Order("`sort_weight` asc").
			Order("`updated_at` asc").
			Find(&a).
			Error; err != nil {
			log.WithContext(ctx).Errorf("failed to access db, err: %v", err)
			return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
		}
		var b []*model.Category
		if err := tx.
			// SELECT
			// 	`category_id`,`name`,`using`,`type`,`required`,`description`,`created_at`,`updated_at`
			// FROM
			// 	`category`
			// WHERE
			// 	`using` = 0
			// 	AND `category`.`deleted_at` = 0 ORDER BY `sort_weight` asc,`updated_at` desc

			Select("category_id", "name", "using", "type", "required", "description", "created_at", "updated_at").
			Where("name like ?", "%"+keyword+"%").
			Where("`using` = ?", 0).
			Order("`sort_weight` asc").
			Order("`updated_at` desc").
			Find(&b).
			Error; err != nil {
			log.WithContext(ctx).Errorf("failed to access db, err: %v", err)
			return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
		}
		c := append(a, b...)
		nodes = c
	}

	return nodes, nil
}

func (r *repo) ListTree(ctx context.Context, id string) ([]*model.CategoryNodeExt, error) {
	var nodes []*model.CategoryNodeExt
	if err := r.do(ctx).
		Select("category_node_id", "parent_id", "name", "owner", "owner_uid", "required", "selected", "sort_weight", "created_at", "updated_at").
		Where("`category_id` = ?", id).
		Find(&nodes).
		Error; err != nil {
		log.WithContext(ctx).Errorf("failed to access db, err: %v", err)
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}

	return nodes, nil
}

func (r *repo) ListTreeExt(ctx context.Context, id string) ([]*model.CategoryNodeExt, error) {
	var rawNodes []*model.CategoryNode
	if err := r.do(ctx).
		Table(model.TableNameCategoryNodeExt).
		Select("category_node_id", "parent_id", "name", "owner", "owner_uid", "required", "selected", "sort_weight", "created_at", "updated_at").
		Where("`category_id` = ?", id).
		Find(&rawNodes).Error; err != nil {
		log.WithContext(ctx).Errorf("failed to access db, err: %v", err)
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}

	nodes := make([]*model.CategoryNodeExt, 0, len(rawNodes))
	for _, n := range rawNodes {
		if n == nil {
			continue
		}
		nodes = append(nodes, &model.CategoryNodeExt{CategoryNode: n})
	}
	return nodes, nil
}
func (r *repo) GetCategoryByID(ctx context.Context, id string) (category *model.Category, err error) {
	err = r.data.DB.WithContext(ctx).Where("category_id = ?", id).Take(&category).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return category, errorcode.Desc(errorcode.CategoryNotExist)
		}
		return category, errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	return category, nil
}
func (r *repo) GetCategoryByIDs(ctx context.Context, ids []string) (categoryList []*model.Category, err error) {
	err = r.data.DB.WithContext(ctx).Where("category_id in ?", ids).Find(&categoryList).Error
	return
}

func (r *repo) GetCategoryNodeByNames(ctx context.Context, names []string) (categoryNode []*model.CategoryNode, err error) {
	err = r.data.DB.WithContext(ctx).Where("name in ?", names).Find(&categoryNode).Error
	return
}
func (r *repo) GetCategoryAndNodeByNodeID(ctx context.Context, nodeIds []string) (res []*common_model.CategoryInfo, err error) {
	if len(nodeIds) == 0 {
		return []*common_model.CategoryInfo{}, nil
	}

	db := r.data.DB.WithContext(ctx)
	if err = db.Raw("select c.category_id category_id,c.`name` category,n.category_node_id category_node_id,n.`name`category_node FROM category c inner join category_node_ext n on c.category_id=n.category_id WHERE n.category_node_id in ?", nodeIds).Scan(&res).Error; err != nil {
		return nil, err
	}
	if len(res) == len(nodeIds) {
		return res, nil
	}

	found := make(map[string]struct{}, len(res))
	for _, item := range res {
		if item == nil {
			continue
		}
		found[item.CategoryNodeID] = struct{}{}
	}

	missing := make([]string, 0, len(nodeIds)-len(found))
	for _, id := range nodeIds {
		if _, ok := found[id]; !ok {
			missing = append(missing, id)
		}
	}

	if len(missing) == 0 {
		return res, nil
	}

	var fallback []*common_model.CategoryInfo
	if err = db.Raw("select c.category_id category_id,c.`name` category,n.category_node_id category_node_id,n.`name`category_node FROM category c inner join category_node n on c.category_id=n.category_id WHERE n.category_node_id in ?", missing).Scan(&fallback).Error; err != nil {
		return nil, err
	}

	res = append(res, fallback...)
	return res, nil
}
func (r *repo) UpdateInfoSystemSubjectCategory(ctx context.Context, catalogID uint64, category []*model.TDataCatalogCategory, tx ...*gorm.DB) error {
	var err error

	if err = r.db(tx).WithContext(ctx).Where("(category_type=? or category_type=?) and catalog_id=? ", constant.CategoryTypeInfoSystem, constant.CategoryTypeSubject, catalogID).Delete(&model.TDataCatalogCategory{}).Error; err != nil {
		return err
	}
	if len(category) != 0 {
		if err = r.db(tx).WithContext(ctx).Create(&category).Error; err != nil {
			return err
		}
	}
	return nil
}
