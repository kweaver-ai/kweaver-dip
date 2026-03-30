package grade_rule

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/data-view/common/models/request"
)

// GradeRuleUseCase 是分级规则用例接口
// 定义了分级规则相关的业务逻辑操作
type GradeRuleUseCase interface {
	PageList(ctx context.Context, req *PageListGradeRuleReq) (*PageListGradeRuleResp, error)
	Create(ctx context.Context, req *CreateGradeRuleReq) (*CreateGradeRuleResp, error)
	Update(ctx context.Context, req *UpdateGradeRuleReq) (*UpdateGradeRuleResp, error)
	GetDetailById(ctx context.Context, req *GetDetailByIdReq) (*GradeRuleDetailResp, error)
	Delete(ctx context.Context, req *DeleteGradeRuleReq) (*DeleteGradeRuleResp, error)
	Export(ctx context.Context, req *ExportGradeRuleReq) (*ExportGradeRuleResp, error)
	Start(ctx context.Context, req *StartGradeRuleReq) (*StartGradeRuleResp, error)
	Stop(ctx context.Context, req *StopGradeRuleReq) (*StopGradeRuleResp, error)
	Statistics(ctx context.Context, req *StatisticsGradeRuleReq) (*StatisticsGradeRuleResp, error)
	BindGroup(ctx context.Context, req *BindGradeRuleGroupReq) (*BindGradeRuleGroupResp, error)
	BatchDelete(ctx context.Context, req *BatchDeleteReq) (*BatchDeleteResp, error)
}

type GradeRule struct {
	ID                         string   `json:"id"`                           // 分级规则ID
	Name                       string   `json:"name"`                         // 名称
	Description                string   `json:"description"`                  // 描述
	Type                       string   `json:"type"`                         // 类型
	ClassificationSubjectNames []string `json:"classification_subject_names"` // 识别算法分类属性名称数组
	SubjectID                  string   `json:"subject_id"`                   // 分级属性ID
	SubjectName                string   `json:"subject_name"`                 // 分级属性名称
	LabelID                    string   `json:"label_id"`                     // 分级标签ID
	LabelName                  string   `json:"label_name"`                   // 分级标签名称
	LabelIcon                  string   `json:"label_icon"`                   // 分级标签图标
	LogicalExpression          string   `json:"logical_expression"`           // 逻辑表达式
	Status                     int32    `json:"status"`                       // 启用状态
	CreatedAt                  int64    `json:"created_at"`                   // 创建时间
	UpdatedAt                  int64    `json:"updated_at"`                   // 更新时间
	GroupID                    string   `json:"group_id"`                     //所属规则组ID
	GroupName                  string   `json:"group_name"`                   // 所属规则组名称
}

type LabInfo struct {
	LabelID   string `json:"label_id"`
	LabelName string `json:"label_name"`
	LabelIcon string `json:"label_icon"`
}

// IDReqParamPath 用于获取请求路径中的id参数
type IDReqParamPath struct {
	ID string `json:"-" uri:"id" binding:"required,uuid" example:"88f78432-ee4e-43df-804c-4ccc4ff17f15"`
}

// #region PageList
// PageListGradeRuleReq 分页查询分级规则的请求参数
type PageListGradeRuleReq struct {
	PageListGradeRuleReqQueryParam `param_type:"query"`
}

type PageListGradeRuleReqQueryParam struct {
	SubjectID string  `json:"subject_id" form:"subject_id" binding:"omitempty"` // 分级属性ID
	LabelID   string  `json:"label_id" form:"label_id" binding:"omitempty"`     // 分级标签ID
	GroupID   *string `json:"group_id" form:"group_id" binding:"omitempty"`     // 规则组ID
	request.PageSortKeyword3
}

type PageResultNew[T any] struct {
	Entries    []*T  `json:"entries" binding:"required"`                       // 对象列表
	TotalCount int64 `json:"total_count" binding:"required,gte=0" example:"3"` // 当前筛选条件下的对象数量
}

type PageListGradeRuleResp struct {
	PageResultNew[GradeRule]
}

//#endregion

// #region Create
// CreateGradeRuleReq 创建分级规则的请求参数
type CreateGradeRuleReq struct {
	CreateGradeRuleReqBody `param_type:"body"`
}

type CreateGradeRuleReqBody struct {
	Name            string          `json:"name" form:"name" binding:"required" example:"Rule A"`                   // 名称
	Description     string          `json:"description" form:"description" binding:"omitempty" example:"分级规则描述"`    // 描述
	Classifications Classifications `json:"classifications" form:"classifications" binding:"required"`              // 分类属性逻辑组合
	SubjectId       string          `json:"subject_id" form:"subject_id" binding:"required"`                        // 分级属性ID
	LabelId         string          `json:"label_id" form:"label_id" binding:"required"`                            // 分级标签ID
	Status          int32           `json:"status" form:"status" binding:"oneof=0 1" default:"1" example:"1"`       // 0停用1启用
	Type            string          `json:"type" form:"type" binding:"omitempty" default:"custom" example:"custom"` // 类型
	GroupID         string          `json:"group_id" form:"group_id" binding:"omitempty"`                           // 所属规则组ID
}

type Classifications struct {
	Operate    string         `json:"operate"`
	GradeRules []ClassifyItem `json:"grade_rules"`
}

type ClassifyItem struct {
	Operate                      string   `json:"operate"`
	ClassificationRuleSubjectIds []string `json:"classification_rule_subject_ids"`
}

type CreateGradeRuleResp struct {
	ID string `json:"id"` // 分级规则ID
}

//#endregion

// #region Update
// UpdateGradeRuleReq 更新分级规则的请求参数
type UpdateGradeRuleReq struct {
	IDReqParamPath         `param_type:"path"`
	UpdateGradeRuleReqBody `param_type:"body"`
}

type UpdateGradeRuleReqBody struct {
	Name            string          `json:"name" form:"name" binding:"omitempty"`                       // 分级规则名称
	Description     string          `json:"description" form:"description" binding:"omitempty"`         // 描述
	Classifications Classifications `json:"classifications" form:"classifications" binding:"omitempty"` // 分类属性逻辑组合
	SubjectId       string          `json:"subject_id" form:"subject_id" binding:"omitempty"`           // 分级属性ID
	LabelId         string          `json:"label_id" form:"label_id" binding:"omitempty"`               // 分级标签ID
	GroupID         string          `json:"group_id" form:"group_id" binding:"omitempty"`               // 所属规则组ID
}

type UpdateGradeRuleResp struct {
	ID string `json:"id"` // 分级规则ID
}

//#endregion

// #region GetDetailById
// GetDetailByIdReq 根据ID获取分级规则详情的请求参数
type GetDetailByIdReq struct {
	IDReqParamPath `param_type:"path"`
}

// GradeRuleDetailResp 分级规则详情响应结构
type GradeRuleDetailResp struct {
	ID              string                `json:"id" binding:"uuid" example:"13b8a80b-1914-4896-99d8-51559dba26c4"` // 分级规则ID
	Name            string                `json:"name" example:"Rule A"`                                            // 分级规则名称
	Description     string                `json:"description" example:"分级规则描述"`                                     // 描述
	Classifications ClassificationDetails `json:"classifications"`                                                  // 分类属性逻辑组合
	SubjectID       string                `json:"subject_id" example:"subject-uuid"`                                // 分级属性ID
	SubjectName     string                `json:"subject_name" example:"分级属性名称"`                                    // 分级属性名称
	LabelID         string                `json:"label_id" example:"label-uuid"`                                    // 分级标签ID
	LabelName       string                `json:"label_name" example:"分级标签名称"`                                      // 分级标签名称
	LabelIcon       string                `json:"label_icon" example:"分级标签图标"`                                      // 分级标签图标
	Type            string                `json:"type" example:"算法类型inner或custom"`                                  // 分级规则类型
	Status          int                   `json:"status" binding:"oneof=0 1" example:"1"`                           // 0停用1启用
	CreatedAt       int64                 `json:"created_at"`                                                       // 创建时间
	UpdatedAt       int64                 `json:"updated_at"`                                                       // 更新时间
	CreatedByName   string                `json:"created_by_name" example:"admin"`                                  // 创建者
	UpdatedByName   string                `json:"updated_by_name" example:"admin"`                                  // 更新者
	GroupID         string                `json:"group_id"`                                                         // 所属规则组ID
	GroupName       string                `json:"group_name"`                                                       // 所属规则组名称
}

type ClassificationDetails struct {
	Operate          string            `json:"operate" form:"operate" binding:"required"` // 操作符
	GradeRuleDetails []GradeRuleDetail `json:"grade_rules" form:"grade_rules"`            // 分级规则数组
}

type GradeRuleDetail struct {
	Operate                    string                      `json:"operate" form:"operate" binding:"required"`                        // 操作符
	ClassificationRuleSubjects []ClassificationRuleSubject `json:"classification_rule_subjects" form:"classification_rule_subjects"` // 分类属性ID数组
}

type ClassificationRuleSubject struct {
	ID   string `json:"id" example:"subject-uuid"` // 分类属性ID
	Name string `json:"name" example:"分类属性名称"`     // 分类属性名称
}

//#endregion

// #region Delete
// DeleteGradeRuleReq 删除分级规则的请求参数
type DeleteGradeRuleReq struct {
	IDReqParamPath `param_type:"path"`
}

type DeleteGradeRuleResp struct {
	ID string `json:"id"` // 删除的分级规则ID
}

//#endregion

// #region Export
// ExportGradeRuleReq 导出分级规则的请求参数
type ExportGradeRuleReq struct {
	ExportGradeRuleReqBody `param_type:"body"`
}

type ExportGradeRuleReqBody struct {
	Ids              []string `json:"ids" form:"ids"`                                                                 // 分级规则ID列表
	GroupIds         []string `json:"group_ids" form:"group_ids"`                                                     // 规则组ID列表
	BusinessObjectID string   `json:"business_object_id" form:"business_object_id" binding:"required,uuid,TrimSpace"` // 业务对象ID
}

type ExportGradeRuleResp struct {
	Data []ExportGradeRule `json:"data" binding:"required"` // 分级规则数据
}

type ExportGradeRule struct {
	RuleName            string `json:"rule_name"`            // 分级规则名称
	LogicalExpression   string `json:"logical_expression"`   // 逻辑表达式
	ClassificationGrade string `json:"classification_grade"` // 分类分级
	Status              int    `json:"status"`               // 启用状态
}

//#endregion

// #region Start
// StartGradeRuleReq 启动分级规则的请求参数
type StartGradeRuleReq struct {
	IDReqParamPath `param_type:"path"`
}

type StartGradeRuleResp struct {
	ID string `json:"id"` // 启动的分级规则ID
}

//#endregion

// #region Stop
// StopGradeRuleReq 停止分级规则的请求参数
type StopGradeRuleReq struct {
	IDReqParamPath `param_type:"path"`
}

type StopGradeRuleResp struct {
	ID string `json:"id"` // 停止的分级规则ID
}

//#endregion

//#region Statistics

type StatisticsGradeRuleReq struct{}

type StatisticsGradeRuleResp struct {
	Statistics []SubjectRuleStatistics `json:"statistics"`
}

type SubjectRuleStatistics struct {
	SubjectID   string `json:"subject_id"`        // 分级规则对应的主题ID
	SubjectName string `json:"subject_name"`      // 分级规则对应的主题名称
	Count       int64  `json:"count" example:"3"` // 当前筛选条件下的对象数量
}

type BindGradeRuleGroupReq struct {
	BindGradeRuleGroupBody `param_type:"body"`
}

type BindGradeRuleGroupBody struct {
	RuleIds []string `json:"rule_ids" binding:"required,min=1"`
	GroupID string   `json:"group_id"`
}

type BindGradeRuleGroupResp struct {
	RuleIds []string `json:"rule_ids"`
	GroupID string   `json:"group_id"`
}

type BatchDeleteReq struct {
	BatchDeleteBody `param_type:"body"`
}

type BatchDeleteBody struct {
	Ids []string `json:"ids" binding:"required,min=1"`
}

type BatchDeleteResp struct {
	Ids []string `json:"ids"`
}

//#endregion
