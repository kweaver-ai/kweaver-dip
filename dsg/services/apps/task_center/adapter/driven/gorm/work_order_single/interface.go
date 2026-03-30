package work_order_single

import (
	"context"

	"github.com/google/uuid"

	"github.com/kweaver-ai/dsg/services/apps/task_center/infrastructure/repository/db/model"
)

// 工单的数据库接口
type Interface interface {
	// 获取工单
	GetByWorkOrderID(ctx context.Context, id uuid.UUID) (*model.WorkOrderSingle, error)
}
