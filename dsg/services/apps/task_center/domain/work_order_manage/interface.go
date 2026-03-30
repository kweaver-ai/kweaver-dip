package work_order_manage

import (
	"context"
	"encoding/json"
)

// Domain 工单模板管理领域接口
type Domain interface {
	// 创建工单模板
	Create(ctx context.Context, req *CreateRequest) (*CreateResponse, error)
	// 更新工单模板
	Update(ctx context.Context, id uint64, req *UpdateRequest) (*UpdateResponse, error)
	// 删除工单模板
	Delete(ctx context.Context, id uint64) (*DeleteResponse, error)
	// 获取工单模板详情
	Get(ctx context.Context, id uint64) (*TemplateResponse, error)
	// 获取工单模板列表
	List(ctx context.Context, req *ListRequest) (*ListResponse, error)
	// 获取工单模板历史版本列表
	ListVersions(ctx context.Context, templateID uint64, req *ListVersionsRequest) (*ListVersionsResponse, error)
	// 获取工单模板历史版本详情
	GetVersion(ctx context.Context, templateID uint64, version int) (*VersionResponse, error)
	// 校验模板名称是否存在
	CheckNameExists(ctx context.Context, req *CheckNameExistsRequest) (*CheckNameExistsResponse, error)
}

// CreateRequest 创建工单模板请求
type CreateRequest struct {
	TemplateName string          `json:"template_name" binding:"required"` // 工单模板名称
	TemplateType string          `json:"template_type" binding:"required"` // 工单模板类型
	Description  string          `json:"description"`                      // 模板描述
	Content      json.RawMessage `json:"content" binding:"required"`       // 模板内容（JSON格式）
	CreatedBy    string          `json:"-"`                                // 创建人（从上下文获取）
}

// CreateResponse 创建工单模板响应
type CreateResponse struct {
	ID string `json:"id"` // 模板ID（雪花ID转字符串）
}

// UpdateRequest 更新工单模板请求
type UpdateRequest struct {
	TemplateName *string         `json:"template_name,omitempty"` // 工单模板名称
	Description  *string         `json:"description,omitempty"`   // 模板描述
	Content      json.RawMessage `json:"content,omitempty"`       // 模板内容（修改内容会创建新版本）
	IsActive     *int8           `json:"is_active,omitempty"`     // 是否启用：0-禁用，1-启用
	UpdatedBy    string          `json:"-"`                       // 更新人（从上下文获取）
}

// UpdateResponse 更新工单模板响应
type UpdateResponse struct {
	ID string `json:"id"` // 模板ID
}

// DeleteResponse 删除工单模板响应
type DeleteResponse struct {
	ID string `json:"id"` // 模板ID
}

// ListRequest 获取工单模板列表请求
type ListRequest struct {
	TemplateName string `form:"template_name"`                                      // 工单模板名称（模糊查询）
	TemplateType string `form:"template_type"`                                      // 工单模板类型
	IsActive     *int8  `form:"is_active"`                                          // 是否启用：0-禁用，1-启用
	Keyword      string `form:"keyword"`                                            // 关键词（搜索模板名称或描述）
	Offset       int    `form:"offset,default=1" binding:"omitempty,min=1"`         // 页码，从1开始
	Limit        int    `form:"limit,default=10" binding:"omitempty,min=1,max=100"` // 每页数量
}

// ListResponse 工单模板列表响应
type ListResponse struct {
	Entries    []TemplateResponse `json:"entries"`     // 模板列表
	TotalCount int64              `json:"total_count"` // 总数
}

// TemplateResponse 工单模板响应
type TemplateResponse struct {
	ID             string          `json:"id"`              // 模板ID
	TemplateName   string          `json:"template_name"`   // 工单模板名称
	TemplateType   string          `json:"template_type"`   // 工单模板类型
	Description    string          `json:"description"`     // 模板描述
	Version        int             `json:"version"`         // 版本号
	IsActive       int8            `json:"is_active"`       // 是否启用：0-禁用，1-启用
	ReferenceCount int64           `json:"reference_count"` // 引用次数
	CreatedAt      int64           `json:"created_at"`      // 创建时间（时间戳）
	CreatedBy      string          `json:"created_by"`      // 创建人ID
	CreatedByName  string          `json:"created_by_name"` // 创建人名称
	UpdatedAt      int64           `json:"updated_at"`      // 更新时间（时间戳）
	UpdatedBy      string          `json:"updated_by"`      // 更新人ID
	UpdatedByName  string          `json:"updated_by_name"` // 更新人名称
	Content        json.RawMessage `json:"content"`         // 模板内容
}

// ListVersionsRequest 获取历史版本列表请求
type ListVersionsRequest struct {
	Offset int `form:"offset,default=1" binding:"omitempty,min=1"`         // 页码，从1开始
	Limit  int `form:"limit,default=10" binding:"omitempty,min=1,max=100"` // 每页数量
}

// ListVersionsResponse 历史版本列表响应
type ListVersionsResponse struct {
	Entries    []VersionResponse `json:"entries"`     // 版本列表
	TotalCount int64             `json:"total_count"` // 总数
}

// VersionResponse 历史版本响应
type VersionResponse struct {
	ID            string          `json:"id"`              // 版本记录ID
	TemplateID    string          `json:"template_id"`     // 模板ID
	Version       int             `json:"version"`         // 版本号
	TemplateName  string          `json:"template_name"`   // 工单模板名称
	TemplateType  string          `json:"template_type"`   // 工单模板类型
	Description   string          `json:"description"`     // 模板描述
	CreatedAt     int64           `json:"created_at"`      // 创建时间（时间戳）
	CreatedBy     string          `json:"created_by"`      // 创建人ID
	CreatedByName string          `json:"created_by_name"` // 创建人名称
	Content       json.RawMessage `json:"content"`         // 模板内容
}

// 工单模板类型常量
const (
	TemplateTypeResearch            = "research"              // 调研任务
	TemplateTypeFrontendMachine     = "frontend-machine"      // 前置机
	TemplateTypeDataCollection      = "data-collection"       // 数据归集
	TemplateTypeDataStandardization = "data-standardization"  // 数据标准化
	TemplateTypeDataQualityAudit    = "data-quality-audit"    // 数据质量稽核
	TemplateTypeDataFusion          = "data-fusion"           // 数据融合加工
	TemplateTypeDataUnderstanding   = "data-understanding"    // 数据理解
	TemplateTypeDataResourceCatalog = "data-resource-catalog" // 数据资源编目
)

// CheckNameExistsRequest 校验模板名称是否存在请求
type CheckNameExistsRequest struct {
	TemplateName string `form:"template_name" binding:"required"` // 模板名称
	ExcludeID    string `form:"exclude_id"`                       // 排除的模板ID（更新时使用，创建时不需要）
}

// CheckNameExistsResponse 校验模板名称是否存在响应
type CheckNameExistsResponse struct {
	Exists bool `json:"exists"` // 是否存在：true-存在，false-不存在
}

// IsValidTemplateType 验证模板类型是否有效
func IsValidTemplateType(templateType string) bool {
	validTypes := []string{
		TemplateTypeResearch,
		TemplateTypeFrontendMachine,
		TemplateTypeDataCollection,
		TemplateTypeDataStandardization,
		TemplateTypeDataQualityAudit,
		TemplateTypeDataFusion,
		TemplateTypeDataUnderstanding,
		TemplateTypeDataResourceCatalog,
	}
	for _, validType := range validTypes {
		if templateType == validType {
			return true
		}
	}
	return false
}
