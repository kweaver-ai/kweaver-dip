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
	"github.com/kweaver-ai/dsg/services/apps/data-semantic/model/form_view"
	"github.com/kweaver-ai/dsg/services/apps/data-semantic/model/form_view_field"

	"github.com/zeromicro/go-zero/core/logx"
)

type GenerateUnderstandingLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

// 一键生成理解数据
func NewGenerateUnderstandingLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GenerateUnderstandingLogic {
	return &GenerateUnderstandingLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *GenerateUnderstandingLogic) GenerateUnderstanding(req *types.GenerateUnderstandingReq) (resp *types.GenerateUnderstandingResp, err error) {
	logx.Infof("GenerateUnderstanding called with id: %s, fields count: %d", req.Id, len(req.Fields))

	// 1. 状态校验：只有状态 0（未理解）或 3（已完成）才允许生成
	formViewModel := form_view.NewFormViewModel(l.svcCtx.DB)
	formViewData, err := formViewModel.FindOneById(l.ctx, req.Id)
	if err != nil {
		return nil, fmt.Errorf("查询库表视图失败: %w", err)
	}

	currentStatus := formViewData.UnderstandStatus
	if currentStatus != form_view.StatusNotUnderstanding && currentStatus != form_view.StatusCompleted && currentStatus != form_view.StatusFailed {
		return nil, fmt.Errorf("当前状态不允许生成理解数据，当前状态: %d", currentStatus)
	}

	// 2. 限流检查（1秒窗口，防止重复点击）
	if !l.svcCtx.AllowRequest(req.Id) {
		return nil, fmt.Errorf("操作过于频繁，请稍后再试")
	}

	// 3. 更新状态为 1（理解中）
	err = formViewModel.UpdateUnderstandStatus(l.ctx, req.Id, form_view.StatusUnderstanding)
	if err != nil {
		return nil, fmt.Errorf("更新理解状态失败: %w", err)
	}

	// 4. 获取字段数据（全部字段或部分字段）
	var fields []*form_view_field.FormViewField
	if len(req.Fields) > 0 {
		// 方式一：使用传入的字段信息（部分字段理解）
		fields = l.convertFieldsSelection(req.Fields)
		logx.Infof("使用传入的字段信息进行部分理解，字段数量: %d", len(fields))
	} else {
		// 方式二：查询数据库获取所有字段（全部字段理解）
		formViewFieldModel := form_view_field.NewFormViewFieldModel(l.svcCtx.DB)
		fields, err = formViewFieldModel.FindFullByFormViewId(l.ctx, req.Id)
		if err != nil {
			// 查询失败，回退状态
			_ = formViewModel.UpdateUnderstandStatus(l.ctx, req.Id, currentStatus)
			return nil, fmt.Errorf("查询字段数据失败: %w", err)
		}
		logx.Infof("查询数据库获取全部字段，字段数量: %d", len(fields))
	}

	// 5. 调用 AI 服务 HTTP API（同步调用）
	if err := l.callAIService(req.Id, formViewData, fields, len(req.Fields) > 0); err != nil {
		// 调用失败，回退状态
		_ = formViewModel.UpdateUnderstandStatus(l.ctx, req.Id, currentStatus)
		return nil, fmt.Errorf("调用 AI 服务失败: %w", err)
	}

	// 6. 返回新状态
	resp = &types.GenerateUnderstandingResp{
		UnderstandStatus: form_view.StatusUnderstanding,
	}

	return resp, nil
}

// convertFieldsSelection 将 FieldSelection 转换为 FormViewField
func (l *GenerateUnderstandingLogic) convertFieldsSelection(fieldSelections []types.FieldSelection) []*form_view_field.FormViewField {
	fields := make([]*form_view_field.FormViewField, 0, len(fieldSelections))
	for _, fs := range fieldSelections {
		fields = append(fields, &form_view_field.FormViewField{
			Id:                fs.FormViewFieldId,
			FieldTechName:     fs.FieldTechName,
			FieldType:         fs.FieldType,
			FieldBusinessName: fs.FieldBusinessName,
			FieldRole:         fs.FieldRole,
			FieldDescription:  fs.FieldDescription,
		})
	}
	return fields
}

// callAIService 调用 AI 服务 HTTP API
func (l *GenerateUnderstandingLogic) callAIService(formViewId string, formViewData *form_view.FormView, fields []*form_view_field.FormViewField, isPartial bool) error {
	// 使用 builder 构建 FormView
	aiFormView := aiservice.BuildFormView(formViewId, formViewData, fields)

	// 确定 request_type：部分字段使用 partial_understanding，全部字段使用 full_understanding
	requestType := aiservice.RequestTypeFullUnderstanding
	if isPartial {
		requestType = aiservice.RequestTypePartialUnderstanding
	}

	// 生成 message_id
	messageID := uuid.New().String()

	logx.WithContext(l.ctx).Infof("调用 AI 服务: request_type=%s, field_count=%d", requestType, len(fields))

	// 调用 AI 服务
	// 从 context 获取 token
	token := ""
	if t := l.ctx.Value(middleware.Token); t != nil {
		token = t.(string)
	}
	if token == "" {
		return fmt.Errorf("调用 AI 服务失败: token 为空")
	}
	aiResponse, err := l.svcCtx.AIClient.Call(requestType, messageID, aiFormView, token)
	if err != nil {
		return fmt.Errorf("调用 AI 服务失败: %w", err)
	}

	logx.WithContext(l.ctx).Infof("AI 服务调用成功: task_id=%s, status=%s, message=%s",
		aiResponse.TaskID, aiResponse.Status, aiResponse.Message)

	return nil
}
