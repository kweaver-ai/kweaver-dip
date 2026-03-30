// Code scaffolded by goctl. Safe to edit.
// goctl 1.9.2

package data_semantic

import (
	"context"
	"strings"

	"github.com/kweaver-ai/dsg/services/apps/data-semantic/api/internal/errorx"
	"github.com/kweaver-ai/dsg/services/apps/data-semantic/api/internal/svc"
	"github.com/kweaver-ai/dsg/services/apps/data-semantic/api/internal/types"
	"github.com/kweaver-ai/dsg/services/apps/data-semantic/model/data_understanding/form_view_field_info_temp"
	"github.com/kweaver-ai/dsg/services/apps/data-semantic/model/data_understanding/form_view_info_temp"
	"github.com/kweaver-ai/dsg/services/apps/data-semantic/model/form_view"
	"github.com/kweaver-ai/dsg/services/apps/data-semantic/model/form_view_field"

	"github.com/zeromicro/go-zero/core/logx"
)

type GetFieldsLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

// 查询字段语义补全数据
func NewGetFieldsLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GetFieldsLogic {
	return &GetFieldsLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *GetFieldsLogic) GetFields(req *types.GetFieldsReq) (resp *types.GetFieldsResp, err error) {
	logx.Infof("GetFields called with id: %s, keyword: %v, only_incomplete: %v",
		req.Id, req.Keyword, req.OnlyIncomplete)

	// 1. 查询 form_view 表获取 understand_status 和 table_tech_name
	formViewModel := form_view.NewFormViewModel(l.svcCtx.DB)
	tableInfo, err := formViewModel.GetTableInfo(l.ctx, req.Id)
	if err != nil {
		return nil, errorx.Detail(errorx.QueryFailed, err, "库表视图信息")
	}

	// 2. 根据状态返回不同数据源
	understandStatus := tableInfo.UnderstandStatus
	tableTechName := tableInfo.TechnicalName

	// 状态 1 (理解中) - 返回错误，不允许查询
	if understandStatus == form_view.StatusUnderstanding {
		return nil, errorx.Desc(errorx.InvalidUnderstandStatus)
	}

	// 状态 2 (待确认) - 查询临时表
	if understandStatus == form_view.StatusPendingConfirm {
		return l.getFieldsFromTemp(req, tableTechName)
	}

	// 其他状态 (0-未理解, 3-已完成, 4-已发布, 5-理解失败) - 查询正式表
	return l.getFieldsFromFormal(req, tableTechName)
}

// getFieldsFromTemp 从临时表查询数据（不融合）
func (l *GetFieldsLogic) getFieldsFromTemp(req *types.GetFieldsReq, tableTechName string) (*types.GetFieldsResp, error) {
	// 查询临时表信息
	formViewInfoTempModel := form_view_info_temp.NewFormViewInfoTempModelSqlx(l.svcCtx.DB)
	tableInfoTemp, err := formViewInfoTempModel.FindLatestByFormViewId(l.ctx, req.Id)
	if err != nil {
		return nil, errorx.Detail(errorx.QueryFailed, err, "库表信息临时表")
	}

	// 查询字段信息临时表（语义信息）
	formViewFieldInfoTempModel := form_view_field_info_temp.NewFormViewFieldInfoTempModelSqlx(l.svcCtx.DB)
	fieldsTemp, err := formViewFieldInfoTempModel.FindLatestByFormViewId(l.ctx, req.Id)
	if err != nil {
		return nil, errorx.Detail(errorx.QueryFailed, err, "字段信息临时表")
	}

	// 查询 form_view_field 获取基础字段信息（技术名称、数据类型）
	formViewFieldModel := form_view_field.NewFormViewFieldModel(l.svcCtx.DB)
	baseFields, err := formViewFieldModel.FindByFormViewId(l.ctx, req.Id)
	if err != nil {
		return nil, errorx.Detail(errorx.QueryFailed, err, "基础字段信息")
	}

	// 构建 baseFields 映射
	baseFieldMap := make(map[string]*form_view_field.FormViewFieldBase)
	for _, f := range baseFields {
		baseFieldMap[f.Id] = f
	}

	// 构建字段信息：临时表语义信息 + form_view_field 基础字段信息
	fields := make([]types.FieldSemanticInfo, 0, len(fieldsTemp))
	for _, f := range fieldsTemp {
		baseField := baseFieldMap[f.FormViewFieldId]
		if baseField == nil {
			continue
		}
		fields = append(fields, types.FieldSemanticInfo{
			Id:                &f.Id,
			FormViewFieldId:   f.FormViewFieldId,
			FieldBusinessName: f.FieldBusinessName,
			FieldTechName:     baseField.FieldTechName,
			FieldType:         baseField.FieldType,
			FieldRole:         f.FieldRole,
			FieldDescription:  f.FieldDescription,
		})
	}

	// 应用过滤条件
	fields = l.applyFilters(fields, req.Keyword, req.OnlyIncomplete)

	return &types.GetFieldsResp{
		TableInfoId:       &tableInfoTemp.Id,
		TableBusinessName: tableInfoTemp.TableBusinessName,
		TableTechName:     tableTechName,
		TableDescription:  tableInfoTemp.TableDescription,
		Fields:            fields,
	}, nil
}

// getFieldsFromFormal 从正式表查询数据
func (l *GetFieldsLogic) getFieldsFromFormal(req *types.GetFieldsReq, tableTechName string) (*types.GetFieldsResp, error) {
	// 查询 form_view 获取完整的表信息（包含业务名称和描述）
	formViewModel := form_view.NewFormViewModel(l.svcCtx.DB)
	formViewData, err := formViewModel.FindOneById(l.ctx, req.Id)
	if err != nil {
		return nil, errorx.Detail(errorx.QueryFailed, err, "库表视图信息")
	}

	// 查询正式表的字段完整信息 (从 form_view_field 获取包含语义信息的完整数据)
	formViewFieldModel := form_view_field.NewFormViewFieldModel(l.svcCtx.DB)
	fullFields, err := formViewFieldModel.FindFullByFormViewId(l.ctx, req.Id)
	if err != nil {
		return nil, errorx.Detail(errorx.QueryFailed, err, "字段完整信息")
	}

	// 构建字段信息
	fields := make([]types.FieldSemanticInfo, 0, len(fullFields))
	for _, f := range fullFields {
		fields = append(fields, types.FieldSemanticInfo{
			Id:                &f.Id,
			FormViewFieldId:   f.Id,
			FieldBusinessName: f.FieldBusinessName,
			FieldTechName:     f.FieldTechName,
			FieldType:         f.FieldType,
			FieldRole:         f.FieldRole,
			FieldDescription:  f.FieldDescription,
		})
	}

	// 应用过滤条件
	fields = l.applyFilters(fields, req.Keyword, req.OnlyIncomplete)

	return &types.GetFieldsResp{
		TableInfoId:       &formViewData.Id,
		TableBusinessName: formViewData.BusinessName,
		TableTechName:     tableTechName,
		TableDescription:  formViewData.Description,
		Fields:            fields,
	}, nil
}

// applyFilters 应用过滤条件
func (l *GetFieldsLogic) applyFilters(fields []types.FieldSemanticInfo, keyword *string, onlyIncomplete *bool) []types.FieldSemanticInfo {
	result := fields

	// 关键字过滤
	if keyword != nil && *keyword != "" {
		filtered := make([]types.FieldSemanticInfo, 0)
		for _, f := range result {
			if strings.Contains(strings.ToLower(f.FieldTechName), strings.ToLower(*keyword)) ||
				(f.FieldBusinessName != nil && strings.Contains(strings.ToLower(*f.FieldBusinessName), strings.ToLower(*keyword))) {
				filtered = append(filtered, f)
			}
		}
		result = filtered
	}

	// only_incomplete 过滤 (只返回未补全的字段)
	if onlyIncomplete != nil && *onlyIncomplete {
		filtered := make([]types.FieldSemanticInfo, 0)
		for _, f := range result {
			// 判断是否未补全：field_business_name 为空 或 field_role 为空
			if f.FieldBusinessName == nil || f.FieldRole == nil {
				filtered = append(filtered, f)
			}
		}
		result = filtered
	}

	return result
}
