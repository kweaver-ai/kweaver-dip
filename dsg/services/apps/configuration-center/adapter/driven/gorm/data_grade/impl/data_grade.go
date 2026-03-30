package impl

import (
	"context"
	"errors"
	"fmt"
	"math/rand"
	"time"

	data_grade_grom "github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/gorm/data_grade"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/errorcode/mariadb"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/models"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/util"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/data_grade"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/samber/lo"
	"gorm.io/gorm"
)

var (
	_ data_grade_grom.IDataGradeRepo = (*DataGradeRepo)(nil)
)

var errReorder = errors.New("node reorder")

type DataGradeRepo struct {
	DB *gorm.DB
}

const (
	beginSortWeight     uint64 = 0
	startSortWeight     uint64 = 1 << 9
	sortWeightMax       uint64 = 1 << 62
	sortWeightIncrement uint64 = 1 << 9
)

var (
	overflowMaxLayerErr      = errors.New("layer overflow max layer")
	overflowMaxLayerErrGroup = errors.New("layer overflow max layer group")
	moveToSubErr             = errors.New("move to sub node")
	labelNotExist            = errors.New("label not exist")
)

func (r *DataGradeRepo) do(ctx context.Context) *gorm.DB {
	return r.DB.WithContext(ctx)
}

func NewDataGradeRepo(db *gorm.DB) data_grade_grom.IDataGradeRepo {
	return &DataGradeRepo{DB: db}
}

func (r *DataGradeRepo) ExistByName(ctx context.Context, name string, id models.ModelID, nodeType int) (bool, error) {
	do := r.do(ctx).Model(&model.DataGrade{})
	var count int64
	if err := do.
		Where("name = ?", name).
		Where("id != ?", id).
		Where("node_type = ?", nodeType).
		Limit(1).
		Count(&count).
		Error; err != nil {
		log.WithContext(ctx).Errorf("failed to access db, err: %v", err)
		return false, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}

	return count > 0, nil
}

func (r *DataGradeRepo) ExistByIcon(ctx context.Context, icon string, id models.ModelID) (bool, error) {
	do := r.do(ctx).Model(&model.DataGrade{})
	var count int64
	if err := do.
		Where("icon = ?", icon).
		Where("id != ?", id).
		Where("node_type = ?", 1).
		Limit(1).
		Count(&count).
		Error; err != nil {
		log.WithContext(ctx).Errorf("failed to access db, err: %v", err)
		return false, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}

	return count > 0, nil
}

func (r *DataGradeRepo) IsGroup(ctx context.Context, id models.ModelID) (bool, error) {
	do := r.do(ctx).Model(&model.DataGrade{})
	var count int64
	if err := do.
		Where("node_type = ?", 2).
		Where("id = ?", id).
		Limit(1).
		Count(&count).
		Error; err != nil {
		log.WithContext(ctx).Errorf("failed to access db, err: %v", err)
		return false, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}

	return count > 0, nil
}

func (r *DataGradeRepo) InsertWithMaxLayer(ctx context.Context, m *model.DataGrade, maxLayer int) error {
	var curLayer int
	var curLayerGroup int
	for i := 0; i < 2; i++ {
		if err := r.DB.Transaction(func(tx *gorm.DB) (err error) {
			tx = tx.WithContext(ctx)
			var maxSortWeight *uint64
			// SELECT MAX(sort_weight) FROM tree_node
			// WHERE
			// 	tree_id = 1 AND
			//	parent_id = 456804994402755027 AND
			//	tree_node.deleted_at = 0
			if err = tx.Model(&model.DataGrade{}).
				Select("MAX(sort_weight)").
				//Where("tree_id = ?", m.TreeID).
				Where("parent_id = ?", m.ParentID).
				Scan(&maxSortWeight).
				Error; err != nil {
				return err
			}

			switch {
			case maxSortWeight == nil:
				m.SortWeight = startSortWeight

			case *maxSortWeight > sortWeightMax:
				// 需要重排
				m.SortWeight, err = r.reorderNode(tx, m.ParentID)
				if err != nil {
					return err
				}

			default:
				m.SortWeight = *maxSortWeight + sortWeightIncrement
			}

			// INSERT INTO tree_node
			//	(tree_id,parent_id,name,describe,category_num,mgm_dep_id,mgm_dep_name,sort_weight,created_at,created_by_uid,updated_at,updated_by_uid,deleted_at,id)
			// VALUES
			//	(1,456804994402755027,'1-1-1-1五级分类','分类描述','08eaa54f-ea68-4553-804e-0068202bc620','1','数据资源管理局',512,'2023-04-18 16:30:05.076','userId','2023-04-18 16:30:05.076','userId','0',456805012589257171)
			if m.ID != "" {
				//更新，校验id是否正确
				dataGradeTemp := &model.DataGrade{ParentID: m.ParentID}
				if err = tx.Select("id").Take(dataGradeTemp, m.ID).Error; err != nil {
					return labelNotExist
				}
				if dataGradeTemp.ParentID == m.ParentID {
					m.SortWeight = dataGradeTemp.SortWeight
				}
				updateFields := map[string]interface{}{"parent_id": m.ParentID, "name": m.Name, "description": m.Description, "node_type": m.NodeType, "icon": m.Icon,
					"updated_by_uid": m.UpdatedByUID, "sensitive_attri": m.SensitiveAttri, "secret_attri": m.SecretAttri, "share_condition": m.ShareCondition, "data_protection_query": m.DataProtectionQuery}
				//tx.Where("id = ?", m.ID).Updates(updateFields)
				if err = tx.Model(&model.DataGrade{}).Where("id = ?", m.ID).Updates(updateFields).Error; err != nil {
					return err
				}
			} else {
				if err = tx.Create(m).Error; err != nil {
					return err
				}
			}

			curLayer = 1
			curLayerGroup = 1
			curM := &model.DataGrade{ParentID: m.ParentID, NodeType: m.NodeType}
			for curM.ParentID.Uint64() > 0 {
				curLayer++
				if curM.NodeType == 2 {
					curLayerGroup++
				}
				// SELECT parent_id FROM tree_node
				// WHERE
				//	tree_node.id = 456804994402755027 AND
				//	tree_node.deleted_at = 0
				// LIMIT 1
				if err = tx.Select("parent_id", "node_type").Take(curM, curM.ParentID).Error; err != nil {
					return err
				}
			}

			// 分组最多两层，+1是因为还有根节点
			if curLayerGroup > 2+1 {
				return overflowMaxLayerErrGroup
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

			if errors.Is(err, overflowMaxLayerErrGroup) {
				log.WithContext(ctx).Errorf("failed to insert tree node to db, layer gt max layer num, layer: %v", curLayer)
				return errorcode.Desc(errorcode.TreeNodeOverflowMaxLayerGroup)
			}

			if errors.Is(err, overflowMaxLayerErr) {
				log.WithContext(ctx).Errorf("failed to insert tree node to db, layer gt max layer num, layer: %v", curLayer)
				return errorcode.Desc(errorcode.TreeNodeOverflowMaxLayer)
			}

			if errors.Is(err, labelNotExist) {
				return errorcode.Desc(errorcode.LabelNotExist)
			}

			return errorcode.Detail(errorcode.PublicDatabaseError, err)
		}
		break
	}

	return nil
}

func (r *DataGradeRepo) GetRootNodeId(ctx context.Context, id models.ModelID) (rootNodeId models.ModelID, err error) {
	do := r.do(ctx)
	// SELECT root_node_id FROM tree_info WHERE id = 1 AND tree_info.deleted_at = 0 LIMIT 1
	//if err = do.Model(&model.DataGrade{}).Select("root_node_id").Where("id = ?", id).Limit(1).Scan(&rootNodeId).Error; err != nil {
	//	log.WithContext(ctx).Errorf("failed to access db, err: %v", err)
	//	if errors.Is(err, gorm.ErrRecordNotFound) {
	//		err = errorcode.Desc(errorcode.TreeNotExist)
	//		return
	//	}
	//
	//	err = errorcode.Detail(errorcode.PublicDatabaseError, err)
	//	return
	//}
	//SELECT id FROM data_grade WHERE id = 1 AND tree_info.deleted_at = 0 LIMIT 1
	if err = do.Model(&model.DataGrade{}).Select("id").Where("id = ?", id).Limit(1).Scan(&rootNodeId).Error; err != nil {
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

func (r *DataGradeRepo) GetNameById(ctx context.Context, id models.ModelID) (string, error) {
	do := r.do(ctx).Model(&model.DataGrade{})
	var name *string
	// SELECT name FROM tree_node WHERE id = 456805800849973715 AND tree_node.deleted_at = 0
	if err := do.Select("name").Where("id = ?", id).Scan(&name).Error; err != nil {
		return "", errorcode.Desc(errorcode.LabelNotExist)
	}

	if name == nil {
		log.WithContext(ctx).Errorf("tree node not found, id: %v", id)
		return "", errorcode.Desc(errorcode.LabelNotExist)
	}
	return *name, nil
}

func (r *DataGradeRepo) reorderNode(tx *gorm.DB, parentID models.ModelID) (uint64, error) {
	var nodes []*model.DataGrade
	// SELECT id,sort_weight FROM tree_node
	// WHERE
	//	parent_id = 456804971619295699 AND
	//	tree_id = 1 AND
	//	tree_node.deleted_at = 0
	// ORDER BY sort_weight asc
	if err := tx.Set("gorm:query_option", "FOR UPDATE").
		Select("id", "sort_weight").
		Where("parent_id = ?", parentID).
		//Where("tree_id = ?", treeID).
		Order("sort_weight asc").
		Find(&nodes).Error; err != nil {
		log.Errorf("failed to access db, err: %v", err)
		return 0, err
	}

	offset := startSortWeight
	var err error

	txnConflictNode := make([]*model.DataGrade, 0)
	for _, node := range nodes {
		if offset > sortWeightMax {
			return 0, fmt.Errorf("internal error: sort weight value gt %v", sortWeightMax)
		}

		// UPDATE tree_node
		// SET
		//	sort_weight=512,
		//	updated_at='2023-04-18 17:16:24.9'
		// WHERE
		//	id = 456804994402755027 AND
		//	tree_node.deleted_at = 0
		if err = tx.Model(&model.DataGrade{}).
			Where("id = ?", node.ID).
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
		// UPDATE tree_node
		// SET
		//	sort_weight=1536,
		//	updated_at='2023-04-18 17:25:41.776'
		// WHERE
		//	id = 456805774627185107 AND
		//	tree_node.deleted_at = 0
		if err = tx.Model(&model.DataGrade{}).
			Where("id = ?", node.ID).
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

func (r *DataGradeRepo) ExistByIdAndTreeId(ctx context.Context, id, treeId models.ModelID) (bool, error) {
	do := r.do(ctx).Model(&model.DataGrade{})
	var count int64
	// SELECT count(*) FROM tree_node
	// WHERE
	//	id = 456804994402755027 AND
	//	tree_id = 1 AND
	//	tree_node.deleted_at = 0
	// LIMIT 1
	if err := do.
		Where("id = ?", id).
		//Where("tree_id = ?", treeId).
		Limit(1).
		Count(&count).
		Error; err != nil {
		log.WithContext(ctx).Errorf("failed to access db, err: %v", err)
		return false, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}

	return count > 0, nil
}

func (r *DataGradeRepo) GetCountByNodeType(ctx context.Context, nodeType string) (int64, error) {
	do := r.do(ctx).Model(&model.DataGrade{})
	var count int64
	// SELECT count(*) FROM tree_node
	// WHERE
	//	id = 456804994402755027 AND
	//	tree_id = 1 AND
	//	tree_node.deleted_at = 0
	// LIMIT 1
	if err := do.
		Where("node_type = ?", nodeType).
		Limit(1).
		Count(&count).
		Error; err != nil {
		log.WithContext(ctx).Errorf("failed to access db, err: %v", err)
		return 0, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}

	return count, nil
}

func (r *DataGradeRepo) ExistByIdAndParentIdTreeId(ctx context.Context, id, parentId, treeId models.ModelID) (bool, error) {
	do := r.do(ctx)
	var count int64
	// SELECT count(*) FROM tree_node
	// WHERE
	//	id = 456805790380990931 AND
	//	parent_id = 456804971619295699 AND
	//	tree_id = 1 AND
	//	tree_node.deleted_at = 0
	// LIMIT 1
	if err := do.Model(&model.DataGrade{}).
		Where("id = ?", id).
		Where("parent_id = ?", parentId).
		//Where("tree_id = ?", treeId).
		Limit(1).
		Count(&count).
		Error; err != nil {
		log.WithContext(ctx).Errorf("failed to access db, err: %v", err)
		return false, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}

	return count > 0, nil
}

func (r *DataGradeRepo) Reorder(ctx context.Context, id, destParentId, nextID, treeID models.ModelID, maxLayer int) error {
	if nextID.Uint64() > 0 {
		return r.insertSpecPos(ctx, id, destParentId, nextID, treeID, maxLayer)
	} else {
		return r.insertTail(ctx, id, destParentId, treeID, maxLayer)
	}
}

func (r *DataGradeRepo) insertSpecPos(ctx context.Context, id, destParentId, nextId, treeId models.ModelID, maxLayer int) error {
	needReorder := false
	reorderCnt := 0
	var curLayer int
	var err error
	for i := 0; i < 2; i++ {
		if i > 0 {
			r.sleep()
		}

		if err = r.do(ctx).Transaction(func(tx *gorm.DB) error {
			tx = tx.WithContext(ctx)
			if needReorder {
				needReorder = false
				if _, err := r.reorderNode(tx, destParentId); err != nil {
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
			nextNodeM := &model.DataGrade{}
			// SELECT id,sort_weight FROM tree_node
			// WHERE
			//	id = 456805790380990931 AND
			//	parent_id = 456804971619295699 AND
			//	tree_id = 1 AND
			//	tree_node.deleted_at = 0
			// LIMIT 1
			if err = tx.
				Select("id", "sort_weight").
				Where("id = ?", nextId).
				Where("parent_id = ?", destParentId).
				//Where("tree_id = ?", treeId).
				Take(nextNodeM).
				Error; err != nil {
				log.WithContext(ctx).Errorf("failed to access db, err: %v", err)
				return err
			}

			preNodeM := &model.DataGrade{}
			notExistPreNodeM := false
			// SELECT id,sort_weight FROM tree_node
			// WHERE
			//	parent_id = 456804971619295699 AND
			//	sort_weight < 1536 AND
			//	tree_id = 1 AND
			//	tree_node.deleted_at = 0
			// ORDER BY sort_weight desc
			// LIMIT 1
			if err = tx.
				Select("id", "sort_weight").
				Where("parent_id = ?", destParentId).
				Where("sort_weight < ?", nextNodeM.SortWeight).
				//Where("tree_id = ?", treeId).
				Order("sort_weight desc").
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

			// UPDATE tree_node
			// SET
			//	parent_id=456804971619295699,
			//	sort_weight=1280,
			//	updated_at='2023-04-18 17:03:17.736'
			// WHERE
			//	id = 456805800849973715 AND
			//	tree_node.deleted_at = 0
			if err = tx.
				Select("parent_id", "sort_weight").
				Where("id = ?", id).
				Updates(&model.DataGrade{ParentID: destParentId, SortWeight: newSortWeight}).
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
				if reorderCnt <= 2 {
					i--
				}
				continue
			}

			if mariadb.Is(err, mariadb.ER_DUP_ENTRY) {
				log.WithContext(ctx).Warnf("txn conflict in create node, retry count: %v", i)
				continue
			}

			if errors.Is(err, overflowMaxLayerErrGroup) {
				log.WithContext(ctx).Errorf("failed to insert tree node to db, layer gt max layer num, layer: %v", curLayer)
				return errorcode.Desc(errorcode.TreeNodeOverflowMaxLayerGroup)
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

func (r *DataGradeRepo) insertTail(ctx context.Context, id, destParentId, treeId models.ModelID, maxLayer int) error {
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

			maxM := &model.DataGrade{}
			if err := tx.
				Select("id", "sort_weight").
				//Where("tree_id = ?", treeId).
				Where("parent_id = ?", destParentId).
				Order("sort_weight desc").
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

			insertM := &model.DataGrade{
				ID:       id,
				ParentID: destParentId,
			}

			var err error
			switch {
			case maxSortWeight == nil:
				insertM.SortWeight = startSortWeight

			case *maxSortWeight > sortWeightMax:
				// 需要重排
				insertM.SortWeight, err = r.reorderNode(tx, destParentId)
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

			if errors.Is(err, overflowMaxLayerErrGroup) {
				log.WithContext(ctx).Errorf("failed to insert tree node to db, layer gt max layer num, layer: %v", curLayer)
				return errorcode.Desc(errorcode.TreeNodeOverflowMaxLayerGroup)
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

func (r *DataGradeRepo) moveToSubCheck(tx *gorm.DB, id, parentId models.ModelID) error {
	parentM := &model.DataGrade{ParentID: parentId}
	for parentM.ParentID.Uint64() > 0 {

		if parentM.ParentID == id {
			// 不允许将自身移动到自身的子节点下
			return moveToSubErr
		}

		// SELECT parent_id FROM tree_node
		// WHERE
		//	tree_node.id = 456804971619295699 AND
		//	tree_node.deleted_at = 0
		// LIMIT 1
		if err := tx.Select("parent_id").Take(parentM, parentM.ParentID).Error; err != nil {
			log.Errorf("failed to access db, err: %v", err)
			return err
		}
	}

	return nil
}

func (r *DataGradeRepo) calcLayerNum(tx *gorm.DB, id, parentId models.ModelID, maxLayer int) (curLayer int, err error) {
	// 判断移动后的node是否超过4层
	curLayer = 1
	var curLayerGroup = 1
	curM := &model.DataGrade{ParentID: parentId}
	// 向上找
	for curM.ParentID.Uint64() > 0 {
		curLayer++
		if curM.NodeType == 2 {
			curLayerGroup++
		}
		// SELECT parent_id FROM tree_node WHERE tree_node.id = 456804971619295699 AND tree_node.deleted_at = 0 LIMIT 1
		if err = tx.Select("parent_id,node_type").Take(curM, curM.ParentID).Error; err != nil {
			log.Errorf("failed to access db, err: %v", err)
			return
		}

		if curLayer > maxLayer+1 {
			err = overflowMaxLayerErr
			return
		}
		//分组最多二层
		if curLayerGroup > 2+1 {
			err = overflowMaxLayerErrGroup
			return
		}
	}

	// 向下找
	selectIds := make([]models.ModelID, 0, 10)
	selectIds = append(selectIds, id)
	retIds := make([]models.ModelID, 0, 10)
	for {
		retIds = retIds[:0]
		// SELECT id FROM tree_node WHERE parent_id IN (456805800849973715) AND tree_node.deleted_at = 0
		if err = tx.Model(&model.DataGrade{}).
			Select("id").
			Where("parent_id IN ?", selectIds).
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
func (r *DataGradeRepo) sleep() {
	time.Sleep(time.Duration(rand.Intn(3))*100*time.Millisecond + 100*time.Millisecond)
}

func (r *DataGradeRepo) GetList(ctx context.Context, keyword string) ([]*model.DataGrade, error) {
	var nodes []*model.DataGrade
	if err := r.do(ctx).Transaction(func(tx *gorm.DB) error {
		tx = tx.WithContext(ctx)
		{
			tx1 := tx.
				Where("parent_id != ?", "0")
			//Where("tree_id = ?", treeID)
			//if len(keyword) > 0 {
			//	tx1 = tx1.Where("name LIKE ?", "%"+util.KeywordEscape(keyword)+"%")
			//}
			// SELECT id,name FROM tree_node
			// WHERE
			//	parent_id = 1 AND
			//	tree_id = 1 AND
			//	name LIKE '%关键字%' AND
			//	tree_node.deleted_at = 0
			// ORDER BY sort_weight asc
			if err := tx1.
				Select("id", "name", "parent_id", "sort_weight").
				Order("sort_weight asc").
				Find(&nodes).
				Error; err != nil {
				return err
			}
		}

		if len(nodes) < 1 {
			return nil
		}

		//if err := r.addExpansion(tx, nodes); err != nil {
		//	return err
		//}

		return nil
	}); err != nil {
		log.WithContext(ctx).Errorf("failed to access db, err: %v", err)
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}

	return nodes, nil
}

func (r *DataGradeRepo) ListByKeyword(ctx context.Context, keyword string) ([]*model.DataGrade, error) {
	var nodes []*model.DataGrade
	if err := r.do(ctx).Transaction(func(tx *gorm.DB) error {
		tx = tx.WithContext(ctx)
		{
			tx1 := tx.Raw(`
				SELECT id,name,parent_id,sort_weight FROM data_grade
				WHERE
					name LIKE concat("%", ?, "%") AND
					data_grade.deleted_at = 0
				ORDER BY sort_weight asc;
			`, keyword)
			if err := tx1.Scan(&nodes).Error; err != nil {
				return err
			}
		}

		if len(nodes) < 1 {
			return nil
		}

		return nil
	}); err != nil {
		log.WithContext(ctx).Errorf("failed to access db, err: %v", err)
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}
	return nodes, nil
}

func (r *DataGradeRepo) Delete(ctx context.Context, id models.ModelID) ([]uint64, bool, error) {
	// 递归删除子节点
	resultIds := make([]uint64, 0, 10)
	resultIds = append(resultIds, id.Uint64())
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
			// SELECT id FROM tree_node
			// WHERE
			//	parent_id IN (456804994402755027,456805774627185107,456805790380990931,456805800849973715) AND
			//	tree_id = 1 AND
			//	tree_node.deleted_at = 0
			if err := tx.Model(&model.DataGrade{}).
				Select("id").
				Where("parent_id IN ?", needSelectParentIds).
				//Where("tree_id = ?", treeId).
				Scan(&tmpIds).
				Error; err != nil {
				return err
			}

			needDelIds = append(needDelIds, tmpIds...)

			needSelectParentIds = append(needSelectParentIds[:0], tmpIds...)
			resultIds = append(resultIds, tmpIds...)
		}

		// UPDATE tree_node
		// SET
		//	deleted_at=1681807909651
		// WHERE
		//	id IN (456804971619295699,456804994402755027,456805774627185107,456805790380990931,456805800849973715) AND
		//	tree_node.deleted_at = 0
		t := tx.Where("id IN ?", needDelIds).Delete(&model.DataGrade{})
		deleteRowsAffected = t.RowsAffected
		return t.Error
	}); err != nil {
		log.WithContext(ctx).Errorf("failed to access db, err: %v", err)
		return resultIds, false, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}

	return resultIds, deleteRowsAffected > 0, nil
}

func (r *DataGradeRepo) GetListByParentId(ctx context.Context, parentId string) ([]*model.DataGrade, error) {
	var nodes []*model.DataGrade
	if err := r.do(ctx).Transaction(func(tx *gorm.DB) error {
		tx = tx.WithContext(ctx)
		{
			tx1 := tx.
				Where("parent_id = ?", parentId)
			//Where("tree_id = ?", treeID)
			//if len(keyword) > 0 {
			//	tx1 = tx1.Where("name LIKE ?", "%"+util.KeywordEscape(keyword)+"%")
			//}
			// SELECT id,name FROM tree_node
			// WHERE
			//	parent_id = 1 AND
			//	tree_id = 1 AND
			//	name LIKE '%关键字%' AND
			//	tree_node.deleted_at = 0
			// ORDER BY sort_weight asc
			if err := tx1.
				Select("id", "parent_id", "name", "description", "node_type", "icon", "sort_weight", "created_at", "updated_at").
				Order("sort_weight asc").
				Find(&nodes).
				Error; err != nil {
				return err
			}
		}

		if len(nodes) < 1 {
			return nil
		}

		//if err := r.addExpansion(tx, nodes); err != nil {
		//	return err
		//}

		return nil
	}); err != nil {
		log.WithContext(ctx).Errorf("failed to access db, err: %v", err)
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}

	return nodes, nil
}

func (r *DataGradeRepo) ListTree(ctx context.Context, treeID models.ModelID) ([]*data_grade.TreeNodeExt, error) {
	var nodes []*data_grade.TreeNodeExt
	if err := r.do(ctx).
		// SELECT
		//	id,parent_id,name,describe,category_num,mgm_dep_id,mgm_dep_name,sort_weight,created_at,updated_at
		// FROM
		//	tree_node
		// WHERE
		//	tree_id = 1 AND
		//	tree_node.deleted_at = 0
		Select("id", "parent_id", "name", "description", "node_type", "icon", "sort_weight", "created_at", "updated_at", "sensitive_attri", "secret_attri", "share_condition", "data_protection_query").
		//Where("tree_id = ?", treeID).
		//Where("parent_id != ?", 0).
		Find(&nodes).
		Error; err != nil {
		log.WithContext(ctx).Errorf("failed to access db, err: %v", err)
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}

	return nodes, nil
}

func (r *DataGradeRepo) ListTreeAndKeyword(ctx context.Context, treeID models.ModelID, keyword string) ([]*data_grade.TreeNodeExt, error) {
	if len(keyword) < 1 {
		return nil, errors.New("internal error: keyword is empty")
	}

	var cacheNodes []*data_grade.TreeNodeExt
	if err := r.do(ctx).Transaction(func(tx *gorm.DB) error { // 一致性读
		tx = tx.WithContext(ctx)

		var nodes []*data_grade.TreeNodeExt
		// SELECT
		//	id,parent_id,name,describe,category_num,mgm_dep_id,mgm_dep_name,sort_weight,created_at,updated_at
		// FROM
		//	tree_node
		// WHERE
		//	tree_id = 1 AND
		//	name LIKE '%keyword%' AND
		//	tree_node.deleted_at = 0
		if err := tx.
			Select("id", "parent_id", "name", "description", "node_type", "icon", "sort_weight", "created_at", "updated_at", "sensitive_attri", "secret_attri", "share_condition", "data_protection_query").
			//Where("tree_id = ?", treeID).
			Where("name LIKE ?", "%"+util.KeywordEscape(keyword)+"%").
			Find(&nodes).Error; err != nil {
			return err
		}

		if len(nodes) < 1 {
			return nil
		}

		hitNodeMap := make(map[models.ModelID]*data_grade.TreeNodeExt)
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
			// 	id,parent_id,name,describe,category_num,mgm_dep_id,mgm_dep_name,sort_weight,created_at,updated_at
			// FROM
			//	tree_node
			// WHERE
			//	tree_id = 1 AND
			//	id IN (1,457289004686026437) AND
			//	tree_node.deleted_at = 0
			if err := tx.
				//Select("id", "parent_id", "name", "describe", "category_num", "mgm_dep_id", "mgm_dep_name", "sort_weight", "created_at", "updated_at").
				Select("id", "parent_id", "name", "description", "node_type", "icon", "sort_weight", "created_at", "updated_at", "sensitive_attri", "secret_attri", "share_condition", "data_protection_query").
				//Where("tree_id = ?", treeID).
				Where("id IN ?", parentIds).
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
			//	id,parent_id,name,describe,category_num,mgm_dep_id,mgm_dep_name,sort_weight,created_at,updated_at
			// FROM
			//	tree_node
			// WHERE
			//	tree_id = 1 AND
			//	parent_id IN (457714793097242309,457715276901820101,457715296984147653,457721055058896581) AND
			//	tree_node.deleted_at = 0
			if err := tx.
				//Select("id", "parent_id", "name", "describe", "category_num", "mgm_dep_id", "mgm_dep_name", "sort_weight", "created_at", "updated_at").
				Select("id", "parent_id", "name", "description", "node_type", "icon", "sort_weight", "created_at", "updated_at", "sensitive_attri", "secret_attri", "share_condition", "data_protection_query").
				//Where("tree_id = ?", treeID).
				Where("parent_id IN ?", needDeepParentIds).
				Find(&nodes).Error; err != nil {
				return err
			}

			if len(nodes) < 1 {
				break
			}

			cacheNodes = append(cacheNodes, nodes...)

			needDeepParentIds = append(needDeepParentIds[:0], lo.Map(nodes, func(node *data_grade.TreeNodeExt, idx int) models.ModelID {
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

func (r *DataGradeRepo) GetInfoByID(ctx context.Context, id models.ModelID) (dataGrade *model.DataGrade, err error) {
	do := r.do(ctx)
	//SELECT id FROM data_grade WHERE id = 1 AND tree_info.deleted_at = 0 LIMIT 1
	if err = do.Model(&model.DataGrade{}).
		Select("id", "parent_id", "name", "description", "node_type", "icon", "sort_weight", "created_at", "updated_at", "sensitive_attri", "secret_attri", "share_condition", "data_protection_query").
		Where("id = ?", id).
		Limit(1).
		Scan(&dataGrade).Error; err != nil {
		log.WithContext(ctx).Errorf("failed to access db, err: %v", err)
		if errors.Is(err, gorm.ErrRecordNotFound) {
			err = errorcode.Desc(errorcode.TreeNotExist)
			return
		}

		err = errorcode.Detail(errorcode.PublicDatabaseError, err)
		return
	}
	return dataGrade, nil
}
func (r *DataGradeRepo) GetInfoByName(ctx context.Context, name string) (dataGrade *model.DataGrade, err error) {
	do := r.do(ctx)
	//SELECT id FROM data_grade WHERE id = 1 AND tree_info.deleted_at = 0 LIMIT 1
	if err = do.Model(&model.DataGrade{}).
		Select("id", "parent_id", "name", "description", "node_type", "icon", "sort_weight", "created_at", "updated_at", "sensitive_attri", "secret_attri", "share_condition", "data_protection_query").
		Where("name = ?", name).
		Limit(1).
		Scan(&dataGrade).Error; err != nil {
		log.WithContext(ctx).Errorf("failed to access db, err: %v", err)
		if errors.Is(err, gorm.ErrRecordNotFound) {
			err = errorcode.Desc(errorcode.TreeNotExist)
			return
		}

		err = errorcode.Detail(errorcode.PublicDatabaseError, err)
		return
	}
	return dataGrade, nil
}

func (r *DataGradeRepo) ListIcon(ctx context.Context) ([]*model.DataGrade, error) {
	var nodes []*model.DataGrade
	if err := r.do(ctx).
		Select("DISTINCT icon").
		Where("icon != ?", "").
		Where("node_type = ?", 1).
		Find(&nodes).
		Error; err != nil {
		log.WithContext(ctx).Errorf("failed to access db, err: %v", err)
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}

	return nodes, nil
}

func (r *DataGradeRepo) GetListByIds(ctx context.Context, ids string) ([]*model.DataGrade, error) {
	var nodes []*model.DataGrade

	query := fmt.Sprintf("id in (%s)", ids)

	if err := r.do(ctx).Transaction(func(tx *gorm.DB) error {
		tx = tx.WithContext(ctx)
		{
			tx1 := tx.
				Where(query)
			if err := tx1.
				Select("id", "parent_id", "name", "description", "node_type", "icon", "sort_weight", "sensitive_attri", "secret_attri", "share_condition", "data_protection_query").
				Order("sort_weight asc").
				Find(&nodes).
				Error; err != nil {
				return err
			}
		}

		if len(nodes) < 1 {
			return nil
		}

		//if err := r.addExpansion(tx, nodes); err != nil {
		//	return err
		//}

		return nil
	}); err != nil {
		log.WithContext(ctx).Errorf("failed to access db, err: %v", err)
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}

	return nodes, nil
}

func (r *DataGradeRepo) GetBindObjects(ctx context.Context, label string) (DataStandardization,
	BusinessAttri,
	DataView,
	DataCatalog []data_grade.EntrieObj, err error) {
	DataStandardization = make([]data_grade.EntrieObj, 0)
	BusinessAttri = make([]data_grade.EntrieObj, 0)
	DataView = make([]data_grade.EntrieObj, 0)
	DataCatalog = make([]data_grade.EntrieObj, 0)
	// 查询数据标准
	if err = r.do(ctx).Raw("SELECT f_de_id AS id, f_name_cn AS name FROM af_std.t_data_element_info WHERE f_label_id = ?", label).Scan(&DataStandardization).Error; err != nil {
		err = errorcode.Detail(errorcode.PublicDatabaseError, err)
		return
	}
	// 业务属性
	if err = r.do(ctx).Raw("SELECT id AS id, name AS name FROM af_main.subject_domain WHERE label_id = ?", label).Scan(&BusinessAttri).Error; err != nil {
		err = errorcode.Detail(errorcode.PublicDatabaseError, err)
		return
	}
	// 逻辑视图
	if err = r.do(ctx).Raw("SELECT id AS id, technical_name AS name FROM af_main.form_view_field WHERE grade_id = ?", label).Scan(&DataView).Error; err != nil {
		err = errorcode.Detail(errorcode.PublicDatabaseError, err)
		return
	}
	// 数据目录TODO
	return
}
