package impl

import (
	"context"
	"errors"
	"fmt"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/common"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/gorm/flowchart"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/constant"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/models/request"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/util"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/repository/db/model"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/repository/db/model/query"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	_ "github.com/kweaver-ai/idrm-go-frame/core/transport/rest"
	"go.uber.org/zap"
	"gorm.io/gen/field"
	"gorm.io/gorm"
)

type flowchartRepo struct {
	q *query.Query
}

func NewFlowchartRepo(db *gorm.DB) flowchart.Repo {
	return &flowchartRepo{q: common.GetQuery(db)}
}

func (f *flowchartRepo) ListByPaging(ctx context.Context, pageInfo *request.PageInfo, keyword string, includeStatus ...constant.FlowchartEditStatus) ([]*model.Flowchart, int64, error) {
	flowchartDo := f.q.Flowchart
	do := flowchartDo.WithContext(ctx)
	if len(keyword) > 0 {
		do = do.Where(flowchartDo.Name.Like("%" + common.KeywordEscape(keyword) + "%"))
	}

	if len(includeStatus) > 0 {
		do = do.Where(flowchartDo.EditStatus.In(util.ToInt32s(includeStatus)...))
	}

	total, err := do.Count()
	if err != nil {
		log.WithContext(ctx).Error("failed to get flowchart count from db", zap.Error(err))
		return nil, 0, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}

	if pageInfo.Limit > 0 {
		limit := pageInfo.Limit
		offset := limit * (pageInfo.Offset - 1)
		do = do.Limit(limit).Offset(offset)
	}

	var orderField field.OrderExpr
	if pageInfo.Sort == constant.SortByCreatedAt {
		orderField = flowchartDo.CreatedAt
	} else {
		orderField = flowchartDo.UpdatedAt
	}

	var orderCond field.Expr
	if pageInfo.Direction == "asc" {
		orderCond = orderField
	} else {
		orderCond = orderField.Desc()
	}

	do = do.Order(orderCond).Order(flowchartDo.ID)

	models, err := do.Find()
	if err != nil {
		log.WithContext(ctx).Error("failed to get flowcharts from db", zap.Error(err))
		return nil, 0, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}

	return models, total, nil
}

func (f *flowchartRepo) ListByPagingNew(ctx context.Context, pageInfo *request.PageInfo, keyword string, all bool, includeStatus []int32) (res []*model.Flowchart, total int64, err error) {
	do := f.q.Flowchart.WithContext(ctx).UnderlyingDB().WithContext(ctx).Debug()

	if len(keyword) > 0 {
		do = do.Where(" name like ? ", "%"+common.KeywordEscape(keyword)+"%")
	}
	if len(includeStatus) > 0 {
		do = do.Where("edit_status in ?", includeStatus)
	}

	if err = do.Where("deleted_at=0").Count(&total).Error; err != nil {
		return
	}
	if pageInfo.Sort == "name" {
		do = do.Order(fmt.Sprintf(" name %s,id asc", pageInfo.Direction))
	} else {
		do = do.Order(fmt.Sprintf("%s %s,id asc", pageInfo.Sort, pageInfo.Direction))
	}

	if !all {
		do = do.Offset((pageInfo.Offset - 1) * pageInfo.Limit).Limit(pageInfo.Limit)
	}

	err = do.Find(&res).Error
	return
}

func (f *flowchartRepo) Get(ctx context.Context, fid string, includeStatus ...constant.FlowchartEditStatus) (*model.Flowchart, error) {
	return f.get(ctx, fid, includeStatus, false)
}

func (f *flowchartRepo) GetUnscoped(ctx context.Context, fid string, includeStatus ...constant.FlowchartEditStatus) (*model.Flowchart, error) {
	return f.get(ctx, fid, includeStatus, true)
}

func (f *flowchartRepo) get(ctx context.Context, fid string, includeStatus []constant.FlowchartEditStatus, unscoped bool) (*model.Flowchart, error) {
	flowchartDo := f.q.Flowchart
	do := flowchartDo.WithContext(ctx).Where(flowchartDo.ID.Eq(fid))
	if len(includeStatus) > 0 {
		do = do.Where(flowchartDo.EditStatus.In(util.ToInt32s(includeStatus)...))
	}

	if unscoped {
		do = do.Unscoped()
	}

	fc, err := do.First()
	if err != nil {
		log.WithContext(ctx).Error("failed to get flowchart form db", zap.String("flowchart id", fid), zap.Error(err))
		if is := errors.Is(err, gorm.ErrRecordNotFound); is {
			return nil, errorcode.Detail(errorcode.FlowchartNotExist, err)
		}

		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}

	return fc, nil
}

func (f *flowchartRepo) Delete(ctx context.Context, fid string) error {
	err := f.q.Transaction(func(tx *query.Query) error {
		flowchartDo := f.q.Flowchart
		flowchartVersionDo := f.q.FlowchartVersion
		flowchartUnit := f.q.FlowchartUnit
		flowchartNodeConfig := f.q.FlowchartNodeConfig
		flowchartNodeTask := f.q.FlowchartNodeTask

		if _, err := flowchartDo.WithContext(ctx).Where(flowchartDo.ID.Eq(fid)).Delete(); err != nil {
			return err
		}

		fvMSli, err := flowchartVersionDo.WithContext(ctx).Select(flowchartVersionDo.ID).Where(flowchartVersionDo.FlowchartID.Eq(fid)).Find()
		if err != nil {
			return err
		}

		if _, err = flowchartVersionDo.WithContext(ctx).Where(flowchartVersionDo.FlowchartID.Eq(fid)).Delete(); err != nil {
			return err
		}

		if len(fvMSli) < 1 {
			return nil
		}

		fvIds := make([]string, 0, len(fvMSli))
		for _, fv := range fvMSli {
			fvIds = append(fvIds, fv.ID)
		}

		if _, err = flowchartUnit.WithContext(ctx).Where(flowchartUnit.FlowchartVersionID.In(fvIds...)).Delete(); err != nil {
			return err
		}

		if _, err = flowchartNodeConfig.WithContext(ctx).Where(flowchartNodeConfig.FlowchartVersionID.In(fvIds...)).Delete(); err != nil {
			return err
		}

		if _, err = flowchartNodeTask.WithContext(ctx).Where(flowchartNodeTask.FlowchartVersionID.In(fvIds...)).Delete(); err != nil {
			return err
		}

		return nil
	})
	if err != nil {
		log.WithContext(ctx).Error("failed to delete flowchart", zap.String("flowchart id", fid), zap.Error(err))
		return errorcode.Detail(errorcode.PublicDatabaseError, err)
	}

	return nil
}

func (f *flowchartRepo) ExistByName(ctx context.Context, name string, excludeIDs ...string) (bool, error) {
	flowchartDo := f.q.Flowchart

	do := flowchartDo.WithContext(ctx).Where(flowchartDo.Name.Eq(name))
	if len(excludeIDs) > 0 {
		do.Where(flowchartDo.ID.NotIn(excludeIDs...))
	}

	models, err := do.Select(flowchartDo.ID).Limit(1).Find()
	if err != nil {
		log.WithContext(ctx).Error("failed to get flowcharts form db", zap.String("flowchart name", name), zap.Strings("flowchart exclude ids", excludeIDs), zap.Error(err))
		return false, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}

	return len(models) > 0, nil
}

func (f *flowchartRepo) Create(ctx context.Context, fc *model.Flowchart, clonedFcV *model.FlowchartVersion, uid string) error {
	err := f.q.Transaction(func(tx *query.Query) error {
		fcDo := tx.Flowchart
		fcVDo := tx.FlowchartVersion

		// 创建fc
		fc.EditStatus = int32(constant.FlowchartEditStatusCreating)
		err := fcDo.WithContext(ctx).Create(fc)
		if err != nil {
			return err
		}

		// 创建fc的第一个版本，状态为编辑中
		vNum := int32(1)
		fcV := &model.FlowchartVersion{
			Name:         util.GenFlowchartVersionName(vNum),
			Version:      vNum,
			EditStatus:   int32(constant.FlowchartEditStatusEditing),
			FlowchartID:  fc.ID,
			CreatedByUID: uid,
			UpdatedByUID: uid,
		}
		if clonedFcV != nil {
			fcV.Image = clonedFcV.Image
			fcV.DrawProperties = clonedFcV.DrawProperties
		}

		err = fcVDo.WithContext(ctx).Create(fcV)
		if err != nil {
			return err
		}

		// 更新fc当前处于编辑中的版本
		_, err = fcDo.WithContext(ctx).Where(fcDo.ID.Eq(fc.ID)).Update(fcDo.EditingVersionID, fcV.ID)
		if err != nil {
			return err
		}

		fc.EditingVersionID = fcV.ID

		if clonedFcV == nil {
			return nil
		}

		// TODO 后面考虑重新解析FlowchartVersion中的Content
		// 处理复用运营流程的逻辑，将复用运营流程的信息拷贝到当前新建的运营流程版本中
		fcUDo := tx.FlowchartUnit
		fcNDo := tx.FlowchartNodeConfig
		fcTDo := tx.FlowchartNodeTask
		// 1. 拷贝运营流程单元
		units, err := fcUDo.WithContext(ctx).Where(fcUDo.FlowchartVersionID.Eq(clonedFcV.ID)).Find()
		if err != nil {
			return err
		}

		nodeUnitIdToIdMap := make(map[string]string)
		nodeIdToUnitIdMap := make(map[string]string)
		for _, unit := range units {
			unit.ID = ""
			unit.FlowchartVersionID = fcV.ID

			if constant.FlowchartUnitType(unit.UnitType) == constant.FlowchartUnitTypeNode {
				nodeUnitIdToIdMap[unit.UnitID] = unit.ID
				nodeIdToUnitIdMap[unit.ID] = unit.UnitID
			}
		}

		err = fcUDo.WithContext(ctx).CreateInBatches(units, common.DefaultBatchSize)
		if err != nil {
			return err
		}

		nodeOldIdToNewIdMap := make(map[string]string)
		for _, unit := range units {
			if constant.FlowchartUnitType(unit.UnitType) != constant.FlowchartUnitTypeNode {
				continue
			}

			nodeOldIdToNewIdMap[nodeUnitIdToIdMap[unit.UnitID]] = unit.ID
		}

		// 2. 拷贝运营流程节点配置
		nodeConfigs, err := fcNDo.WithContext(ctx).Where(fcNDo.FlowchartVersionID.Eq(clonedFcV.ID)).Find()
		if err != nil {
			return err
		}

		for _, nodeConfig := range nodeConfigs {
			nodeConfig.ID = ""
			nodeConfig.FlowchartVersionID = fcV.ID
			nodeConfig.NodeID = nodeOldIdToNewIdMap[nodeConfig.NodeID]
		}

		err = fcNDo.WithContext(ctx).CreateInBatches(nodeConfigs, common.DefaultBatchSize)
		if err != nil {
			return err
		}

		// 3. 拷贝运营流程任务配置
		tasks, err := fcTDo.WithContext(ctx).Where(fcTDo.FlowchartVersionID.Eq(clonedFcV.ID)).Find()
		if err != nil {
			return err
		}

		for _, task := range tasks {
			originNodeId := task.NodeID

			task.ID = ""
			task.NodeID = nodeOldIdToNewIdMap[originNodeId]
			task.NodeUnitID = nodeIdToUnitIdMap[originNodeId]
			task.FlowchartVersionID = fcV.ID
		}

		err = fcTDo.WithContext(ctx).CreateInBatches(tasks, common.DefaultBatchSize)
		if err != nil {
			return err
		}

		return nil
	})
	if err != nil {
		log.WithContext(ctx).Error("failed to create flowchart to db", zap.String("flowchart name", fc.Name), zap.Any("cloned flowchart version", clonedFcV), zap.Error(err))
		return errorcode.Detail(errorcode.PublicDatabaseError, err)
	}

	return nil
}

func (f *flowchartRepo) UpdateNameAndDesc(ctx context.Context, m *model.Flowchart) error {
	if m == nil {
		log.Warn("model is nil in update flowchart name and desc")
		return nil
	}

	fcDo := f.q.Flowchart
	_, err := fcDo.WithContext(ctx).Where(fcDo.ID.Eq(m.ID)).Select(fcDo.Name, fcDo.Description, fcDo.UpdatedByUID).Updates(m)
	if err != nil {
		log.WithContext(ctx).Error("failed to update flowchart to db", zap.String("flowchart id", m.ID), zap.String("flowchart name", m.Name), zap.Error(err))
		return errorcode.Detail(errorcode.PublicDatabaseError, err)
	}

	return nil
}

func (f *flowchartRepo) Count(ctx context.Context, status ...constant.FlowchartEditStatus) (int64, error) {
	flowchartDo := f.q.Flowchart
	do := flowchartDo.WithContext(ctx)

	if len(status) > 0 {
		do = do.Where(flowchartDo.EditStatus.In(util.ToInt32s(status)...))
	}

	count, err := do.Count()
	if err != nil {
		log.WithContext(ctx).Error("failed to count flowcharts from db", zap.Error(err))
		return 0, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}

	return count, nil
}

// func (f *flowchartRepo) PreEdit(ctx context.Context, inFcM *model.Flowchart, fcV *model.FlowchartVersion) (*model.FlowchartVersion, bool, error) {
// 	var suc bool
//
// 	err := f.q.Transaction(func(tx *query.Query) error {
// 		fcDo := tx.Flowchart
// 		_fcDo := fcDo.WithContext(ctx)
// 		fcVDo := tx.FlowchartVersion
// 		_fcVDo := fcVDo.WithContext(ctx)
//
// 		fc, err := _fcDo.Where(fcDo.ID.Eq(inFcM.ID)).First()
// 		if err != nil {
// 			if errors.Is(err, gorm.ErrRecordNotFound) {
// 				return errorcode.Detail(errorcode.FlowchartNotExist, err)
// 			}
// 			return err
// 		}
//
// 		if fc.EditStatus != constant.FlowchartEditStatusNormal || fc.CurrentVersionID != inFcM.CurrentVersionID {
// 			suc = false
// 			return nil
// 		}
//
// 		if fc.EditStatus+1 != constant.FlowchartEditStatusEditing {
// 			return errorcode.Detail(errorcode.PublicInternalError, fmt.Errorf("logic error::FlowchartEditStatusNormal+1 != FlowchartEditStatusEditing"))
// 		}
//
// 		_, err = _fcDo.Where(fcDo.ID.Eq(fc.ID)).UpdateSimple(fcDo.EditStatus.Add(1))
// 		if err != nil {
// 			return err
// 		}
//
// 		fc, err = _fcDo.Where(fcDo.ID.Eq(fc.ID)).First()
// 		if err != nil {
// 			if errors.Is(err, gorm.ErrRecordNotFound) {
// 				return errorcode.Detail(errorcode.FlowchartNotExist, err)
// 			}
// 			return err
// 		}
//
// 		// 检测是否已被其它逻辑设置状态
// 		if fc.EditStatus != constant.FlowchartEditStatusEditing {
// 			suc = false
// 			return nil
// 		}
//
// 		err = _fcVDo.Create(fcV)
// 		if err != nil {
// 			return err
// 		}
//
// 		suc = true
// 		return nil
// 	})
// 	if err != nil {
// 		log.WithContext(ctx).Error("failed to get flowchart form db", zap.String("flowchart id", inFcM.ID), zap.Error(err))
// 		var agErr *agerrors.Error
// 		if errors.As(err, &agErr) {
// 			return nil, false, err
// 		}
//
// 		return nil, false, errorcode.Detail(errorcode.PublicDatabaseError, err)
// 	}
//
// 	return fcV, suc, nil
// }

// MarkFlowchartByRoleId mark flowchart.config_status by flowchartId fid,
//func (f *flowchartRepo) MarkFlowchartByRoleId(ctx context.Context, rid string, status int) error {
//	fc := f.q.Flowchart
//	ft := f.q.FlowchartNodeTask
//	/*
//	 SELECT fc.id,fc.current_version_id,ft.exec_role_id
//	 FROM flowchart fc LEFT JOIN flowchart_node_task ft
//	 ON ft.flowchart_version_id=fc.current_version_id
//	 WHERE fc.current_version_id IS NOT NULL AND
//	 	fc.edit_status>1 AND
//	 	ft.exec_role_id='3c86b2ff-97e0-4d8b-a904-c8a01fc444fd' AND
//	 	fc.deleted_at IS NULL
//	*/
//	fi := fc.WithContext(ctx).Select(fc.ID, fc.CurrentVersionID).LeftJoin(ft, ft.FlowchartVersionID.EqCol(fc.CurrentVersionID))
//	flowcharts, err := fi.Where(fc.CurrentVersionID.IsNotNull(), fc.EditStatus.Gt(int32(constant.FlowchartEditStatusCreating)),
//		ft.ExecRoleID.Eq(rid)).Find()
//	if err != nil {
//		return fmt.Errorf("query related flowchart error %v", err)
//	}
//
//	session := f.q
//	err = session.Transaction(func(tx *query.Query) error {
//		for _, flowchart := range flowcharts {
//			//mark flowchart
//			_, err := tx.Flowchart.WithContext(ctx).Where(fc.ID.Eq(flowchart.ID)).Update(fc.ConfigStatus, status)
//			if err != nil {
//				return fmt.Errorf("mark related flowchart error %v", err)
//			}
//			//set FlowchartNodeTask executor
//			_, err = tx.FlowchartNodeTask.WithContext(ctx).Where(ft.FlowchartVersionID.Eq(flowchart.CurrentVersionID),
//				ft.ExecRoleID.Eq(rid)).Update(ft.ExecRoleID, "")
//			if err != nil {
//				return fmt.Errorf("set related FlowchartNodeTask error %v", err)
//			}
//		}
//		return nil
//	})
//	return err
//}
