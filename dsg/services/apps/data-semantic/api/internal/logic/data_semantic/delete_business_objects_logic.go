// Code scaffolded by goctl. Safe to edit.
// goctl 1.9.2

package data_semantic

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/data-semantic/api/internal/errorx"
	"github.com/kweaver-ai/dsg/services/apps/data-semantic/api/internal/svc"
	"github.com/kweaver-ai/dsg/services/apps/data-semantic/api/internal/types"
	"github.com/kweaver-ai/dsg/services/apps/data-semantic/model/data_understanding/business_object"
	"github.com/kweaver-ai/dsg/services/apps/data-semantic/model/data_understanding/business_object_attributes_temp"
	"github.com/kweaver-ai/dsg/services/apps/data-semantic/model/data_understanding/business_object_temp"
	"github.com/kweaver-ai/dsg/services/apps/data-semantic/model/form_view"

	"github.com/zeromicro/go-zero/core/logx"
	"github.com/zeromicro/go-zero/core/stores/sqlx"
)

type DeleteBusinessObjectsLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

// 删除识别结果
func NewDeleteBusinessObjectsLogic(ctx context.Context, svcCtx *svc.ServiceContext) *DeleteBusinessObjectsLogic {
	return &DeleteBusinessObjectsLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *DeleteBusinessObjectsLogic) DeleteBusinessObjects(req *types.DeleteBusinessObjectsReq) (resp *types.DeleteBusinessObjectsResp, err error) {
	logx.Infof("DeleteBusinessObjects called with id: %s", req.Id)

	// 1. 状态校验 (仅允许状态 2 删除)
	formViewModel := form_view.NewFormViewModel(l.svcCtx.DB)
	formViewData, err := formViewModel.FindOneById(l.ctx, req.Id)
	if err != nil {
		return nil, errorx.Detail(errorx.QueryFailed, err, "库表视图")
	}

	if formViewData.UnderstandStatus != form_view.StatusPendingConfirm {
		return nil, errorx.Desc(errorx.InvalidUnderstandStatus)
	}

	// 2. 检查正式表是否有数据（在事务外查询，确定新状态）
	businessObjectModel := business_object.NewBusinessObjectModelSqlx(l.svcCtx.DB)
	formalDataCount, err := businessObjectModel.CountByFormViewId(l.ctx, req.Id)
	if err != nil {
		return nil, errorx.Detail(errorx.QueryFailed, err, "正式表数据")
	}

	var newStatus int8
	if formalDataCount > 0 {
		// 正式表有数据，保持状态 3 (已完成)
		newStatus = form_view.StatusCompleted
	} else {
		// 正式表无数据，回退到状态 0 (未理解)
		newStatus = form_view.StatusNotUnderstanding
	}

	// 3. 使用事务执行删除和状态更新操作（保证原子性）
	err = l.svcCtx.DB.TransactCtx(l.ctx, func(ctx context.Context, session sqlx.Session) error {
		// 使用事务的 Session 创建 model 实例
		tempModel := business_object_temp.NewBusinessObjectTempModelSession(session)
		tempAttrModel := business_object_attributes_temp.NewBusinessObjectAttributesTempModelSession(session)
		formViewModelSession := form_view.NewFormViewModelSession(session)

		// 逻辑删除当前使用的业务对象临时数据（in_use = 1）
		err := tempModel.DeleteByFormViewIdAndInUse(ctx, req.Id, 1)
		if err != nil {
			return errorx.Detail(errorx.DeleteFailed, err, "临时表业务对象数据")
		}

		// 逻辑删除当前使用的属性临时数据（in_use = 1）
		err = tempAttrModel.DeleteByFormViewIdAndInUse(ctx, req.Id, 1)
		if err != nil {
			return errorx.Detail(errorx.DeleteFailed, err, "临时表属性数据")
		}

		// 更新理解状态
		err = formViewModelSession.UpdateUnderstandStatus(ctx, req.Id, newStatus)
		if err != nil {
			return errorx.Detail(errorx.UpdateFailed, err, "理解状态")
		}

		return nil
	})
	if err != nil {
		return nil, err
	}

	logx.WithContext(l.ctx).Infof("Delete business objects successful: form_view_id=%s, in_use=1, new_status=%d, formal_data_count=%d",
		req.Id, newStatus, formalDataCount)

	resp = &types.DeleteBusinessObjectsResp{
		Success: true,
	}

	return resp, nil
}
