// Code scaffolded by goctl. Safe to edit.
// goctl 1.9.2

package data_semantic

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"github.com/kweaver-ai/dsg/services/apps/data-semantic/api/internal/middleware"
	"github.com/kweaver-ai/dsg/services/apps/data-semantic/api/internal/svc"
	"github.com/kweaver-ai/dsg/services/apps/data-semantic/api/internal/types"
	"github.com/kweaver-ai/dsg/services/apps/data-semantic/internal/pkg/aiservice"
	"github.com/kweaver-ai/dsg/services/apps/data-semantic/model/data_understanding/form_view_field_info_temp"
	"github.com/kweaver-ai/dsg/services/apps/data-semantic/model/form_view"
	"github.com/kweaver-ai/dsg/services/apps/data-semantic/model/form_view_field"

	"github.com/zeromicro/go-zero/core/logx"
)

type RegenerateBusinessObjectsLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

// 重新识别业务对象
func NewRegenerateBusinessObjectsLogic(ctx context.Context, svcCtx *svc.ServiceContext) *RegenerateBusinessObjectsLogic {
	return &RegenerateBusinessObjectsLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *RegenerateBusinessObjectsLogic) RegenerateBusinessObjects(req *types.RegenerateBusinessObjectsReq) (resp *types.RegenerateBusinessObjectsResp, err error) {
	logx.Infof("RegenerateBusinessObjects called with id: %s", req.Id)

	// 1. 查询 form_view 状态
	formViewModel := form_view.NewFormViewModel(l.svcCtx.DB)
	formViewData, err := formViewModel.FindOneById(l.ctx, req.Id)
	if err != nil {
		return nil, fmt.Errorf("查询库表视图失败: %w", err)
	}

	// 2. 状态校验 (仅允许状态 2、3 或 5)
	currentStatus := formViewData.UnderstandStatus
	if currentStatus != form_view.StatusPendingConfirm && currentStatus != form_view.StatusCompleted && currentStatus != form_view.StatusFailed {
		return nil, fmt.Errorf("当前状态不允许重新识别，当前状态: %d，仅状态 2 (待确认)、3 (已完成) 或 5 (理解失败) 可重新识别", currentStatus)
	}

	// 3. 限流检查（1秒窗口，防止重复点击）
	if !l.svcCtx.AllowRequest(req.Id) {
		return nil, fmt.Errorf("操作过于频繁，请稍后再试")
	}

	// 4. 查询字段数据（从临时表获取已理解的字段）
	formViewFieldInfoTempModel := form_view_field_info_temp.NewFormViewFieldInfoTempModelSqlx(l.svcCtx.DB)
	fieldsTemp, err := formViewFieldInfoTempModel.FindLatestByFormViewId(l.ctx, req.Id)
	if err != nil {
		return nil, fmt.Errorf("查询字段信息临时表失败: %w", err)
	}

	// 如果临时表没有数据，返回错误
	if len(fieldsTemp) == 0 {
		return nil, fmt.Errorf("暂无已理解字段数据，请先生成理解数据")
	}

	// 查询基础字段信息 (field_tech_name, field_type)
	formViewFieldModel := form_view_field.NewFormViewFieldModel(l.svcCtx.DB)
	baseFields, err := formViewFieldModel.FindByFormViewId(l.ctx, req.Id)
	if err != nil {
		return nil, fmt.Errorf("查询基础字段信息失败: %w", err)
	}

	// 构建字段ID到基础信息的映射
	baseFieldMap := make(map[string]*form_view_field.FormViewFieldBase)
	for _, f := range baseFields {
		baseFieldMap[f.Id] = f
	}

	// 合并临时表数据和基础字段信息，转换为 FormViewField 格式
	fields := l.buildFormViewFields(fieldsTemp, baseFieldMap)
	logx.WithContext(l.ctx).Infof("重新识别业务对象，基于字段数量: %d", len(fields))

	// 5. 更新状态为 1（理解中）
	err = formViewModel.UpdateUnderstandStatus(l.ctx, req.Id, form_view.StatusUnderstanding)
	if err != nil {
		return nil, fmt.Errorf("更新理解状态失败: %w", err)
	}

	// 7. 调用 AI 服务 HTTP API（同步调用）
	if err := l.callAIService(req.Id, formViewData, fields); err != nil {
		// 调用失败，回退到原始状态
		_ = formViewModel.UpdateUnderstandStatus(l.ctx, req.Id, currentStatus)
		return nil, fmt.Errorf("调用 AI 服务失败: %w", err)
	}

	resp = &types.RegenerateBusinessObjectsResp{
		UnderstandStatus: form_view.StatusUnderstanding,
	}

	return resp, nil
}

// callAIService 调用 AI 服务 HTTP API
func (l *RegenerateBusinessObjectsLogic) callAIService(formViewId string, formViewData *form_view.FormView, fields []*form_view_field.FormViewField) error {
	// 使用 builder 构建 FormView
	aiFormView := aiservice.BuildFormView(formViewId, formViewData, fields)

	// 生成 message_id
	messageID := uuid.New().String()

	logx.WithContext(l.ctx).Infof("调用 AI 服务: request_type=%s, field_count=%d", aiservice.RequestTypeRegenerateBusinessObjects, len(fields))

	// 调用 AI 服务
	// 从 context 获取 token
	token := ""
	if t := l.ctx.Value(middleware.Token); t != nil {
		token = t.(string)
	}
	if token == "" {
		return fmt.Errorf("调用 AI 服务失败: token 为空")
	}
	aiResponse, err := l.svcCtx.AIClient.Call(aiservice.RequestTypeRegenerateBusinessObjects, messageID, aiFormView, token)
	if err != nil {
		return fmt.Errorf("调用 AI 服务失败: %w", err)
	}

	logx.WithContext(l.ctx).Infof("AI 服务调用成功: task_id=%s, status=%s, message=%s",
		aiResponse.TaskID, aiResponse.Status, aiResponse.Message)

	return nil
}

// buildFormViewFields 合并临时表数据和基础字段信息，转换为 FormViewField 格式
func (l *RegenerateBusinessObjectsLogic) buildFormViewFields(fieldsTemp []*form_view_field_info_temp.FormViewFieldInfoTemp, baseFieldMap map[string]*form_view_field.FormViewFieldBase) []*form_view_field.FormViewField {
	fields := make([]*form_view_field.FormViewField, 0, len(fieldsTemp))
	for _, ft := range fieldsTemp {
		baseInfo, exists := baseFieldMap[ft.FormViewFieldId]
		if !exists {
			logx.WithContext(l.ctx).Infof("字段 %s 在基础表 中不存在，跳过", ft.FormViewFieldId)
			continue
		}
		fields = append(fields, &form_view_field.FormViewField{
			Id:               ft.FormViewFieldId,
			FieldTechName:    baseInfo.FieldTechName,
			FieldType:        baseInfo.FieldType,
			FieldBusinessName: ft.FieldBusinessName,
			FieldRole:        ft.FieldRole,
			FieldDescription: ft.FieldDescription,
		})
	}
	return fields
}
