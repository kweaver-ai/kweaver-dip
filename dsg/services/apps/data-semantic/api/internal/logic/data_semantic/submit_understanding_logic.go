// Code scaffolded by goctl. Safe to edit.
// goctl 1.9.2

package data_semantic

import (
	"context"
	"time"

	"github.com/kweaver-ai/dsg/services/apps/data-semantic/api/internal/errorx"
	"github.com/kweaver-ai/dsg/services/apps/data-semantic/api/internal/svc"
	"github.com/kweaver-ai/dsg/services/apps/data-semantic/api/internal/types"
	"github.com/kweaver-ai/dsg/services/apps/data-semantic/model/data_understanding/business_object"
	"github.com/kweaver-ai/dsg/services/apps/data-semantic/model/data_understanding/business_object_attributes"
	"github.com/kweaver-ai/dsg/services/apps/data-semantic/model/data_understanding/business_object_attributes_temp"
	"github.com/kweaver-ai/dsg/services/apps/data-semantic/model/data_understanding/business_object_temp"
	"github.com/kweaver-ai/dsg/services/apps/data-semantic/model/data_understanding/form_view_field_info_temp"
	"github.com/kweaver-ai/dsg/services/apps/data-semantic/model/data_understanding/form_view_info_temp"
	"github.com/kweaver-ai/dsg/services/apps/data-semantic/model/form_view"
	"github.com/kweaver-ai/dsg/services/apps/data-semantic/model/form_view_field"

	"github.com/zeromicro/go-zero/core/logx"
	"github.com/zeromicro/go-zero/core/stores/sqlx"
)

type SubmitUnderstandingLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

// 提交确认理解数据
func NewSubmitUnderstandingLogic(ctx context.Context, svcCtx *svc.ServiceContext) *SubmitUnderstandingLogic {
	return &SubmitUnderstandingLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *SubmitUnderstandingLogic) SubmitUnderstanding(req *types.SubmitUnderstandingReq) (resp *types.SubmitUnderstandingResp, err error) {
	logx.Infof("SubmitUnderstanding called with id: %s", req.Id)

	// 1. 状态校验 (仅允许状态 2 提交)
	formViewModel := form_view.NewFormViewModel(l.svcCtx.DB)
	formViewData, err := formViewModel.FindOneById(l.ctx, req.Id)
	if err != nil {
		return nil, errorx.Detail(errorx.QueryFailed, err, "库表视图")
	}

	if formViewData.UnderstandStatus != form_view.StatusPendingConfirm {
		return nil, errorx.Desc(errorx.InvalidUnderstandStatus)
	}

	// 2. 获取当前版本号
	businessObjectTempModel := business_object_temp.NewBusinessObjectTempModelSqlx(l.svcCtx.DB)
	latestVersion, err := businessObjectTempModel.FindLatestVersionByFormViewId(l.ctx, req.Id)
	if err != nil {
		return nil, errorx.Detail(errorx.QueryFailed, err, "当前版本号")
	}
	if latestVersion == 0 {
		return nil, errorx.Desc(errorx.NoDataToCommit)
	}

	// 3. 开启事务处理
	// 创建独立的 context，设置 120 秒超时，避免 HTTP 请求 context 的超时限制
	txCtx, cancel := context.WithTimeout(context.Background(), 120*time.Second)
	defer cancel()

	err = l.svcCtx.DB.TransactCtx(txCtx, func(ctx context.Context, session sqlx.Session) error {
		// 使用事务的 Session 创建 model 实例
		tempModel := business_object_temp.NewBusinessObjectTempModelSession(session)
		tempAttrModel := business_object_attributes_temp.NewBusinessObjectAttributesTempModelSession(session)
		tempFormViewInfoModel := form_view_info_temp.NewFormViewInfoTempModelSession(session)
		tempFormViewFieldInfoModel := form_view_field_info_temp.NewFormViewFieldInfoTempModelSession(session)
		formalModel := business_object.NewBusinessObjectModelSession(session)
		formalAttrModel := business_object_attributes.NewBusinessObjectAttributesModelSession(session)
		formViewModelSession := form_view.NewFormViewModelSession(session)
		formViewFieldModel := form_view_field.NewFormViewFieldModelSession(session)

		// ========== 处理业务对象（按 object_name 匹配：存在则忽略，不存在则新增）==========
		// 获取 mdlId（统一视图ID）
		mdlId := formViewData.MdlId
		objInserted, err := l.processBusinessObjects(ctx, req.Id, latestVersion, mdlId, tempModel, formalModel)
		if err != nil {
			return errorx.Detail(errorx.UpdateFailed, err, "业务对象")
		}
		logx.WithContext(ctx).Infof("Business objects: inserted=%d", objInserted)

		// ========== 处理业务对象属性 ==========
		attrInserted, attrUpdated, err := l.processBusinessObjectAttributes(ctx, req.Id, tempModel, tempAttrModel, formalModel, formalAttrModel)
		if err != nil {
			return errorx.Detail(errorx.UpdateFailed, err, "属性")
		}
		logx.WithContext(ctx).Infof("Attributes: inserted=%d, updated=%d", attrInserted, attrUpdated)

		// ========== 更新库表业务名称和描述 ==========
		if err := l.updateFormViewInfo(ctx, req.Id, tempFormViewInfoModel, formViewModelSession); err != nil {
			return errorx.Detail(errorx.UpdateFailed, err, "库表信息")
		}
		logx.WithContext(ctx).Infof("Updated form view info")

		// ========== 更新字段业务名称、角色和描述 ==========
		fieldUpdated, err := l.updateFormViewFieldInfo(ctx, req.Id, tempFormViewFieldInfoModel, formViewFieldModel)
		if err != nil {
			return errorx.Detail(errorx.UpdateFailed, err, "字段信息")
		}
		logx.WithContext(ctx).Infof("Updated form view field info: updated=%d", fieldUpdated)

		// ========== 更新 form_view 状态为 3 (已完成) ==========
		logx.WithContext(ctx).Infof("=== 准备更新状态: id=%s, currentStatus=%d, newStatus=%d ===", req.Id, form_view.StatusPendingConfirm, form_view.StatusCompleted)
		err = formViewModelSession.UpdateUnderstandStatus(ctx, req.Id, form_view.StatusCompleted)
		if err != nil {
			logx.WithContext(ctx).Errorf("=== 更新状态失败: %v ===", err)
			return errorx.Detail(errorx.UpdateFailed, err, "理解状态")
		}
		logx.WithContext(ctx).Infof("=== 状态更新成功 ===")

		return nil
	})
	if err != nil {
		logx.WithContext(l.ctx).Errorf("=== 事务失败: %v ===", err)
		return nil, err
	}

	logx.WithContext(l.ctx).Infof("Submit understanding successful: form_view_id=%s, version=%d", req.Id, latestVersion)

	resp = &types.SubmitUnderstandingResp{
		Success: true,
	}

	return resp, nil
}

// processBusinessObjects 处理业务对象
// 规则：按 object_name 匹配，存在则忽略（使用正式表id），不存在则新增
func (l *SubmitUnderstandingLogic) processBusinessObjects(
	ctx context.Context,
	formViewId string,
	version int,
	mdlId string,
	tempModel *business_object_temp.BusinessObjectTempModelSqlx,
	formalModel *business_object.BusinessObjectModelSqlx,
) (inserted int, err error) {
	// 1. 查询临时表数据
	tempObjs, err := tempModel.FindByFormViewAndVersion(ctx, formViewId, version)
	if err != nil {
		return 0, err
	}

	// 2. 查询正式表数据，构建 object_name -> id 映射
	formalObjs, err := formalModel.FindByFormViewId(ctx, formViewId)
	if err != nil {
		return 0, err
	}
	logx.WithContext(ctx).Infof("formalObjs count: %d, mdlId: %s", len(formalObjs), mdlId)

	formalObjMap := make(map[string]string) // object_name -> id
	for _, obj := range formalObjs {
		formalObjMap[obj.ObjectName] = obj.Id
		logx.WithContext(ctx).Infof("formalObj: %s, mdl_id: %s", obj.ObjectName, obj.MdlId)
	}

	// 3. 处理临时表对象：不存在则新增，存在则更新 mdl_id
	// 收集需要更新 mdl_id 的正式表对象 ID
	var formalObjIds []string
	for _, obj := range tempObjs {
		if existingId, exists := formalObjMap[obj.ObjectName]; exists {
			// 已存在，收集 ID 用于更新 mdl_id
			formalObjIds = append(formalObjIds, existingId)
			continue
		}

		// 不存在，新增
		newObj := &business_object.BusinessObject{
			Id:         obj.Id,
			ObjectName: obj.ObjectName,
			FormViewId: obj.FormViewId,
			MdlId:      mdlId,
			ObjectType: 0, // 默认对象类型
			Status:     1, // 默认状态
		}
		if _, err := formalModel.Insert(ctx, newObj); err != nil {
			return 0, err
		}
		inserted++
	}

	// 4. 批量更新已存在业务对象的 mdl_id
	if len(formalObjIds) > 0 {
		if err := formalModel.BatchUpdateMdlId(ctx, formalObjIds, mdlId); err != nil {
			return 0, err
		}
	}

	return inserted, nil
}

// processBusinessObjectAttributes 处理业务对象属性
// 规则：保证一个字段只能绑定一个属性
// 1. 新增的业务对象：更新原来字段的属性名以及业务对象所属为当前业务对象
// 2. 已存在的业务对象：检查字段是否存在属性，存在→更新，不存在→新增
func (l *SubmitUnderstandingLogic) processBusinessObjectAttributes(
	ctx context.Context,
	formViewId string,
	tempModel *business_object_temp.BusinessObjectTempModelSqlx,
	tempAttrModel *business_object_attributes_temp.BusinessObjectAttributesTempModelSqlx,
	formalModel *business_object.BusinessObjectModelSqlx,
	formalAttrModel *business_object_attributes.BusinessObjectAttributesModelSqlx,
) (inserted, updated int, err error) {
	// 1. 查询数据：临时表查询最新版本，正式表查询全部
	tempAttrs, _ := tempAttrModel.FindByFormViewIdLatest(ctx, formViewId)
	tempObjs, _ := tempModel.FindByFormViewIdLatest(ctx, formViewId)
	formalAttrs, _ := formalAttrModel.FindByFormViewId(ctx, formViewId)
	formalObjs, _ := formalModel.FindByFormViewId(ctx, formViewId)

	// 2. 构建映射
	tempObjIdToName := make(map[string]string)
	for _, obj := range tempObjs {
		tempObjIdToName[obj.Id] = obj.ObjectName
	}
	formalObjIdByName := make(map[string]string)
	for _, obj := range formalObjs {
		formalObjIdByName[obj.ObjectName] = obj.Id
	}
	// 字段 -> 现有属性
	fieldToExistingAttr := make(map[string]*business_object_attributes.BusinessObjectAttributes)
	for _, fa := range formalAttrs {
		fieldToExistingAttr[fa.FormViewFieldId] = fa
	}

	// 3. 分类：需要更新的、需要新增的
	var toUpdate []*business_object_attributes.BusinessObjectAttributes
	var toInsert []*business_object_attributes.BusinessObjectAttributes

	for _, attr := range tempAttrs {
		// 处理未识别字段：BusinessObjectId 为空的情况
		var formalObjId string
		if attr.BusinessObjectId != "" {
			objName := tempObjIdToName[attr.BusinessObjectId]
			formalObjId = formalObjIdByName[objName]
		}

		if existing, ok := fieldToExistingAttr[attr.FormViewFieldId]; ok {
			// 字段已有属性，更新
			existing.BusinessObjectId = formalObjId
			existing.AttrName = attr.AttrName
			toUpdate = append(toUpdate, existing)
			updated++
		} else {
			// 字段无属性，新增
			toInsert = append(toInsert, &business_object_attributes.BusinessObjectAttributes{
				Id:               attr.Id,
				FormViewId:       attr.FormViewId,
				BusinessObjectId: formalObjId,
				FormViewFieldId:  attr.FormViewFieldId,
				AttrName:         attr.AttrName,
			})
			inserted++
		}
	}

	// 4. 批量执行更新和新增
	if len(toUpdate) > 0 {
		if err := formalAttrModel.BatchUpdate(ctx, toUpdate); err != nil {
			return 0, 0, err
		}
	}
	if len(toInsert) > 0 {
		if cnt, err := formalAttrModel.BatchInsert(ctx, toInsert); err != nil {
			return 0, 0, err
		} else {
			inserted = cnt
		}
	}

	return inserted, updated, nil
}

// updateFormViewInfo 更新库表业务名称和描述
func (l *SubmitUnderstandingLogic) updateFormViewInfo(
	ctx context.Context,
	formViewId string,
	tempModel *form_view_info_temp.FormViewInfoTempModelSqlx,
	formViewModel *form_view.FormViewModelSqlx,
) error {
	// 查询临时表库表信息（最新版本）
	tempInfo, err := tempModel.FindLatestByFormViewId(ctx, formViewId)
	if err != nil {
		// 如果没有找到临时数据，跳过（可能用户没有修改库表信息）
		return nil
	}

	// 更新正式表的库表信息
	return formViewModel.UpdateBusinessInfo(ctx, formViewId, tempInfo.TableBusinessName, tempInfo.TableDescription)
}

// updateFormViewFieldInfo 更新字段业务名称、角色和描述（批量更新优化）
func (l *SubmitUnderstandingLogic) updateFormViewFieldInfo(
	ctx context.Context,
	formViewId string,
	tempModel *form_view_field_info_temp.FormViewFieldInfoTempModelSqlx,
	formViewFieldModel *form_view_field.FormViewFieldModelSqlx,
) (updated int, err error) {
	// 查询临时表字段信息（最新版本）
	tempFields, err := tempModel.FindLatestByFormViewId(ctx, formViewId)
	if err != nil {
		// 如果没有找到临时数据，跳过
		return 0, nil
	}

	if len(tempFields) == 0 {
		return 0, nil
	}

	// 构建批量更新参数
	updates := make([]form_view_field.FieldBusinessInfoUpdate, 0, len(tempFields))
	for _, field := range tempFields {
		updates = append(updates, form_view_field.FieldBusinessInfoUpdate{
			Id:               field.FormViewFieldId,
			BusinessName:     field.FieldBusinessName,
			FieldRole:        field.FieldRole,
			FieldDescription: field.FieldDescription,
		})
	}

	// 使用批量更新，一次 SQL 语句完成所有字段更新
	err = formViewFieldModel.BatchUpdateBusinessInfo(ctx, updates)
	if err != nil {
		return 0, err
	}

	return len(updates), nil
}
