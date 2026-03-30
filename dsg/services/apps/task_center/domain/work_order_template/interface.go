package work_order_template

import (
	"context"
)

type Domain interface {
	// 创建工单模板
	Create(ctx context.Context, req *CreateRequest) (*CreateResponse, error)
	// 更新工单模板
	Update(ctx context.Context, id int64, req *UpdateRequest) (*UpdateResponse, error)
	// 删除工单模板
	Delete(ctx context.Context, id int64) error
	// 获取工单模板详情
	Get(ctx context.Context, id int64) (*TemplateResponse, error)
	// 获取工单模板列表
	List(ctx context.Context, req *ListRequest) (*ListResponse, error)
	// 更新工单模板状态（启用/停用）
	UpdateStatus(ctx context.Context, id int64, state int32, updatedByUID string) (*UpdateResponse, error)
}

// CreateRequest 创建工单模板请求
type CreateRequest struct {
	TicketType   string `json:"ticket_type" binding:"required"`   // 工单类型 data_aggregation: 数据归集工单  standardization: 标准化工单模板  quality_detection: 质量检测工单模板  data_fusion: 数据融合工单
	TemplateName string `json:"template_name" binding:"required"` // 工单模板名称
	Description  string `json:"description"`                      // 工单描述
	CreatedByUID string `json:"create_by_uid"`
	UpdatedByUID string `json:"updated_by_uid"`
}

// CreateResponse 创建工单模板响应
type CreateResponse struct {
	ID int64 `json:"id"` // 主键ID
}

// UpdateRequest 更新工单模板请求
type UpdateRequest struct {
	TicketType   string `json:"ticket_type" binding:"required"`   // 工单类型
	TemplateName string `json:"template_name" binding:"required"` // 工单模板名称
	Description  string `json:"description"`                      // 工单描述
	UpdatedByUID string `json:"updated_by_uid"`                   // 更新人
}

// UpdateResponse 更新工单模板响应
type UpdateResponse struct {
	ID int64 `json:"id"` // 主键ID
}

// ListRequest 获取工单模板列表请求
type ListRequest struct {
	Limit       int      `form:"limit,default=10" binding:"omitempty,min=1,max=100"` // 每页数量，默认10
	Offset      int      `form:"offset,default=1" binding:"omitempty,min=1"`         // 页码，默认1
	TicketTypes []string `form:"ticket_type[]"`                                      // 工单类型数组
	Status      *bool    `form:"status"`                                             // 状态
	IsBuiltin   *bool    `form:"is_builtin"`                                         // 是否内置模板
	Keyword     string   `form:"keyword" binding:"omitempty"`                        // 关键字搜索
}

// TemplateResponse 工单模板响应
type TemplateResponse struct {
	ID           int64  `json:"id"`             // 主键ID
	TicketType   string `json:"ticket_type"`    // 工单类型
	TemplateName string `json:"template_name"`  // 工单模板名称
	Description  string `json:"description"`    // 工单描述
	CreatedByUID string `json:"created_by_uid"` // 创建人
	CreatedAt    string `json:"created_at"`     // 创建时间
	UpdatedAt    string `json:"updated_at"`     // 更新时间
	UpdatedByUID string `json:"updated_by_uid"` // 更新人
	IsBuiltin    bool   `json:"is_builtin"`     // 是否内置模板
	Status       bool   `json:"status"`         // 状态
	CreatedName  string `json:"created_name"`
	UpdatedName  string `json:"updated_name"`
}

// ListResponse 工单模板列表响应
type ListResponse struct {
	Entries    []TemplateResponse `json:"entries"`     // 模板列表
	TotalCount int64              `json:"total_count"` // 总数
}

// UpdateStatusRequest 更新工单模板状态请求
type UpdateStatusRequest struct {
	UpdatedByUID string `json:"updated_by_uid" binding:"required"` // 更新人
}
