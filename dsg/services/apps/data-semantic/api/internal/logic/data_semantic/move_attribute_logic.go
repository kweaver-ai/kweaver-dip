// Code scaffolded by goctl. Safe to edit.
// goctl 1.9.2

package data_semantic

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/data-semantic/api/internal/errorx"
	"github.com/kweaver-ai/dsg/services/apps/data-semantic/api/internal/svc"
	"github.com/kweaver-ai/dsg/services/apps/data-semantic/api/internal/types"
	"github.com/kweaver-ai/dsg/services/apps/data-semantic/model/data_understanding/business_object"
	business_object_attributes "github.com/kweaver-ai/dsg/services/apps/data-semantic/model/data_understanding/business_object_attributes"
	"github.com/kweaver-ai/dsg/services/apps/data-semantic/model/data_understanding/business_object_attributes_temp"
	"github.com/kweaver-ai/dsg/services/apps/data-semantic/model/data_understanding/business_object_temp"
	"github.com/kweaver-ai/dsg/services/apps/data-semantic/model/form_view"

	"github.com/zeromicro/go-zero/core/logx"
	"github.com/zeromicro/go-zero/core/stores/sqlx"
)

type MoveAttributeLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

// 调整属性归属业务对象
func NewMoveAttributeLogic(ctx context.Context, svcCtx *svc.ServiceContext) *MoveAttributeLogic {
	return &MoveAttributeLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *MoveAttributeLogic) MoveAttribute(req *types.MoveAttributeReq) (resp *types.MoveAttributeResp, err error) {
	logx.Infof("MoveAttribute called with id: %s, attributeId: %s, targetObjectUuid: %s",
		req.Id, req.AttributeId, req.TargetObjectUuid)

	// 1. 查询库表视图状态
	formViewModel := form_view.NewFormViewModel(l.svcCtx.DB)
	formViewData, err := formViewModel.FindOneById(l.ctx, req.Id)
	if err != nil {
		return nil, errorx.Detail(errorx.QueryFailed, err, "库表视图")
	}

	// 2. 根据状态选择操作目标：状态2操作临时表，状态3/5操作正式表
	switch formViewData.UnderstandStatus {
	case form_view.StatusPendingConfirm:
		return l.moveAttributeInTemp(req)
	case form_view.StatusCompleted, form_view.StatusFailed:
		return l.moveAttributeInFormal(req)
	default:
		return nil, errorx.Desc(errorx.InvalidUnderstandStatus)
	}
}

// moveAttributeInTemp 在临时表中调整属性归属（状态 2）
func (l *MoveAttributeLogic) moveAttributeInTemp(req *types.MoveAttributeReq) (resp *types.MoveAttributeResp, err error) {
	err = l.svcCtx.DB.TransactCtx(l.ctx, func(ctx context.Context, session sqlx.Session) error {
		businessObjectTempModel := business_object_temp.NewBusinessObjectTempModelSession(session)
		businessObjectAttrTempModel := business_object_attributes_temp.NewBusinessObjectAttributesTempModelSession(session)

		// 验证目标业务对象是否存在
		targetObject, err := businessObjectTempModel.FindOneById(ctx, req.TargetObjectUuid)
		if err != nil {
			return errorx.Detail(errorx.QueryFailed, err, "目标业务对象")
		}

		// 验证属性是否存在
		attribute, err := businessObjectAttrTempModel.FindOneById(ctx, req.AttributeId)
		if err != nil {
			return errorx.Detail(errorx.QueryFailed, err, "属性")
		}

		// 校验 form_view_id：属性和目标业务对象必须属于同一库表
		if attribute.FormViewId != req.Id {
			return errorx.Desc(errorx.DataNotBelongToFormView, "属性")
		}
		if targetObject.FormViewId != req.Id {
			return errorx.Desc(errorx.DataNotBelongToFormView, "目标业务对象")
		}

		// 检查是否自移动
		if attribute.BusinessObjectId == req.TargetObjectUuid {
			return errorx.Desc(errorx.AttributeAlreadyBelongToObject)
		}

		// 检查目标业务对象下，同一字段是否已存在同名属性
		targetAttrs, err := businessObjectAttrTempModel.FindByBusinessObjectId(ctx, req.TargetObjectUuid)
		if err != nil {
			return errorx.Detail(errorx.QueryFailed, err, "目标业务对象的属性列表")
		}
		for _, targetAttr := range targetAttrs {
			if targetAttr.Id != req.AttributeId &&
				targetAttr.FormViewFieldId == attribute.FormViewFieldId &&
				targetAttr.AttrName == attribute.AttrName {
				return errorx.Desc(errorx.DuplicateName, "目标业务对象下该字段的属性", attribute.AttrName)
			}
		}

		// 更新属性的 business_object_id
		err = businessObjectAttrTempModel.UpdateBusinessObjectId(ctx, req.AttributeId, req.TargetObjectUuid)
		if err != nil {
			return errorx.Detail(errorx.UpdateFailed, err, "属性归属")
		}

		logx.WithContext(ctx).Infof("Moved attribute in temp table: %s from %s to %s",
			req.AttributeId, attribute.BusinessObjectId, req.TargetObjectUuid)
		return nil
	})

	if err != nil {
		return nil, err
	}

	return &types.MoveAttributeResp{
		AttributeId:      req.AttributeId,
		BusinessObjectId: req.TargetObjectUuid,
	}, nil
}

// moveAttributeInFormal 在正式表中调整属性归属（状态 3）
func (l *MoveAttributeLogic) moveAttributeInFormal(req *types.MoveAttributeReq) (resp *types.MoveAttributeResp, err error) {
	err = l.svcCtx.DB.TransactCtx(l.ctx, func(ctx context.Context, session sqlx.Session) error {
		businessObjectModel := business_object.NewBusinessObjectModelSession(session)
		businessObjectAttrModel := business_object_attributes.NewBusinessObjectAttributesModelSession(session)

		// 验证目标业务对象是否存在
		targetObject, err := businessObjectModel.FindOneById(ctx, req.TargetObjectUuid)
		if err != nil {
			return errorx.Detail(errorx.QueryFailed, err, "目标业务对象")
		}

		// 验证属性是否存在
		attribute, err := businessObjectAttrModel.FindOneById(ctx, req.AttributeId)
		if err != nil {
			return errorx.Detail(errorx.QueryFailed, err, "属性")
		}

		// 校验 form_view_id：属性和目标业务对象必须属于同一库表
		if attribute.FormViewId != req.Id {
			return errorx.Desc(errorx.DataNotBelongToFormView, "属性")
		}
		if targetObject.FormViewId != req.Id {
			return errorx.Desc(errorx.DataNotBelongToFormView, "目标业务对象")
		}

		// 检查是否自移动
		if attribute.BusinessObjectId == req.TargetObjectUuid {
			return errorx.Desc(errorx.AttributeAlreadyBelongToObject)
		}

		// 检查目标业务对象下，同一字段是否已存在同名属性
		targetAttrs, err := businessObjectAttrModel.FindByBusinessObjectId(ctx, req.TargetObjectUuid)
		if err != nil {
			return errorx.Detail(errorx.QueryFailed, err, "目标业务对象的属性列表")
		}
		for _, targetAttr := range targetAttrs {
			if targetAttr.Id != req.AttributeId &&
				targetAttr.FormViewFieldId == attribute.FormViewFieldId &&
				targetAttr.AttrName == attribute.AttrName {
				return errorx.Desc(errorx.DuplicateName, "目标业务对象下该字段的属性", attribute.AttrName)
			}
		}

		// 更新属性的 business_object_id
		err = businessObjectAttrModel.UpdateBusinessObjectId(ctx, req.AttributeId, req.TargetObjectUuid)
		if err != nil {
			return errorx.Detail(errorx.UpdateFailed, err, "属性归属")
		}

		logx.WithContext(ctx).Infof("Moved attribute in formal table: %s from %s to %s",
			req.AttributeId, attribute.BusinessObjectId, req.TargetObjectUuid)
		return nil
	})

	if err != nil {
		return nil, err
	}

	return &types.MoveAttributeResp{
		AttributeId:      req.AttributeId,
		BusinessObjectId: req.TargetObjectUuid,
	}, nil
}
