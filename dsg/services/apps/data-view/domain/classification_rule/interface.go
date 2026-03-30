package classification_rule

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/data-view/common/models/request"
)

// ClassificationRuleUseCase 是分类规则用例接口
// 定义了分类规则相关的业务逻辑操作
type ClassificationRuleUseCase interface {
	PageList(ctx context.Context, req *PageListClassificationRuleReq) (*PageListClassificationRuleResp, error)
	Create(ctx context.Context, req *CreateClassificationRuleReq) (*CreateClassificationRuleResp, error)
	Update(ctx context.Context, req *UpdateClassificationRuleReq) (*UpdateClassificationRuleResp, error)
	GetDetailById(ctx context.Context, req *GetDetailByIdReq) (*ClassificationRuleDetailResp, error)
	Delete(ctx context.Context, req *DeleteClassificationRuleReq) (*DeleteClassificationRuleResp, error)
	Export(ctx context.Context, req *ExportClassificationRuleReq) (*ExportClassificationRuleResp, error)
	Start(ctx context.Context, req *StartClassificationRuleReq) (*StartClassificationRuleResp, error)
	Stop(ctx context.Context, req *StopClassificationRuleReq) (*StopClassificationRuleResp, error)
	Statistics(ctx context.Context, req *StatisticsClassificationRuleReq) (*StatisticsClassificationRuleResp, error)
}

type ClassificationRule struct {
	ID          string      `json:"id"`           // 分类规则ID
	Name        string      `json:"name"`         // 名称
	Description string      `json:"description"`  // 描述
	Type        string      `json:"type"`         // 类型
	SubjectID   string      `json:"subject_id"`   // 分类属性ID
	SubjectName string      `json:"subject_name"` // 分类属性名称
	Status      int32       `json:"status"`       // 启用状态
	CreatedAt   int64       `json:"created_at"`   // 创建时间
	UpdatedAt   int64       `json:"updated_at"`   // 更新时间
	Algorithms  []Algorithm `json:"algorithms"`   // 算法数组，包含算法id和算法名称
}

type Algorithm struct {
	ID   string `json:"id"`   // 算法id
	Name string `json:"name"` // 算法名称
}

// IDReqParamPath 用于获取请求路径中的id参数
type IDReqParamPath struct {
	ID string `json:"-" uri:"id" binding:"required,uuid" example:"88f78432-ee4e-43df-804c-4ccc4ff17f15"`
}

// #region PageList
// PageListClassificationRuleReq 分页查询分类规则的请求参数
type PageListClassificationRuleReq struct {
	PageListClassificationRuleReqQueryParam `param_type:"query"`
}

type PageListClassificationRuleReqQueryParam struct {
	SubjectID string `json:"subject_id" form:"subject_id" binding:"omitempty"` // 分类属性ID
	request.PageSortKeyword3
}

type PageResultNew[T any] struct {
	Entries    []*T  `json:"entries" binding:"required"`                       // 对象列表
	TotalCount int64 `json:"total_count" binding:"required,gte=0" example:"3"` // 当前筛选条件下的对象数量
}

type PageListClassificationRuleResp struct {
	PageResultNew[ClassificationRule]
}

//#endregion

// #region Create
// CreateClassificationRuleReq 创建分类规则的请求参数
type CreateClassificationRuleReq struct {
	CreateClassificationRuleReqBody `param_type:"body"`
}

type CreateClassificationRuleReqBody struct {
	Name         string   `json:"name" form:"name" binding:"required" example:"Rule A"`                                            // 名称
	Description  string   `json:"description" form:"description" binding:"omitempty" example:"分类规则描述"`                             // 描述
	SubjectID    string   `json:"subject_id" form:"subject_id" binding:"required"`                                                 // 分类属性ID
	Status       int32    `json:"status" form:"status" binding:"oneof=0 1" default:"1" example:"1"`                                // 0停用1启用
	AlgorithmIDs []string `json:"algorithm_ids" form:"algorithm_ids" binding:"required" example:"[\"algorithm1\",\"algorithm2\"]"` // 算法id数组
	Type         string   `json:"type" form:"type" binding:"omitempty" default:"custom" example:"custom"`                          // 类型
}

type CreateClassificationRuleResp struct {
	ID string `json:"id"` // 分类规则ID
}

//#endregion

// #region Update
// UpdateClassificationRuleReq 更新分类规则的请求参数
type UpdateClassificationRuleReq struct {
	IDReqParamPath                  `param_type:"path"`
	UpdateClassificationRuleReqBody `param_type:"body"`
}

type UpdateClassificationRuleReqBody struct {
	Name         string   `json:"name" form:"name" binding:"omitempty"`                                                            // 分类规则名称
	Description  string   `json:"description" form:"description" binding:"omitempty"`                                              // 描述
	SubjectID    string   `json:"subject_id" form:"subject_id" binding:"omitempty"`                                                // 分类属性ID
	AlgorithmIDs []string `json:"algorithm_ids" form:"algorithm_ids" binding:"required" example:"[\"algorithm1\",\"algorithm2\"]"` // 算法id数组
}

type UpdateClassificationRuleResp struct {
	ID string `json:"id"` // 分类规则ID
}

//#endregion

// #region GetDetailById
// GetDetailByIdReq 根据ID获取分类规则详情的请求参数
type GetDetailByIdReq struct {
	IDReqParamPath `param_type:"path"`
}

// ClassificationRuleDetailResp 分类规则详情响应结构
type ClassificationRuleDetailResp struct {
	ID            string      `json:"id" binding:"uuid" example:"13b8a80b-1914-4896-99d8-51559dba26c4"` // 分类规则ID
	Name          string      `json:"name" example:"Rule A"`                                            // 分类规则名称
	Description   string      `json:"description" example:"分类规则描述"`                                     // 描述
	Type          string      `json:"type" example:"custom"`                                            // 类型
	SubjectID     string      `json:"subject_id" example:"subject-uuid"`                                // 分类属性ID
	SubjectName   string      `json:"subject_name" example:"分类属性名称"`                                    // 分类属性名称
	Status        int         `json:"status" binding:"oneof=0 1" example:"1"`                           // 0停用1启用
	CreatedAt     int64       `json:"created_at"`                                                       // 创建时间
	UpdatedAt     int64       `json:"updated_at"`                                                       // 更新时间
	CreatedByName string      `json:"created_by_name" example:"admin"`                                  // 创建者
	UpdatedByName string      `json:"updated_by_name" example:"admin"`                                  // 更新者
	Algorithms    []Algorithm `json:"algorithms"`                                                       // 算法数组，包含算法id和算法名称
}

//#endregion

// #region Delete
// DeleteClassificationRuleReq 删除分类规则的请求参数
type DeleteClassificationRuleReq struct {
	IDReqParamPath `param_type:"path"`
}

type DeleteClassificationRuleResp struct {
	ID string `json:"id"` // 删除的分类规则ID
}

//#endregion

// #region Export
// ExportClassificationRuleReq 导出分类规则的请求参数
type ExportClassificationRuleReq struct {
	ExportClassificationRuleReqBody `param_type:"body"`
}

type ExportClassificationRuleReqBody struct {
	Ids []string `json:"ids" form:"ids" binding:"required"` // 分类规则ID列表
}

type ExportClassificationRuleResp struct {
	Data []ExportClassificationRule `json:"data" binding:"required"` // 分类规则数据
}

type ExportClassificationRule struct {
	RuleName      string `json:"rule_name"`      // 识别规则名称
	Description   string `json:"description"`    // 描述
	AlgorithmName string `json:"algorithm_name"` // 算法名称
	Algorithm     string `json:"algorithm"`      // 算法
	SubjectName   string `json:"subject_name"`   // 分类属性名称
	Status        int    `json:"status"`         // 启用状态
}

//#endregion

// #region Start
// StartClassificationRuleReq 启动分类规则的请求参数
type StartClassificationRuleReq struct {
	IDReqParamPath `param_type:"path"`
}

type StartClassificationRuleResp struct {
	ID string `json:"id"` // 启动的分类规则ID
}

//#endregion

// #region Stop
// StopClassificationRuleReq 停止分类规则的请求参数
type StopClassificationRuleReq struct {
	IDReqParamPath `param_type:"path"`
}

type StopClassificationRuleResp struct {
	ID string `json:"id"` // 停止的分类规则ID
}

//#endregion

//#region Statistics

type StatisticsClassificationRuleReq struct{}

type StatisticsClassificationRuleResp struct {
	Statistics []SubjectRuleStatistics `json:"statistics"`
}

type SubjectRuleStatistics struct {
	SubjectID   string `json:"subject_id"`        // 识别算法对应的主题ID
	SubjectName string `json:"subject_name"`      // 识别算法对应的主题名称
	Count       int64  `json:"count" example:"3"` // 当前筛选条件下的对象数量
}

//#endregion
