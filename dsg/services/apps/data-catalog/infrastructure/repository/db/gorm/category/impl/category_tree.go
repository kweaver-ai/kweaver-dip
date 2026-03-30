package impl

import (
	"context"
	"errors"
	"fmt"
	"math/rand"
	"time"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/errorcode/mariadb"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/models"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/category"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"gorm.io/gorm"
)

const middleMax uint64 = 1 << 31

var (
	overflowMaxLayerErr = errors.New("layer overflow max layer")
	moveToSubErr        = errors.New("move to sub node")
)

type repoTree struct {
	data *db.Data
}

func NewRepoTree(data *db.Data) category.TreeRepo {
	return &repoTree{data: data}
}

func (r *repoTree) do(ctx context.Context) *gorm.DB {
	return r.data.DB.WithContext(ctx)
}

func (r *repoTree) Create(ctx context.Context, m *model.CategoryNode, maxLayer int) error {
	var curLayer int
	for i := 0; i < 3; i++ {
		if err := r.data.DB.Transaction(func(tx *gorm.DB) (err error) {
			tx = tx.WithContext(ctx)
			var minSortWeight *uint64
			// SELECT MIN(`sort_weight`) FROM `category_node`
			// WHERE parent_id = '6cc65e42-e048-11ee-b33b-b26fb506b477' AND
			// category_id = '9a6617ea-bc4c-4920-91aa-0cf95a9070ef' AND
			// `category_node`.`deleted_at` = 0

			if err = tx.Model(&model.CategoryNode{}).Debug().
				Select("MIN(sort_weight)").
				Where("parent_id = ?", m.ParentID).
				Where("category_id = ?", m.CategoryID).
				Scan(&minSortWeight).
				Error; err != nil {
				return err
			}

			switch {
			case minSortWeight == nil:
				m.SortWeight = middleMax

			case *minSortWeight <= startSortWeight:
				// 需要重排
				m.SortWeight, err = r.reorderNode(tx, models.ModelID(m.ParentID), models.ModelID(m.CategoryNodeID))
				if err != nil {
					return err
				}
			default:
				m.SortWeight = *minSortWeight - startSortWeight
			}

			// INSERT INTO `category_node`
			// (`parent_id`,`name`,`owner`,`owner_uid`,`sort_weight`,`creator_uid`,`creator_name`,`updater_uid`,`updater_name`,`deleted_at`,`deleter_uid`,`deleter_name`,`category_id`,`id`)
			// VALUES
			// ('6cc65e42-e048-11ee-b33b-b26fb506b477','888','user1','298f91fe-cfc4-11ee-afb7-aa64d8592e6f',2147482624,'298f91fe-cfc4-11ee-afb7-aa64d8592e6f','user1','','','0','','','9a6617ea-bc4c-4920-91aa-0cf95a9070ef',504494826574605871)

			if err := tx.Create(m).Error; err != nil {
				return err
			}

			n := &model.Category{
				UpdaterUID:  m.UpdaterUID,
				UpdaterName: m.UpdaterName,
			}

			if err := tx.Select("updater_name", "updater_uid").Debug().
				Where("category_id = ?", m.CategoryID).
				Updates(n).
				Error; err != nil {
				log.WithContext(ctx).Errorf("failed to access db, err: %v", err)
				if mariadb.Is(err, mariadb.ER_DUP_ENTRY) {
					return errorcode.Desc(errorcode.TreeNameRepeat)
				}
				return errorcode.Detail(errorcode.PublicDatabaseError, err)
			}

			curLayer := 0
			curM := &model.CategoryNode{ParentID: m.ParentID}
			for curM.ParentID != "0" {
				curLayer++
				// SELECT `parent_id` FROM `category_node`
				// WHERE
				// category_node_id = 'fc5918fe-9eb4-4670-92e0-94782f52d00b' AND
				// `category_node`.`deleted_at` = 0
				// LIMIT 1

				if err = tx.Select("parent_id").Where("category_node_id = ?", curM.ParentID).Take(curM).Error; err != nil {
					return err
				}
			}

			// 是否大于最大层级，-1是因为还有根节点
			if curLayer-1 >= maxLayer {
				return overflowMaxLayerErr
			}

			return nil
		}); err != nil {

			if errors.Is(err, overflowMaxLayerErr) {
				log.WithContext(ctx).Errorf("failed to insert tree node to db, layer gt max layer num, layer: %v", curLayer)
				return errorcode.Desc(errorcode.TreeNodeOverflowMaxLayer)
			}

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

func (r *repoTree) Delete(ctx context.Context, categoryid, id, updaterUID, updaterName string) (bool, error) {
	// 递归删除子节点
	var deleteRowsAffected int64
	if err := r.do(ctx).Transaction(func(tx *gorm.DB) error {
		tx = tx.WithContext(ctx)

		n := &model.Category{
			UpdaterUID:  updaterUID,
			UpdaterName: updaterName,
		}
		if err := tx.Select("updater_name", "updater_uid").Debug().
			Where("category_id = ?", categoryid).
			Updates(n).
			Error; err != nil {
			log.WithContext(ctx).Errorf("failed to access db, err: %v", err)
			return errorcode.Detail(errorcode.PublicDatabaseError, err)
		}

		needDelIds := make([]string, 0, 10)
		needDelIds = append(needDelIds, id)

		needSelectParentIds := make([]string, 0, 10)
		needSelectParentIds = append(needSelectParentIds, id)
		tmpIds := make([]string, 0, 10)
		for len(needSelectParentIds) > 0 {
			tmpIds = tmpIds[:0]
			// SELECT `category_node_id` FROM `category_node`
			// WHERE
			// `parent_id` IN ('48dac046-e03e-11ee-b33b-b26fb506b477')
			// AND `category_node`.`deleted_at` = 0
			if err := tx.Model(&model.CategoryNode{}).
				Select("category_node_id").
				Where("`parent_id` IN ?", needSelectParentIds).
				// Where("`category_id` = ?", treeId).
				Scan(&tmpIds).
				Error; err != nil {
				return err
			}
			needDelIds = append(needDelIds, tmpIds...)
			needSelectParentIds = append(needSelectParentIds[:0], tmpIds...)
		}
		// UPDATE `category_node`
		// SET
		// 	`deleted_at`=1710233606164
		// WHERE
		// `category_node_id` IN ('48dac046-e03e-11ee-b33b-b26fb506b477','a721d9e2-e04a-11ee-b33b-b26fb506b477') AND
		// `category_node`.`deleted_at` = 0
		t := tx.Where("`category_node_id` IN ?", needDelIds).Delete(&model.CategoryNode{})
		deleteRowsAffected = t.RowsAffected
		return t.Error
	}); err != nil {
		log.WithContext(ctx).Errorf("failed to access db, err: %v", err)
		return false, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}

	return deleteRowsAffected > 0, nil

}

func (r *repoTree) UpdateByEdit(ctx context.Context, m *model.CategoryNode) error {
	if err := r.data.DB.Transaction(func(tx *gorm.DB) (err error) {
		tx = tx.WithContext(ctx)

		n := &model.Category{
			UpdaterUID:  m.UpdaterUID,
			UpdaterName: m.UpdaterName,
		}

		if err := tx.Select("updater_name", "updater_uid").Debug().
			Where("`category_id` = ?", m.CategoryID).
			Updates(n).
			Error; err != nil {
			log.WithContext(ctx).Errorf("failed to access db, err: %v", err)
			if mariadb.Is(err, mariadb.ER_DUP_ENTRY) {
				return errorcode.Desc(errorcode.TreeNameRepeat)
			}
			return errorcode.Detail(errorcode.PublicDatabaseError, err)
		}

		if err := tx.
			Select("name", "owner", "owner_uid", "updater_name", "updater_uid").
			Where("`category_node_id` = ?", m.CategoryNodeID).
			Updates(m).
			Error; err != nil {
			log.WithContext(ctx).Errorf("failed to access db, err: %v", err)
			if mariadb.Is(err, mariadb.ER_DUP_ENTRY) {
				return errorcode.Desc(errorcode.TreeNameRepeat)
			}
			return errorcode.Detail(errorcode.PublicDatabaseError, err)
		}
		return nil

	}); err != nil {
		log.WithContext(ctx).Errorf("failed to access db, err: %v", err)
		return errorcode.Detail(errorcode.PublicDatabaseError, err)
	}
	return nil
}

func (r *repoTree) UpdateNodeRequired(ctx context.Context, categoryID, nodeID string, required int, updaterUID, updaterName string) error {
	if err := r.data.DB.Transaction(func(tx *gorm.DB) (err error) {
		tx = tx.WithContext(ctx)

		n := &model.Category{
			UpdaterUID:  updaterUID,
			UpdaterName: updaterName,
		}

		if err := tx.Select("updater_name", "updater_uid").
			Where("`category_id` = ?", categoryID).
			Updates(n).
			Error; err != nil {
			log.WithContext(ctx).Errorf("failed to access db, err: %v", err)
			if mariadb.Is(err, mariadb.ER_DUP_ENTRY) {
				return errorcode.Desc(errorcode.TreeNameRepeat)
			}
			return errorcode.Detail(errorcode.PublicDatabaseError, err)
		}

		m := &model.CategoryNode{
			CategoryNodeID: nodeID,
			Required:       required,
			UpdaterUID:     updaterUID,
			UpdaterName:    updaterName,
		}
		if err := tx.
			Select("required", "updater_name", "updater_uid").
			Where("`category_node_id` = ?", nodeID).
			Updates(m).
			Error; err != nil {
			log.WithContext(ctx).Errorf("failed to access db, err: %v", err)
			if mariadb.Is(err, mariadb.ER_DUP_ENTRY) {
				return errorcode.Desc(errorcode.TreeNameRepeat)
			}
			return errorcode.Detail(errorcode.PublicDatabaseError, err)
		}
		return nil
	}); err != nil {
		log.WithContext(ctx).Errorf("failed to access db, err: %v", err)
		return errorcode.Detail(errorcode.PublicDatabaseError, err)
	}
	return nil
}

func (r *repoTree) UpdateNodeRequiredExt(ctx context.Context, categoryID, nodeID string, required int, updaterUID, updaterName string) error {
	if err := r.data.DB.Transaction(func(tx *gorm.DB) (err error) {
		tx = tx.WithContext(ctx)

		if err := tx.Select("updater_name", "updater_uid").
			Where("`category_id` = ?", categoryID).
			Updates(&model.Category{
				UpdaterUID:  updaterUID,
				UpdaterName: updaterName,
			}).Error; err != nil {
			log.WithContext(ctx).Errorf("failed to access db, err: %v", err)
			if mariadb.Is(err, mariadb.ER_DUP_ENTRY) {
				return errorcode.Desc(errorcode.TreeNameRepeat)
			}
			return errorcode.Detail(errorcode.PublicDatabaseError, err)
		}

		m := &model.CategoryNodeExtModel{
			CategoryNodeID: nodeID,
			Required:       required,
			UpdaterUID:     updaterUID,
			UpdaterName:    updaterName,
		}
		if err := tx.Table(model.TableNameCategoryNodeExt).
			Select("required", "updater_name", "updater_uid").
			Where("`category_node_id` = ?", nodeID).
			Updates(m).
			Error; err != nil {
			log.WithContext(ctx).Errorf("failed to access db, err: %v", err)
			if mariadb.Is(err, mariadb.ER_DUP_ENTRY) {
				return errorcode.Desc(errorcode.TreeNameRepeat)
			}
			return errorcode.Detail(errorcode.PublicDatabaseError, err)
		}
		return nil
	}); err != nil {
		log.WithContext(ctx).Errorf("failed to access db, err: %v", err)
		return errorcode.Detail(errorcode.PublicDatabaseError, err)
	}
	return nil
}

func (r *repoTree) UpdateNodeSelected(ctx context.Context, nodeID string, selected int, updaterUID, updaterName string) error {
	if err := r.data.DB.Transaction(func(tx *gorm.DB) (err error) {
		tx = tx.WithContext(ctx)

		m := &model.CategoryNode{
			CategoryNodeID: nodeID,
			Selected:       selected,
			UpdaterUID:     updaterUID,
			UpdaterName:    updaterName,
		}
		if err := tx.
			Select("selected", "updater_name", "updater_uid").
			Where("`category_node_id` = ?", nodeID).
			Updates(m).
			Error; err != nil {
			log.WithContext(ctx).Errorf("failed to access db, err: %v", err)
			if mariadb.Is(err, mariadb.ER_DUP_ENTRY) {
				return errorcode.Desc(errorcode.TreeNameRepeat)
			}
			return errorcode.Detail(errorcode.PublicDatabaseError, err)
		}
		return nil
	}); err != nil {
		log.WithContext(ctx).Errorf("failed to access db, err: %v", err)
		return errorcode.Detail(errorcode.PublicDatabaseError, err)
	}
	return nil
}

func (r *repoTree) UpdateNodeSelectedExt(ctx context.Context, nodeID string, selected int, updaterUID, updaterName string) error {
	if err := r.data.DB.Transaction(func(tx *gorm.DB) (err error) {
		tx = tx.WithContext(ctx)

		m := &model.CategoryNodeExtModel{
			CategoryNodeID: nodeID,
			Selected:       selected,
			UpdaterUID:     updaterUID,
			UpdaterName:    updaterName,
		}
		if err := tx.Table(model.TableNameCategoryNodeExt).
			Select("selected", "updater_name", "updater_uid").
			Where("`category_node_id` = ?", nodeID).
			Updates(m).
			Error; err != nil {
			log.WithContext(ctx).Errorf("failed to access db, err: %v", err)
			if mariadb.Is(err, mariadb.ER_DUP_ENTRY) {
				return errorcode.Desc(errorcode.TreeNameRepeat)
			}
			return errorcode.Detail(errorcode.PublicDatabaseError, err)
		}
		return nil
	}); err != nil {
		log.WithContext(ctx).Errorf("failed to access db, err: %v", err)
		return errorcode.Detail(errorcode.PublicDatabaseError, err)
	}
	return nil
}

func (r *repoTree) ExistByName(ctx context.Context, name, parentId, nodeId, catalogId string) (bool, error) {
	do := r.do(ctx).Model(&model.CategoryNode{}).Debug()
	if nodeId != "" {
		do = do.Where("`category_node_id` != ?", nodeId)
	}

	var count int64
	if err := do.
		Where("`name` = ?", name).
		Where("`parent_id` = ?", parentId).
		Limit(1).
		Count(&count).
		Error; err != nil {
		log.WithContext(ctx).Errorf("failed to access db, err: %v", err)
		return false, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}

	return count > 0, nil
}

func (r *repoTree) ExistByID(ctx context.Context, catagoryNodeId, catagoryId string) (bool, error) {
	do := r.do(ctx).Model(&model.CategoryNode{}).Debug()
	var count int64
	if err := do.
		Where("`category_id` = ?", catagoryId).
		Where("`category_node_id` = ?", catagoryNodeId).
		Limit(1).
		Count(&count).
		Error; err != nil {
		log.WithContext(ctx).Errorf("failed to access db, err: %v", err)
		return false, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}

	return count > 0, nil
}

func (r *repoTree) GetParentID(ctx context.Context, nodeId string) (id string, err error) {
	do := r.do(ctx).Model(&model.CategoryNode{}).Debug()
	var parentID string
	if err := do.
		Select("parent_id").
		Where("`category_node_id` = ?", nodeId).
		Take(&parentID).
		Error; err != nil {
		log.WithContext(ctx).Errorf("failed to access db, err: %v", err)
		return "", errorcode.Detail(errorcode.PublicDatabaseError, err)
	}
	return parentID, nil
}

func (r *repoTree) GetNodeInfoById(ctx context.Context, nodeId string) (nodeInfo *model.CategoryNode, err error) {
	do := r.do(ctx).Model(&model.CategoryNode{}).Debug()
	if err := do.
		Select("parent_id", "name").
		Where("`category_node_id` = ?", nodeId).
		Take(&nodeInfo).
		Error; err != nil {
		log.WithContext(ctx).Errorf("failed to access db, err: %v", err)
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}

	return nodeInfo, nil
}

var errReorder = errors.New("node reorder")

func (r *repoTree) Reorder(ctx context.Context, id, destParentId, nextID, treeID models.ModelID, maxLayer int, updaterUID, updaterName string) error {
	if nextID.String() != "" {
		return r.insertSpecPos(ctx, id, destParentId, nextID, treeID, maxLayer, updaterUID, updaterName)
	} else {
		return r.insertTail(ctx, id, destParentId, treeID, maxLayer, updaterUID, updaterName)
	}
}

func (r *repoTree) insertSpecPos(ctx context.Context, id, destParentId, nextId, treeId models.ModelID, maxLayer int, updaterUID, updaterName string) error {
	needReorder := false
	reorderCnt := 0
	var curLayer int
	var err error
	for i := 0; i < 3; i++ {
		if i > 0 {
			r.sleep()
		}
		if err = r.do(ctx).Transaction(func(tx *gorm.DB) error {
			tx = tx.WithContext(ctx).Debug()
			n := &model.Category{
				UpdaterUID:  updaterUID,
				UpdaterName: updaterName,
			}
			if err := tx.Select("updater_name", "updater_uid").Debug().
				Where("`category_id` = ?", treeId.String()).
				Updates(n).
				Error; err != nil {
				log.WithContext(ctx).Errorf("failed to access db, err: %v", err)
				return errorcode.Detail(errorcode.PublicDatabaseError, err)
			}

			if needReorder {
				needReorder = false
				if _, err := r.reorderNode(tx, destParentId, treeId); err != nil {
					return err
				}
			}

			// 不允许将自身移动到自身的子节点下
			if err = r.moveToSubCheck(tx, id, destParentId); err != nil {
				return err
			}

			if nextId == id {
				return nil
			}
			nextNodeM := &model.CategoryNode{}
			// SELECT `id`,`sort_weight` FROM `tree_node`
			// WHERE
			//	`id` = 456805790380990931 AND
			//	`parent_id` = 456804971619295699 AND
			//	`tree_id` = 1 AND
			//	`tree_node`.`deleted_at` = 0
			// LIMIT 1
			if err = tx.
				Select("id", "sort_weight").
				Where("`category_node_id` = ?", nextId.String()).
				Where("`parent_id` = ?", destParentId.String()).
				Where("`category_id` = ?", treeId.String()).
				Take(nextNodeM).
				Error; err != nil {
				log.WithContext(ctx).Errorf("failed to access db, err: %v", err)
				return err
			}

			preNodeM := &model.CategoryNode{}
			notExistPreNodeM := false
			// SELECT `id`,`sort_weight` FROM `tree_node`
			// WHERE
			//	`parent_id` = 456804971619295699 AND
			//	`sort_weight` < 1536 AND
			//	`tree_id` = 1 AND
			//	`tree_node`.`deleted_at` = 0
			// ORDER BY `sort_weight` desc
			// LIMIT 1
			if err = tx.
				Select("category_id", "sort_weight").
				Where("`parent_id` = ?", destParentId.String()).
				Where("`sort_weight` < ?", nextNodeM.SortWeight).
				Where("`category_id` = ?", treeId.String()).
				Order("`sort_weight` desc").
				Take(preNodeM).
				Error; err != nil {
				if errors.Is(err, gorm.ErrRecordNotFound) {
					notExistPreNodeM = true
				} else {
					log.WithContext(ctx).Errorf("failed to access db, err: %v", err)
					return err
				}
			}

			var preSortWeight uint64
			nextSortWeight := nextNodeM.SortWeight
			if notExistPreNodeM {
				preSortWeight = beginSortWeight
			} else {
				if models.ModelID(preNodeM.CategoryID) == id {
					// 不需要移动
					return nil
				}

				preSortWeight = preNodeM.SortWeight
			}
			if nextSortWeight <= preSortWeight+1 {
				// 需要重新排序
				return errReorder
			}

			newSortWeight := (preSortWeight + nextSortWeight) >> 1
			// fmt.Println(newSortWeight, preSortWeight, nextSortWeight)
			if newSortWeight <= preSortWeight || newSortWeight >= nextSortWeight {
				// 需要重新排序
				return errReorder
			}

			// UPDATE `tree_node`
			// SET
			//	`parent_id`=456804971619295699,
			//	`sort_weight`=1280,
			//	`updated_at`='2023-04-18 17:03:17.736'
			// WHERE
			//	`id` = 456805800849973715 AND
			//	`tree_node`.`deleted_at` = 0

			if err = tx.
				Select("parent_id", "sort_weight").
				Where("`category_node_id` = ?", id.String()).
				Updates(&model.CategoryNode{
					ParentID:    destParentId.String(),
					SortWeight:  newSortWeight,
					UpdaterUID:  updaterName,
					UpdaterName: updaterName,
				}).
				Error; err != nil {
				log.WithContext(ctx).Errorf("failed to access db, err: %v", err)
				return err
			}

			// 判断移动后的node是否超过4层
			if curLayer, err = r.calcLayerNum(tx, id, destParentId, maxLayer); err != nil {
				return err
			}

			return nil
		}); err != nil {
			log.WithContext(ctx).Errorf("failed to access db, err: %v", err)

			if errors.Is(err, gorm.ErrRecordNotFound) {
				return errorcode.Desc(errorcode.TreeNodeNotExist)
			}

			if errors.Is(err, errReorder) {
				needReorder = true
				reorderCnt++
				if reorderCnt <= 3 {
					i--
				}
				continue
			}

			if mariadb.Is(err, mariadb.ER_DUP_ENTRY) {
				log.WithContext(ctx).Warnf("txn conflict in create node, retry count: %v", i)
				continue
			}

			if errors.Is(err, overflowMaxLayerErr) {
				log.WithContext(ctx).Errorf("failed to insert tree node to db, layer gt max layer num, layer: %v", curLayer)
				return errorcode.Desc(errorcode.CategoryNodeOverflowMaxLayer)
			}

			if errors.Is(err, moveToSubErr) {
				log.WithContext(ctx).Errorf("failed to insert tree node to db, not allowed insert to sub nodes")
				return errorcode.Desc(errorcode.CategoryNodeMoveToSubErr)
			}

			return errorcode.Detail(errorcode.PublicDatabaseError, err)
		}

		break
	}

	if err != nil {
		log.WithContext(ctx).Errorf("internal error, err: %v", err)
		return errorcode.Detail(errorcode.PublicInternalError, err)
	}

	return nil
}

func (r *repoTree) insertTail(ctx context.Context, id, destParentId, treeId models.ModelID, maxLayer int, updaterUID, updaterName string) error {
	curLayer := 0
	var err error
	for i := 0; i < 3; i++ {
		if i > 0 {
			r.sleep()
		}
		if err = r.do(ctx).Transaction(func(tx *gorm.DB) error {
			tx = tx.WithContext(ctx)

			n := &model.Category{
				UpdaterUID:  updaterUID,
				UpdaterName: updaterName,
			}
			if err := tx.Select("updater_name", "updater_uid").Debug().
				Where("`category_id` = ?", treeId.String()).
				Updates(n).
				Error; err != nil {
				log.WithContext(ctx).Errorf("failed to access db, err: %v", err)
				return errorcode.Detail(errorcode.PublicDatabaseError, err)
			}

			// 不允许将自身移动到自身的子节点下
			if err := r.moveToSubCheck(tx, id, destParentId); err != nil {
				return err
			}
			maxM := &model.CategoryNode{}
			if err := tx.
				Select("id", "sort_weight").
				Where("`category_id` = ?", treeId.String()).
				Where("`parent_id` = ?", destParentId.String()).
				Order("`sort_weight` desc").
				Limit(1).
				Find(maxM).
				Error; err != nil {
				log.WithContext(ctx).Errorf("failed to access db, err: %v", err)
				return err
			}

			// if !maxM.ID.IsInvalid() && maxM.ID == id {
			if models.ModelID(maxM.CategoryNodeID) == id {
				// 要移动的node本身就在该在的位置上，不需要操作
				return nil
			}

			var maxSortWeight *uint64
			// if !maxM.ID.IsInvalid() {
			maxSortWeight = &maxM.SortWeight
			// }

			insertM := &model.CategoryNode{
				CategoryNodeID: id.String(),
				ParentID:       destParentId.String(),
				UpdaterUID:     updaterUID,
				UpdaterName:    updaterName,
			}

			var err error
			switch {
			case maxSortWeight == nil:
				insertM.SortWeight = startSortWeight

			case *maxSortWeight > sortWeightMax:
				// 需要重排
				_, err = r.reorderNode(tx, destParentId, treeId)
				insertM.SortWeight = middleMax + sortWeightIncrement
				if err != nil {
					return err
				}

			default:
				insertM.SortWeight = *maxSortWeight + sortWeightIncrement
			}

			do := tx.Select("parent_id", "sort_weight").Where("`category_node_id` = ?", id.String())
			if err = do.Updates(insertM).Error; err != nil {
				log.WithContext(ctx).Errorf("failed to access db, err: %v", err)
				return err
			}

			// 判断移动后的node是否超过4层
			// if curLayer, err = r.calcLayerNum(tx, insertM.ID, insertM.ParentID, maxLayer); err != nil {
			if curLayer, err = r.calcLayerNum(tx, id, destParentId, maxLayer); err != nil {
				return err
			}

			return nil
		}); err != nil {
			log.WithContext(ctx).Errorf("failed to access db, err: %v", err)
			if mariadb.Is(err, mariadb.ER_DUP_ENTRY) {
				log.WithContext(ctx).Warnf("txn conflict in create node, retry count: %v", i)
				continue
			}

			if errors.Is(err, overflowMaxLayerErr) {
				log.WithContext(ctx).Errorf("failed to insert tree node to db, layer gt max layer num, layer: %v", curLayer)
				return errorcode.Desc(errorcode.CategoryNodeOverflowMaxLayer)
			}

			if errors.Is(err, moveToSubErr) {
				log.WithContext(ctx).Errorf("failed to insert tree node to db, not allowed insert to sub nodes")
				return errorcode.Desc(errorcode.CategoryNodeMoveToSubErr)
			}

			if errors.Is(err, gorm.ErrRecordNotFound) {
				return errorcode.Desc(errorcode.CategoryNodeNotExist)
			}

			return errorcode.Detail(errorcode.PublicDatabaseError, err)
		}

		break
	}

	if err != nil {
		log.WithContext(ctx).Errorf("internal error, err: %v", err)
		return errorcode.Detail(errorcode.PublicInternalError, err)
	}
	return nil
}

func (r *repoTree) moveToSubCheck(tx *gorm.DB, id, parentId models.ModelID) error {
	// parentM := &model.TreeNode{ParentID: parentId}
	parentM := &model.CategoryNode{ParentID: parentId.String()}

	for parentM.ParentID != "0" {
		fmt.Println(parentM.ParentID)

		if parentM.ParentID == id.String() {
			// 不允许将自身移动到自身的子节点下
			return moveToSubErr
		}

		// SELECT `parent_id` FROM `tree_node`
		// WHERE
		//	`tree_node`.`id` = 456804971619295699 AND
		//	`tree_node`.`deleted_at` = 0
		// LIMIT 1
		if err := tx.Select("parent_id").Where("category_node_id = ?", parentM.ParentID).Take(parentM).Error; err != nil {
			log.Errorf("failed to access db, err: %v", err)
			return err
		}
	}

	return nil
}

func (r *repoTree) reorderNode(tx *gorm.DB, parentID, treeID models.ModelID) (uint64, error) {
	var nodes []*model.CategoryNode
	// SELECT `id`,`sort_weight` FROM `tree_node`
	// WHERE
	//	`parent_id` = 456804971619295699 AND
	//	`tree_id` = 1 AND
	//	`tree_node`.`deleted_at` = 0
	// ORDER BY `sort_weight` asc
	if err := tx.Set("gorm:query_option", "FOR UPDATE").
		Select("category_node_id", "sort_weight").
		Where("`parent_id` = ?", parentID.String()).
		Where("`category_id` = ?", treeID.String()).
		Order("`sort_weight` asc").
		Find(&nodes).Error; err != nil {
		log.Errorf("failed to access db, err: %v", err)
		return 0, err
	}

	var offset uint64 = middleMax
	var err error

	txnConflictNode := make([]*model.CategoryNode, 0)
	for _, node := range nodes {
		if offset > sortWeightMax {
			return 0, fmt.Errorf("internal error: sort weight value gt %v", sortWeightMax)
		}
		// UPDATE `tree_node`
		// SET
		//	`sort_weight`=512,
		//	`updated_at`='2023-04-18 17:16:24.9'
		// WHERE
		//	`id` = 456804994402755027 AND
		//	`tree_node`.`deleted_at` = 0
		if err = tx.Model(&model.CategoryNode{}).
			Where("`category_node_id` = ?", node.CategoryNodeID).
			Update("sort_weight", offset).
			Error; err != nil {
			if mariadb.Is(err, mariadb.ER_DUP_ENTRY) {
				node.SortWeight = offset
				txnConflictNode = append(txnConflictNode, node)
			} else {
				log.Errorf("failed to access db, err: %v", err)
				return 0, err
			}
		}

		offset -= sortWeightIncrement
	}

	for i := len(txnConflictNode) - 1; i >= 0; i-- {
		node := txnConflictNode[i]
		// UPDATE `tree_node`
		// SET
		//	`sort_weight`=1536,
		//	`updated_at`='2023-04-18 17:25:41.776'
		// WHERE
		//	`id` = 456805774627185107 AND
		//	`tree_node`.`deleted_at` = 0
		if err = tx.Model(&model.CategoryNode{}).
			Where("`category_node_id` = ?", node.ID).
			Update("sort_weight", node.SortWeight).
			Error; err != nil {
			log.Errorf("failed to access db, err: %v", err)
			return 0, err
		}
	}

	if offset > sortWeightMax {
		return 0, fmt.Errorf("internal error: sort weight value gt %v", sortWeightMax)
	}

	return offset, nil
}

func (r *repoTree) calcLayerNum(tx *gorm.DB, id, parentId models.ModelID, maxLayer int) (curLayer int, err error) {
	// 判断移动后的node是否超过4层
	curLayer = -1
	curM := &model.CategoryNode{ParentID: parentId.String()}
	// 向上找
	for curM.ParentID != "0" {
		curLayer++
		// SELECT `parent_id` FROM `tree_node` WHERE `tree_node`.`id` = 456804971619295699 AND `tree_node`.`deleted_at` = 0 LIMIT 1
		// if err = tx.Select("parent_id").Take(curM, curM.ParentID).Error; err != nil {
		if err = tx.Select("parent_id").Where("category_node_id = ?", curM.ParentID).Take(curM).Error; err != nil {
			log.Errorf("failed to access db, err: %v", err)
			return
		}

		if curLayer > maxLayer+1 {
			err = overflowMaxLayerErr
			return
		}
	}

	// 向下找
	selectIds := make([]string, 0, 10)
	selectIds = append(selectIds, id.String())
	retIds := make([]string, 0, 10)
	for {

		retIds = retIds[:0]
		// SELECT `id` FROM `tree_node` WHERE `parent_id` IN (456805800849973715) AND `tree_node`.`deleted_at` = 0
		if err = tx.Model(&model.CategoryNode{}).
			Select("category_node_id").
			Where("`parent_id` IN ?", selectIds).
			Scan(&retIds).Error; err != nil {
			return
		}
		curLayer++
		if len(retIds) < 1 {
			break
		}

		selectIds = append(selectIds[:0], retIds...)
	}

	if curLayer > maxLayer {
		err = overflowMaxLayerErr
		return
	}

	return
}

func (r *repoTree) sleep() {
	time.Sleep(time.Duration(rand.Intn(3))*100*time.Millisecond + 100*time.Millisecond)
}

func (r *repoTree) GetCategoryNodeByID(ctx context.Context, id string) (categoryNode *model.CategoryNode, err error) {
	err = r.data.DB.WithContext(ctx).Where("category_node_id = ?", id).Take(&categoryNode).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return categoryNode, errorcode.Desc(errorcode.CategoryNodeNotExist)
		}
		return categoryNode, errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	return categoryNode, nil
}
