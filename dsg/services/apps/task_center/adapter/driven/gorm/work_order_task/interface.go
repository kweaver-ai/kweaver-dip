package work_order_task

import (
	"context"

	"gorm.io/gorm"

	"github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/gorm/work_order_task/scope"
	"github.com/kweaver-ai/dsg/services/apps/task_center/infrastructure/repository/db/model"
)

type Repository interface {
	Db() *gorm.DB

	// 创建
	Create(ctx context.Context, task *model.WorkOrderTask) error
	// 获取
	Get(ctx context.Context, id string) (*model.WorkOrderTask, error)
	// 更新
	Update(ctx context.Context, task *model.WorkOrderTask) error
	// 获取数量
	Count(ctx context.Context, scopes ...func(*gorm.DB) *gorm.DB) (int, error)
	// 获取列表
	List(ctx context.Context, opts ListOptions) ([]model.WorkOrderTask, int64, error)
	// 获取列表，根据所属工单过滤
	ListByWorkOrderID(ctx context.Context, id string, limit int, offset int) ([]model.WorkOrderTask, int64, error)
	// 根据工单id批量获取工单任务
	ListByWorkOrderIDs(ctx context.Context, workOrderIds []string) ([]model.WorkOrderTask, error)
	// 批量创建工单任务
	BatchCreate(ctx context.Context, tasks []model.WorkOrderTask) error
	// 批量更新工单任务
	BatchUpdate(ctx context.Context, tasks []model.WorkOrderTask) error
	GetDataAggregationTasks(ctx context.Context, formId string) (tasks []*model.WorkOrderTask, err error)
	GetDataQualityAuditTasks(ctx context.Context, formName string) (tasks []*model.WorkOrderTask, err error)
	GetDataFusionTasks(ctx context.Context, formName string) (tasks []*model.WorkOrderTask, err error)
	GetDataAggregationDetails(ctx context.Context, formName string) (details []*model.WorkOrderDataAggregationDetail, err error)
	GetByFormNames(ctx context.Context, formNames []string) (details []*model.WorkOrderDataAggregationDetail, err error)
	GetTaskByIds(ctx context.Context, ids []string) (tasks []*model.WorkOrderTask, err error)
}

type ListOptions struct {
	Limit   int             `json:"limit,omitempty"`
	Offset  int             `json:"offset,omitempty"`
	OrderBy []OrderByColumn `json:"order_by,omitempty"`
	Scopes  []scope.Scope   `json:"scopes,omitempty"`
}

type OrderByColumn struct {
	Column     string `json:"column,omitempty"`
	Descending bool   `json:"descending,omitempty"`
}
