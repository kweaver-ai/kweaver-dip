package work_order_manage

import (
	"context"

	"gorm.io/gorm"

	"github.com/kweaver-ai/dsg/services/apps/task_center/infrastructure/repository/db/model"
)

type Repository interface {
	Db() *gorm.DB

	// 创建工单模板
	Create(ctx context.Context, template *model.WorkOrderManageTemplate) error
	// 根据ID获取工单模板
	Get(ctx context.Context, id uint64) (*model.WorkOrderManageTemplate, error)
	// 更新工单模板
	Update(ctx context.Context, template *model.WorkOrderManageTemplate) error
	// 删除工单模板（逻辑删除）
	Delete(ctx context.Context, id uint64) error
	// 获取工单模板列表
	List(ctx context.Context, opts ListOptions) ([]model.WorkOrderManageTemplate, int64, error)
	// 检查模板名称是否存在
	CheckNameExists(ctx context.Context, templateName string, excludeID uint64) (bool, error)
	// 检查模板是否被引用
	CheckReferenceCount(ctx context.Context, id uint64) (int64, error)
	// 创建历史版本
	CreateVersion(ctx context.Context, version *model.WorkOrderManageTemplateVersion) error
	// 获取历史版本列表
	ListVersions(ctx context.Context, templateID uint64, opts ListVersionsOptions) ([]model.WorkOrderManageTemplateVersion, int64, error)
	// 获取指定版本详情
	GetVersion(ctx context.Context, templateID uint64, version int) (*model.WorkOrderManageTemplateVersion, error)
	// 获取模板的最大版本号
	GetMaxVersion(ctx context.Context, templateID uint64) (int, error)
}

// ListOptions 列表查询选项
type ListOptions struct {
	Limit        int    // 每页数量
	Offset       int    // 页码（从1开始）
	TemplateName string // 模板名称（模糊查询）
	TemplateType string // 模板类型
	IsActive     *int8  // 是否启用
	Keyword      string // 关键字搜索
}

// ListVersionsOptions 历史版本列表查询选项
type ListVersionsOptions struct {
	Limit  int // 每页数量
	Offset int // 页码（从1开始）
}
