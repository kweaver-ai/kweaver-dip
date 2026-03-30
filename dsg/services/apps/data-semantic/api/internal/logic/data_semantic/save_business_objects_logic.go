// Code scaffolded by goctl. Safe to edit.
// goctl 1.9.2

package data_semantic

import (
	"context"
	"fmt"

	"github.com/kweaver-ai/dsg/services/apps/data-semantic/api/internal/errorx"
	"github.com/kweaver-ai/dsg/services/apps/data-semantic/api/internal/middleware"
	"github.com/kweaver-ai/dsg/services/apps/data-semantic/api/internal/svc"
	"github.com/kweaver-ai/dsg/services/apps/data-semantic/api/internal/types"
	"github.com/kweaver-ai/dsg/services/apps/data-semantic/model/data_understanding/business_object_attributes_temp"
	"github.com/kweaver-ai/dsg/services/apps/data-semantic/model/data_understanding/business_object_temp"

	"github.com/zeromicro/go-zero/core/logx"
)

type SaveBusinessObjectsLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

// 保存业务对象及属性
func NewSaveBusinessObjectsLogic(ctx context.Context, svcCtx *svc.ServiceContext) *SaveBusinessObjectsLogic {
	return &SaveBusinessObjectsLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *SaveBusinessObjectsLogic) SaveBusinessObjects(req *types.SaveBusinessObjectsReq) (resp *types.SaveBusinessObjectsResp, err error) {
	logx.Infof("SaveBusinessObjects called with pathId: %s, type: %s, opId: %s, name: %s",
		req.Id, req.Type, req.OpId, req.Name)

	// 根据 type 决定更新业务对象还是属性
	if req.Type == "object" {
		err = l.saveBusinessObjectName(req.OpId, req.Name)
		if err != nil {
			return nil, err
		}

	} else if req.Type == "attribute" {
		err = l.saveAttributeName(req.OpId, req.Name)
		if err != nil {
			return nil, err
		}
	} else {
		return nil, errorx.Desc(errorx.PublicInvalidParameter, fmt.Sprintf("无效的 type 参数: %s，必须是 'object' 或 'attribute'", req.Type))
	}

	// 注意：此操作不递增版本号，仅更新当前版本的临时数据

	resp = &types.SaveBusinessObjectsResp{
		Code: 0,
	}

	return resp, nil
}

// saveBusinessObjectName 保存业务对象名称
func (l *SaveBusinessObjectsLogic) saveBusinessObjectName(id, name string) error {
	businessObjectTempModel := business_object_temp.NewBusinessObjectTempModelSqlx(l.svcCtx.DB)

	// 先查询记录是否存在
	objData, err := businessObjectTempModel.FindOneById(l.ctx, id)
	if err != nil {
		return errorx.Detail(errorx.QueryFailed, err, "业务对象")
	}

	// 名称重复校验：同一库表下不能有重复的业务对象名称
	err = l.checkDuplicateObjectName(objData.FormViewId, name, id)
	if err != nil {
		return err
	}

	// 获取 user_id 并设置
	userID := l.getUserIDFromContext()
	objData.ObjectName = name
	objData.UserId = &userID

	// 更新名称和 user_id
	err = businessObjectTempModel.Update(l.ctx, objData)
	if err != nil {
		return errorx.Detail(errorx.UpdateFailed, err, "业务对象名称")
	}

	logx.WithContext(l.ctx).Infof("Updated business object name: id=%s, name=%s, user_id=%s", id, name, userID)
	return nil
}

// saveAttributeName 保存属性名称
func (l *SaveBusinessObjectsLogic) saveAttributeName(id, name string) error {
	businessObjectAttrTempModel := business_object_attributes_temp.NewBusinessObjectAttributesTempModelSqlx(l.svcCtx.DB)

	// 先查询记录是否存在
	attrData, err := businessObjectAttrTempModel.FindOneById(l.ctx, id)
	if err != nil {
		return errorx.Detail(errorx.QueryFailed, err, "业务对象属性")
	}

	// 名称重复校验：同一业务对象下，同一字段的属性名称不能重复
	err = l.checkDuplicateAttrName(attrData.BusinessObjectId, attrData.FormViewFieldId, name, id)
	if err != nil {
		return err
	}

	// 获取 user_id 并设置
	userID := l.getUserIDFromContext()
	attrData.AttrName = name
	attrData.UserId = &userID

	// 更新名称和 user_id
	err = businessObjectAttrTempModel.Update(l.ctx, attrData)
	if err != nil {
		return errorx.Detail(errorx.UpdateFailed, err, "属性名称")
	}

	logx.WithContext(l.ctx).Infof("Updated attribute name: id=%s, name=%s, user_id=%s", id, name, userID)
	return nil
}

// checkDuplicateObjectName 检查业务对象名称是否重复
func (l *SaveBusinessObjectsLogic) checkDuplicateObjectName(formViewId, name, excludeId string) error {
	var count int64
	query := `SELECT COUNT(*) FROM t_business_object_temp WHERE form_view_id = ? AND object_name = ? AND id != ? AND deleted_at IS NULL`
	err := l.svcCtx.DB.QueryRowCtx(l.ctx, &count, query, formViewId, name, excludeId)
	if err != nil {
		return errorx.Detail(errorx.QueryFailed, err, "业务对象名称重复校验")
	}
	if count > 0 {
		return errorx.Desc(errorx.DuplicateName, "业务对象", name)
	}
	return nil
}

// checkDuplicateAttrName 检查属性名称是否重复（同一业务对象下，同一字段的属性名称不能重复）
func (l *SaveBusinessObjectsLogic) checkDuplicateAttrName(businessObjectId, formViewFieldId, name, excludeId string) error {
	var count int64
	query := `SELECT COUNT(*) FROM t_business_object_attributes_temp WHERE business_object_id = ? AND form_view_field_id = ? AND attr_name = ? AND id != ? AND deleted_at IS NULL`
	err := l.svcCtx.DB.QueryRowCtx(l.ctx, &count, query, businessObjectId, formViewFieldId, name, excludeId)
	if err != nil {
		return errorx.Detail(errorx.QueryFailed, err, "属性名称重复校验")
	}
	if count > 0 {
		return errorx.Desc(errorx.DuplicateName, "属性", name)
	}
	return nil
}

// getUserIDFromContext 从 context 中获取 user_id
func (l *SaveBusinessObjectsLogic) getUserIDFromContext() string {
	if userInfo, ok := l.ctx.Value(middleware.InfoName).(*middleware.UserInfo); ok && userInfo != nil {
		return userInfo.ID
	}
	return ""
}
