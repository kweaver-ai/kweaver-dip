package work_order_template

import (
	"context"

	"gorm.io/gorm"

	"github.com/kweaver-ai/dsg/services/apps/task_center/infrastructure/repository/db/model"
)

type Repository interface {
	Db() *gorm.DB

	// 创建工单模板
	Create(ctx context.Context, template *model.WorkOrderTemplate) error
	// 根据ID获取工单模板
	Get(ctx context.Context, id int64) (*model.WorkOrderTemplate, error)
	// 更新工单模板
	Update(ctx context.Context, template *model.WorkOrderTemplate) error
	// 删除工单模板（逻辑删除）
	Delete(ctx context.Context, id int64) error
	// 获取工单模板列表
	List(ctx context.Context, opts ListOptions) ([]model.WorkOrderTemplate, int64, error)
	// 根据工单类型获取启用的模板
	GetActiveByTicketType(ctx context.Context, ticketType string) (*model.WorkOrderTemplate, error)
	// 停用指定工单类型的所有模板
	DisableByTicketType(ctx context.Context, ticketType string) error
	// 检查模板名称是否存在
	CheckNameExists(ctx context.Context, templateName string, excludeID int64) (bool, error)
	// 更新模板状态
	UpdateStatus(ctx context.Context, id int64, status int32) error
	// 停用指定工单类型下除指定ID外的所有模板
	DisableOthersByTicketType(ctx context.Context, ticketType string, excludeID int64) error
}

// ListOptions 列表查询选项
type ListOptions struct {
	Limit       int      // 每页数量
	Offset      int      // 页码（从1开始）
	TicketTypes []string // 工单类型过滤
	Status      *int32   // 状态过滤
	IsBuiltin   *int32   // 是否内置模板过滤
	Keyword     string   // 关键字搜索
}
