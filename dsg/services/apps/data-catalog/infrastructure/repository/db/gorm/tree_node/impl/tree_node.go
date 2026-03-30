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
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/util"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/tree_node"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/samber/lo"
	"gorm.io/gorm"
)

type repo struct {
	data *db.Data
}

func NewRepo(data *db.Data) tree_node.Repo {
	return &repo{data: data}
}

func (r *repo) do(ctx context.Context) *gorm.DB {
	return r.data.DB.WithContext(ctx)
}

func (r *repo) treeDo(ctx context.Context) *gorm.DB {
	return r.data.DB.WithContext(ctx).Model((*model.TreeInfo)(nil))
}

func (r *repo) ListByKeyword(ctx context.Context, treeID models.ModelID, keyword string) ([]*model.TreeNodeExt, error) {
	var nodes []*model.TreeNodeExt
	if err := r.do(ctx).Transaction(func(tx *gorm.DB) error {
		tx = tx.WithContext(ctx)
		{
			tx1 := tx.Raw(`
				SELECT id,name FROM tree_node
				WHERE
					tree_id = ? AND
					name LIKE concat("%", ?, "%") AND
					tree_node.deleted_at = 0
				ORDER BY sort_weight asc;
			`, treeID, keyword)
			if err := tx1.Scan(&nodes).Error; err != nil {
				return err
			}
		}

		if len(nodes) < 1 {
			return nil
		}

		if err := r.addExpansion(tx, nodes); err != nil {
			return err
		}
		return nil
	}); err != nil {
		log.WithContext(ctx).Errorf("failed to access db, err: %v", err)
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}
	return nodes, nil
}

func (r *repo) ExistByIdAndTreeId(ctx context.Context, id, treeId models.ModelID) (bool, error) {
	do := r.do(ctx).Model(&model.TreeNode{})
	var count int64
	// SELECT count(*) FROM `tree_node`
	// WHERE
	//	`id` = 456804994402755027 AND
	//	`tree_id` = 1 AND
	//	`tree_node`.`deleted_at` = 0
	// LIMIT 1
	if err := do.
		Where("id = ?", id).
		Where("tree_id = ?", treeId).
		Limit(1).
		Count(&count).
		Error; err != nil {
		log.WithContext(ctx).Errorf("failed to access db, err: %v", err)
		return false, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}

	return count > 0, nil
}

func (r *repo) ExistByIdAndParentIdTreeId(ctx context.Context, id, parentId, treeId models.ModelID) (bool, error) {
	do := r.do(ctx)
	var count int64
	// SELECT count(*) FROM `tree_node`
	// WHERE
	//	`id` = 456805790380990931 AND
	//	`parent_id` = 456804971619295699 AND
	//	`tree_id` = 1 AND
	//	`tree_node`.`deleted_at` = 0
	// LIMIT 1
	if err := do.Model(&model.TreeNode{}).
		Where("id = ?", id).
		Where("parent_id = ?", parentId).
		Where("tree_id = ?", treeId).
		Limit(1).
		Count(&count).
		Error; err != nil {
		log.WithContext(ctx).Errorf("failed to access db, err: %v", err)
		return false, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}

	return count > 0, nil
}

func (r *repo) ExistByNameAndTreeId(ctx context.Context, name string, treeId models.ModelID, excludedIds ...models.ModelID) (bool, error) {
	do := r.do(ctx).Model(&model.TreeNode{})
	var count int64
	if len(excludedIds) > 0 {
		do = do.Where("id NOT IN ?", excludedIds)
	}
	if err := do.
		Where("name = ?", name).
		Where("tree_id = ?", treeId).
		Limit(1).
		Count(&count).
		Error; err != nil {
		log.WithContext(ctx).Errorf("failed to access db, err: %v", err)
		return false, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}

	return count > 0, nil
}

func (r *repo) ExistByName(ctx context.Context, name string, parentId, treeId models.ModelID, excludedIds ...models.ModelID) (bool, error) {
	do := r.do(ctx).Model(&model.TreeNode{})
	var count int64
	if len(excludedIds) > 0 {
		do = do.Where("id NOT IN ?", excludedIds)
	}
	if err := do.
		// SELECT count(*) FROM `tree_node`
		// WHERE
		//	`name` = '1-1-1-1五级分类' AND
		//	`parent_id` = 456804994402755027 AND
		//	`tree_id` = 1 AND
		//	`tree_node`.`deleted_at` = 0
		// LIMIT 1
		//
		// SELECT count(*) FROM `tree_node`
		// WHERE
		//	`id` NOT IN (456805951593259475) AND
		//	`name` = '3-编辑目录名称' AND
		//	`parent_id` = 1 AND
		//	`tree_id` = 1 AND
		//	`tree_node`.`deleted_at` = 0
		// LIMIT 1
		Where("name = ?", name).
		Where("parent_id = ?", parentId).
		Where("tree_id = ?", treeId).
		Limit(1).
		Count(&count).
		Error; err != nil {
		log.WithContext(ctx).Errorf("failed to access db, err: %v", err)
		return false, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}

	return count > 0, nil
}

const (
	beginSortWeight     uint64 = 0
	startSortWeight     uint64 = 1 << 9
	sortWeightMax       uint64 = 1 << 62
	sortWeightIncrement uint64 = 1 << 9
)

var (
	overflowMaxLayerErr = errors.New("layer overflow max layer")
	moveToSubErr        = errors.New("move to sub node")
)

func (r *repo) InsertWithMaxLayer(ctx context.Context, m *model.TreeNode, maxLayer int) error {
	var curLayer int
	for i := 0; i < 3; i++ {
		if err := r.data.DB.Transaction(func(tx *gorm.DB) (err error) {
			tx = tx.WithContext(ctx)
			var maxSortWeight *uint64
			// SELECT MAX(sort_weight) FROM `tree_node`
			// WHERE
			// 	`tree_id` = 1 AND
			//	`parent_id` = 456804994402755027 AND
			//	`tree_node`.`deleted_at` = 0
			if err = tx.Model(&model.TreeNode{}).
				Select("MAX(`sort_weight`)").
				Where("`tree_id` = ?", m.TreeID).
				Where("`parent_id` = ?", m.ParentID).
				Scan(&maxSortWeight).
				Error; err != nil {
				return err
			}

			switch {
			case maxSortWeight == nil:
				m.SortWeight = startSortWeight

			case *maxSortWeight > sortWeightMax:
				// 需要重排
				m.SortWeight, err = r.reorderNode(tx, m.ParentID, m.TreeID)
				if err != nil {
					return err
				}

			default:
				m.SortWeight = *maxSortWeight + sortWeightIncrement
			}

			// INSERT INTO `tree_node`
			//	(`tree_id`,`parent_id`,`name`,`describe`,`category_num`,`mgm_dep_id`,`mgm_dep_name`,`sort_weight`,`created_at`,`created_by_uid`,`updated_at`,`updated_by_uid`,`deleted_at`,`id`)
			// VALUES
			//	(1,456804994402755027,'1-1-1-1五级分类','分类描述','08eaa54f-ea68-4553-804e-0068202bc620','1','数据资源管理局',512,'2023-04-18 16:30:05.076','userId','2023-04-18 16:30:05.076','userId','0',456805012589257171)
			if err = tx.Create(m).Error; err != nil {
				return err
			}

			curLayer = 1
			curM := &model.TreeNode{ParentID: m.ParentID}
			for curM.ParentID.Uint64() > 0 {
				curLayer++
				// SELECT `parent_id` FROM `tree_node`
				// WHERE
				//	`tree_node`.`id` = 456804994402755027 AND
				//	`tree_node`.`deleted_at` = 0
				// LIMIT 1
				if err = tx.Select("parent_id").Take(curM, curM.ParentID).Error; err != nil {
					return err
				}
			}

			// 是否大于最大层级，+1是因为还有根节点
			if curLayer > maxLayer+1 {
				return overflowMaxLayerErr
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
				return errorcode.Desc(errorcode.TreeNodeOverflowMaxLayer)
			}

			return errorcode.Detail(errorcode.PublicDatabaseError, err)
		}

		break
	}

	return nil
}

func (r *repo) Delete(ctx context.Context, id, treeId models.ModelID) (bool, error) {
	// 递归删除子节点
	var deleteRowsAffected int64
	if err := r.do(ctx).Transaction(func(tx *gorm.DB) error {
		tx = tx.WithContext(ctx)
		needDelIds := make([]uint64, 0, 10)
		needDelIds = append(needDelIds, id.Uint64())

		needSelectParentIds := make([]uint64, 0, 10)
		needSelectParentIds = append(needSelectParentIds, id.Uint64())
		tmpIds := make([]uint64, 0, 10)
		for len(needSelectParentIds) > 0 {
			tmpIds = tmpIds[:0]
			// SELECT `id` FROM `tree_node`
			// WHERE
			//	`parent_id` IN (456804994402755027,456805774627185107,456805790380990931,456805800849973715) AND
			//	`tree_id` = 1 AND
			//	`tree_node`.`deleted_at` = 0
			if err := tx.Model(&model.TreeNode{}).
				Select("id").
				Where("`parent_id` IN ?", needSelectParentIds).
				Where("`tree_id` = ?", treeId).
				Scan(&tmpIds).
				Error; err != nil {
				return err
			}

			needDelIds = append(needDelIds, tmpIds...)

			needSelectParentIds = append(needSelectParentIds[:0], tmpIds...)
		}

		// UPDATE `tree_node`
		// SET
		//	`deleted_at`=1681807909651
		// WHERE
		//	`id` IN (456804971619295699,456804994402755027,456805774627185107,456805790380990931,456805800849973715) AND
		//	`tree_node`.`deleted_at` = 0
		t := tx.Where("`id` IN ?", needDelIds).Delete(&model.TreeNode{})
		deleteRowsAffected = t.RowsAffected
		return t.Error
	}); err != nil {
		log.WithContext(ctx).Errorf("failed to access db, err: %v", err)
		return false, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}

	return deleteRowsAffected > 0, nil
}

func (r *repo) GetByIdAndTreeId(ctx context.Context, id, treeId models.ModelID) (*model.TreeNode, error) {
	do := r.do(ctx)
	m := &model.TreeNode{}
	// SELECT * FROM `tree_node`
	// WHERE
	//	`id` = 456804910801887699 AND
	//	`tree_id` = 1 AND
	//	`tree_node`.`deleted_at` = 0
	// LIMIT 1
	if err := do.
		Where("`id` = ?", id).
		Where("`tree_id` = ?", treeId).
		Take(m).
		Error; err != nil {
		log.WithContext(ctx).Errorf("failed to access db, err: %v", err)
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errorcode.Desc(errorcode.TreeNodeNotExist)
		}

		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}

	return m, nil
}

func (r *repo) UpdateByEdit(ctx context.Context, m *model.TreeNode) error {
	do := r.do(ctx)
	// UPDATE `tree_node`
	// SET
	//	`name`='3-编辑目录名称',
	//	`describe`='put desc',
	//	`updated_at`='2023-04-18 16:44:56.099',
	//	`updated_by_uid`='userId'
	// WHERE
	//	`tree_node`.`deleted_at` = 0 AND
	//	`id` = 456805951593259475
	if err := do.
		Select("name", "describe", "updated_by_uid").
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

type groupRet struct {
	ParentID models.ModelID `gorm:"column:parent_id"`
	SubCount int64          `gorm:"column:sub_count"`
}

func (r *repo) ListShow(ctx context.Context, parentID, treeID models.ModelID, keyword string) ([]*model.TreeNodeExt, error) {
	var nodes []*model.TreeNodeExt
	if err := r.do(ctx).Transaction(func(tx *gorm.DB) error {
		tx = tx.WithContext(ctx)
		{
			tx1 := tx.
				Where("`parent_id` = ?", parentID).
				Where("`tree_id` = ?", treeID)
			if len(keyword) > 0 {
				tx1 = tx1.Where("`name` LIKE ?", "%"+util.KeywordEscape(keyword)+"%")
			}
			// SELECT `id`,`name` FROM `tree_node`
			// WHERE
			//	`parent_id` = 1 AND
			//	`tree_id` = 1 AND
			//	`name` LIKE '%关键字%' AND
			//	`tree_node`.`deleted_at` = 0
			// ORDER BY `sort_weight` asc
			if err := tx1.
				Select("id", "name").
				Order("`sort_weight` asc").
				Find(&nodes).
				Error; err != nil {
				return err
			}
		}

		if len(nodes) < 1 {
			return nil
		}

		if err := r.addExpansion(tx, nodes); err != nil {
			return err
		}

		return nil
	}); err != nil {
		log.WithContext(ctx).Errorf("failed to access db, err: %v", err)
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}

	return nodes, nil
}

func (r *repo) addExpansion(tx *gorm.DB, nodes []*model.TreeNodeExt) error {
	ids := lo.Map(nodes, func(item *model.TreeNodeExt, _ int) models.ModelID {
		return item.ID
	})

	var gr []*groupRet
	// SELECT `parent_id`,count(*) AS `sub_count` FROM `tree_node`
	// WHERE
	//	`parent_id` IN (456804910801887699,456805930638516691,456805951593259475) AND
	//	`tree_node`.`deleted_at` = 0
	// GROUP BY `parent_id`
	if err := tx.Model(&model.TreeNode{}).
		Select("parent_id", "count(*) AS `sub_count`").
		Where("`parent_id` IN ?", ids).
		Group("parent_id").
		Scan(&gr).
		Error; err != nil {
		return err
	}

	groupRetMap := lo.SliceToMap(gr, func(item *groupRet) (models.ModelID, int64) {
		return item.ParentID, item.SubCount
	})

	for _, node := range nodes {
		node.Expansion = groupRetMap[node.ID] > 0
	}

	return nil
}

func (r *repo) ListRecursiveAndKeyword(ctx context.Context, treeID models.ModelID, keyword string) ([]*model.TreeNodeExt, error) {
	if len(keyword) < 1 {
		return nil, errors.New("internal error: keyword is empty")
	}

	tmpCache := make([]*model.TreeNodeExt, 0, 100)
	if err := r.do(ctx).Transaction(func(tx *gorm.DB) error { // 一致性读
		tx = tx.WithContext(ctx)

		var nodes []*model.TreeNodeExt
		// SELECT `id`,`name`,`parent_id`,`sort_weight` FROM `tree_node`
		// WHERE
		//	`tree_id` = 1 AND
		//	`name` LIKE '%二级%' AND
		//	`tree_node`.`deleted_at` = 0
		if err := tx.
			Select("id", "name", "parent_id", "sort_weight").
			Where("`tree_id` = ?", treeID).
			Where("`name` LIKE ?", "%"+util.KeywordEscape(keyword)+"%").
			Find(&nodes).
			Error; err != nil {
			return err
		}

		if len(nodes) < 1 {
			return nil
		}

		if err := r.addExpansion(tx, nodes); err != nil {
			return err
		}

		needIds := make([]models.ModelID, 0, len(nodes))
		tmpMCache := make(map[models.ModelID]struct{})
		for {
			needIds = needIds[:0]
			tmpCache = append(tmpCache, nodes...)
			for _, node := range nodes {
				tmpMCache[node.ID] = struct{}{}
				if node.ParentID.Uint64() > 0 {
					if _, ok := tmpMCache[node.ParentID]; !ok {
						needIds = append(needIds, node.ParentID)
					}
				}
			}

			needIds = lo.Uniq(needIds)
			if len(needIds) < 1 {
				break
			}

			nodes = nodes[:0]
			// SELECT `id`,`name`,`parent_id`,`sort_weight` FROM `tree_node`
			// WHERE
			//	`tree_id` = 1 AND
			//	`id` IN (456804910801887699) AND
			//	`tree_node`.`deleted_at` = 0
			if err := tx.
				Select("id", "name", "parent_id", "sort_weight").
				Where("`tree_id` = ?", treeID).
				Where("`id` IN ?", needIds).
				Find(&nodes).
				Error; err != nil {
				return err
			}
		}

		return nil
	}); err != nil {
		log.WithContext(ctx).Errorf("failed to access db, err: %v", err)
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errorcode.Desc(errorcode.TreeNodeNotExist)
		}

		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}

	return tmpCache, nil
}

func (r *repo) ListRecursive(ctx context.Context, parentId models.ModelID, treeId models.ModelID) ([]*model.TreeNodeExt, error) {
	tmpCache := make([]*model.TreeNodeExt, 0, 100)
	if err := r.do(ctx).Transaction(func(tx *gorm.DB) error {
		tx = tx.WithContext(ctx)
		var nodes []*model.TreeNodeExt

		// SELECT `id`,`name`,`parent_id`,`sort_weight` FROM `tree_node`
		// WHERE
		//	`tree_id` = 1 AND
		//	`parent_id` = 1 AND
		//	`tree_node`.`deleted_at` = 0
		if err := tx.
			Select("id", "name", "parent_id", "sort_weight").
			Where("`tree_id` = ?", treeId).
			Where("`parent_id` = ?", parentId).
			Find(&nodes).
			Error; err != nil {
			return err
		}

		nodeIds := make([]models.ModelID, 0, len(nodes))
		for len(nodes) > 0 {
			tmpCache = append(tmpCache, nodes...)

			nodeIds = nodeIds[:0]
			for _, node := range nodes {
				nodeIds = append(nodeIds, node.ID)
			}
			nodes = nodes[:0]

			// SELECT `id`,`name`,`parent_id`,`sort_weight` FROM `tree_node`
			// WHERE
			//	`tree_id` = 1 AND
			//	`parent_id` IN (456804910801887699,456805930638516691,456805951593259475) AND
			//	`tree_node`.`deleted_at` = 0
			if err := tx.
				Select("id", "name", "parent_id", "sort_weight").
				Where("`tree_id` = ?", treeId).
				Where("`parent_id` IN ?", nodeIds).
				Find(&nodes).
				Error; err != nil {
				return err
			}
		}

		return nil
	}); err != nil {
		log.WithContext(ctx).Errorf("failed to access db, err: %v", err)
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errorcode.Desc(errorcode.TreeNodeNotExist)
		}

		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}

	return tmpCache, nil
}

func (r *repo) ListTree(ctx context.Context, treeID models.ModelID) ([]*model.TreeNodeExt, error) {
	var nodes []*model.TreeNodeExt
	if err := r.do(ctx).
		// SELECT
		//	`id`,`parent_id`,`name`,`describe`,`category_num`,`mgm_dep_id`,`mgm_dep_name`,`sort_weight`,`created_at`,`updated_at`
		// FROM
		//	`tree_node`
		// WHERE
		//	`tree_id` = 1 AND
		//	`tree_node`.`deleted_at` = 0
		Select("id", "parent_id", "name", "describe", "category_num", "mgm_dep_id", "mgm_dep_name", "sort_weight", "created_at", "updated_at").
		Where("`tree_id` = ?", treeID).
		Find(&nodes).
		Error; err != nil {
		log.WithContext(ctx).Errorf("failed to access db, err: %v", err)
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}

	return nodes, nil
}

func (r *repo) ListTreeAndKeyword(ctx context.Context, treeID models.ModelID, keyword string) ([]*model.TreeNodeExt, error) {
	if len(keyword) < 1 {
		return nil, errors.New("internal error: keyword is empty")
	}

	var cacheNodes []*model.TreeNodeExt
	if err := r.do(ctx).Transaction(func(tx *gorm.DB) error { // 一致性读
		tx = tx.WithContext(ctx)

		var nodes []*model.TreeNodeExt
		// SELECT
		//	`id`,`parent_id`,`name`,`describe`,`category_num`,`mgm_dep_id`,`mgm_dep_name`,`sort_weight`,`created_at`,`updated_at`
		// FROM
		//	`tree_node`
		// WHERE
		//	`tree_id` = 1 AND
		//	`name` LIKE '%keyword%' AND
		//	`tree_node`.`deleted_at` = 0
		if err := tx.
			Select("id", "parent_id", "name", "describe", "category_num", "mgm_dep_id", "mgm_dep_name", "sort_weight", "created_at", "updated_at").
			Where("`tree_id` = ?", treeID).
			Where("`name` LIKE ?", "%"+util.KeywordEscape(keyword)+"%").
			Find(&nodes).Error; err != nil {
			return err
		}

		if len(nodes) < 1 {
			return nil
		}

		hitNodeMap := make(map[models.ModelID]*model.TreeNodeExt)
		for _, node := range nodes {
			// 设置这些node为keyword命中的node
			node.Hit = true
			hitNodeMap[node.ID] = node
		}

		idSet := make(map[models.ModelID]struct{})
		for len(nodes) > 0 {
			cacheNodes = append(cacheNodes, nodes...)
			for _, node := range nodes {
				idSet[node.ID] = struct{}{}
			}

			parentIdSet := make(map[models.ModelID]struct{})
			for _, node := range nodes {
				if node.ParentID.Uint64() < 1 {
					continue
				}

				if _, ok := idSet[node.ParentID]; ok {
					continue
				}

				parentIdSet[node.ParentID] = struct{}{}
			}

			parentIds := lo.Keys(parentIdSet)
			if len(parentIds) < 1 {
				break
			}

			nodes = nodes[:0]
			// SELECT
			// 	`id`,`parent_id`,`name`,`describe`,`category_num`,`mgm_dep_id`,`mgm_dep_name`,`sort_weight`,`created_at`,`updated_at`
			// FROM
			//	`tree_node`
			// WHERE
			//	`tree_id` = 1 AND
			//	`id` IN (1,457289004686026437) AND
			//	`tree_node`.`deleted_at` = 0
			if err := tx.
				Select("id", "parent_id", "name", "describe", "category_num", "mgm_dep_id", "mgm_dep_name", "sort_weight", "created_at", "updated_at").
				Where("`tree_id` = ?", treeID).
				Where("`id` IN ?", parentIds).
				Find(&nodes).Error; err != nil {
				return err
			}
		}

		for _, node := range cacheNodes {
			if v, ok := hitNodeMap[node.ParentID]; ok && v != nil {
				hitNodeMap[node.ParentID] = nil
			}
		}

		var needDeepParentIds []models.ModelID
		for id, v := range hitNodeMap {
			if v == nil {
				continue
			}

			needDeepParentIds = append(needDeepParentIds, id)
			v.NotDefaultExpansion = true
		}

		for len(needDeepParentIds) > 0 {
			nodes = nodes[:0]
			// SELECT
			//	`id`,`parent_id`,`name`,`describe`,`category_num`,`mgm_dep_id`,`mgm_dep_name`,`sort_weight`,`created_at`,`updated_at`
			// FROM
			//	`tree_node`
			// WHERE
			//	`tree_id` = 1 AND
			//	`parent_id` IN (457714793097242309,457715276901820101,457715296984147653,457721055058896581) AND
			//	`tree_node`.`deleted_at` = 0
			if err := tx.
				Select("id", "parent_id", "name", "describe", "category_num", "mgm_dep_id", "mgm_dep_name", "sort_weight", "created_at", "updated_at").
				Where("`tree_id` = ?", treeID).
				Where("`parent_id` IN ?", needDeepParentIds).
				Find(&nodes).Error; err != nil {
				return err
			}

			if len(nodes) < 1 {
				break
			}

			cacheNodes = append(cacheNodes, nodes...)

			needDeepParentIds = append(needDeepParentIds[:0], lo.Map(nodes, func(node *model.TreeNodeExt, idx int) models.ModelID {
				return node.ID
			})...)
		}

		return nil
	}); err != nil {
		log.WithContext(ctx).Errorf("failed to access db, err: %v", err)
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}

	return cacheNodes, nil
}

func (r *repo) GetNameById(ctx context.Context, id models.ModelID) (string, error) {
	do := r.do(ctx).Model(&model.TreeNode{})
	var name *string
	// SELECT `name` FROM `tree_node` WHERE `id` = 456805800849973715 AND `tree_node`.`deleted_at` = 0
	if err := do.Select("name").Where("`id` = ?", id).Scan(&name).Error; err != nil {
		return "", err
	}

	if name == nil {
		log.WithContext(ctx).Errorf("tree node not found, id: %v", id)
		return "", errorcode.Desc(errorcode.TreeNodeNotExist)
	}
	return *name, nil
}

var errReorder = errors.New("node reorder")

func (r *repo) Reorder(ctx context.Context, id, destParentId, nextID, treeID models.ModelID, maxLayer int) error {
	if nextID.Uint64() > 0 {
		return r.insertSpecPos(ctx, id, destParentId, nextID, treeID, maxLayer)
	} else {
		return r.insertTail(ctx, id, destParentId, treeID, maxLayer)
	}
}

func (r *repo) insertSpecPos(ctx context.Context, id, destParentId, nextId, treeId models.ModelID, maxLayer int) error {
	needReorder := false
	reorderCnt := 0
	var curLayer int
	var err error
	for i := 0; i < 3; i++ {
		if i > 0 {
			r.sleep()
		}

		if err = r.do(ctx).Transaction(func(tx *gorm.DB) error {
			tx = tx.WithContext(ctx)
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
			nextNodeM := &model.TreeNode{}
			// SELECT `id`,`sort_weight` FROM `tree_node`
			// WHERE
			//	`id` = 456805790380990931 AND
			//	`parent_id` = 456804971619295699 AND
			//	`tree_id` = 1 AND
			//	`tree_node`.`deleted_at` = 0
			// LIMIT 1
			if err = tx.
				Select("id", "sort_weight").
				Where("`id` = ?", nextId).
				Where("`parent_id` = ?", destParentId).
				Where("`tree_id` = ?", treeId).
				Take(nextNodeM).
				Error; err != nil {
				log.WithContext(ctx).Errorf("failed to access db, err: %v", err)
				return err
			}

			preNodeM := &model.TreeNode{}
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
				Select("id", "sort_weight").
				Where("`parent_id` = ?", destParentId).
				Where("`sort_weight` < ?", nextNodeM.SortWeight).
				Where("`tree_id` = ?", treeId).
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
				if preNodeM.ID == id {
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
				Where("`id` = ?", id).
				Updates(&model.TreeNode{ParentID: destParentId, SortWeight: newSortWeight}).
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
				return errorcode.Desc(errorcode.TreeNodeOverflowMaxLayer)
			}

			if errors.Is(err, moveToSubErr) {
				log.WithContext(ctx).Errorf("failed to insert tree node to db, not allowed insert to sub nodes")
				return errorcode.Desc(errorcode.TreeNodeMoveToSubErr)
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

func (r *repo) insertTail(ctx context.Context, id, destParentId, treeId models.ModelID, maxLayer int) error {
	curLayer := 0
	var err error
	for i := 0; i < 3; i++ {
		if i > 0 {
			r.sleep()
		}

		if err = r.do(ctx).Transaction(func(tx *gorm.DB) error {
			tx = tx.WithContext(ctx)

			// 不允许将自身移动到自身的子节点下
			if err := r.moveToSubCheck(tx, id, destParentId); err != nil {
				return err
			}

			maxM := &model.TreeNode{}
			if err := tx.
				Select("id", "sort_weight").
				Where("`tree_id` = ?", treeId).
				Where("`parent_id` = ?", destParentId).
				Order("`sort_weight` desc").
				Limit(1).
				Find(maxM).
				Error; err != nil {
				log.WithContext(ctx).Errorf("failed to access db, err: %v", err)
				return err
			}

			if !maxM.ID.IsInvalid() && maxM.ID == id {
				// 要移动的node本身就在该在的位置上，不需要操作
				return nil
			}

			var maxSortWeight *uint64
			if !maxM.ID.IsInvalid() {
				maxSortWeight = &maxM.SortWeight
			}

			insertM := &model.TreeNode{
				ID:       id,
				ParentID: destParentId,
			}

			var err error
			switch {
			case maxSortWeight == nil:
				insertM.SortWeight = startSortWeight

			case *maxSortWeight > sortWeightMax:
				// 需要重排
				insertM.SortWeight, err = r.reorderNode(tx, destParentId, treeId)
				if err != nil {
					return err
				}

			default:
				insertM.SortWeight = *maxSortWeight + sortWeightIncrement
			}

			do := tx.Select("parent_id", "sort_weight")
			if err = do.Updates(insertM).Error; err != nil {
				log.WithContext(ctx).Errorf("failed to access db, err: %v", err)
				return err
			}

			// 判断移动后的node是否超过4层
			if curLayer, err = r.calcLayerNum(tx, insertM.ID, insertM.ParentID, maxLayer); err != nil {
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
				return errorcode.Desc(errorcode.TreeNodeOverflowMaxLayer)
			}

			if errors.Is(err, moveToSubErr) {
				log.WithContext(ctx).Errorf("failed to insert tree node to db, not allowed insert to sub nodes")
				return errorcode.Desc(errorcode.TreeNodeMoveToSubErr)
			}

			if errors.Is(err, gorm.ErrRecordNotFound) {
				return errorcode.Desc(errorcode.TreeNodeNotExist)
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

func (r *repo) moveToSubCheck(tx *gorm.DB, id, parentId models.ModelID) error {
	parentM := &model.TreeNode{ParentID: parentId}
	for parentM.ParentID.Uint64() > 0 {

		if parentM.ParentID == id {
			// 不允许将自身移动到自身的子节点下
			return moveToSubErr
		}

		// SELECT `parent_id` FROM `tree_node`
		// WHERE
		//	`tree_node`.`id` = 456804971619295699 AND
		//	`tree_node`.`deleted_at` = 0
		// LIMIT 1
		if err := tx.Select("parent_id").Take(parentM, parentM.ParentID).Error; err != nil {
			log.Errorf("failed to access db, err: %v", err)
			return err
		}
	}

	return nil
}

func (r *repo) reorderNode(tx *gorm.DB, parentID, treeID models.ModelID) (uint64, error) {
	var nodes []*model.TreeNode
	// SELECT `id`,`sort_weight` FROM `tree_node`
	// WHERE
	//	`parent_id` = 456804971619295699 AND
	//	`tree_id` = 1 AND
	//	`tree_node`.`deleted_at` = 0
	// ORDER BY `sort_weight` asc
	if err := tx.Set("gorm:query_option", "FOR UPDATE").
		Select("id", "sort_weight").
		Where("`parent_id` = ?", parentID).
		Where("`tree_id` = ?", treeID).
		Order("`sort_weight` asc").
		Find(&nodes).Error; err != nil {
		log.Errorf("failed to access db, err: %v", err)
		return 0, err
	}

	offset := startSortWeight
	var err error

	txnConflictNode := make([]*model.TreeNode, 0)
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
		if err = tx.Model(&model.TreeNode{}).
			Where("`id` = ?", node.ID).
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

		offset += sortWeightIncrement
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
		if err = tx.Model(&model.TreeNode{}).
			Where("`id` = ?", node.ID).
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

func (r *repo) calcLayerNum(tx *gorm.DB, id, parentId models.ModelID, maxLayer int) (curLayer int, err error) {
	// 判断移动后的node是否超过4层
	curLayer = 1
	curM := &model.TreeNode{ParentID: parentId}
	// 向上找
	for curM.ParentID.Uint64() > 0 {
		curLayer++
		// SELECT `parent_id` FROM `tree_node` WHERE `tree_node`.`id` = 456804971619295699 AND `tree_node`.`deleted_at` = 0 LIMIT 1
		if err = tx.Select("parent_id").Take(curM, curM.ParentID).Error; err != nil {
			log.Errorf("failed to access db, err: %v", err)
			return
		}

		if curLayer > maxLayer+1 {
			err = overflowMaxLayerErr
			return
		}
	}

	// 向下找
	selectIds := make([]models.ModelID, 0, 10)
	selectIds = append(selectIds, id)
	retIds := make([]models.ModelID, 0, 10)
	for {
		retIds = retIds[:0]
		// SELECT `id` FROM `tree_node` WHERE `parent_id` IN (456805800849973715) AND `tree_node`.`deleted_at` = 0
		if err = tx.Model(&model.TreeNode{}).
			Select("id").
			Where("`parent_id` IN ?", selectIds).
			Scan(&retIds).Error; err != nil {
			return
		}

		if len(retIds) < 1 {
			break
		}

		curLayer++
		selectIds = append(selectIds[:0], retIds...)

		if curLayer > maxLayer+1 {
			err = overflowMaxLayerErr
			return
		}
	}

	return
}

func (r *repo) sleep() {
	time.Sleep(time.Duration(rand.Intn(3))*100*time.Millisecond + 100*time.Millisecond)
}
