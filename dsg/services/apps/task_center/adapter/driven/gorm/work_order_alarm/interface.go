package work_order_alarm

import (
	"context"
	"time"

	"github.com/google/uuid"

	"github.com/kweaver-ai/dsg/services/apps/task_center/infrastructure/repository/db/model"
)

// 工单告警的数据库接口
type Interface interface {
	// 创建工单告警
	Create(ctx context.Context, alarm *model.WorkOrderAlarm) error
	// 获取需要发送用户通知的工单告警，days 是提前的天数，以输入参数 now 所在时区计算“天”
	ListForNotification(ctx context.Context, now time.Time, days int, limit int) ([]model.WorkOrderAlarm, error)
	// 获取需要发送的截止告警
	ListForDeadline(ctx context.Context, now time.Time, limit int) ([]model.WorkOrderAlarm, error)
	// 获取需要发送的提前告警，days 是提前的天数
	ListForBeforehand(ctx context.Context, now time.Time, limit int, days int) ([]model.WorkOrderAlarm, error)
	// 更新截止日期，根据工单 ID
	UpdateDeadlineByWorkOrderID(ctx context.Context, workOrderID uuid.UUID, deadline time.Time) error
	// 更新上次发送用户通知的时间
	UpdateLastNotifiedAt(ctx context.Context, id uuid.UUID, now time.Time) error
	// 删除，根据工单 ID
	DeleteByWorkOrderID(ctx context.Context, workOrderID uuid.UUID) error
}
