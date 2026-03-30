package work_order_extend

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/task_center/infrastructure/repository/db/model"
)

type WorkOrderExtendRepo interface {
	GetByWorkOrderIdAndExtendKey(ctx context.Context, workOrderId, extendKey string) (res *model.TWorkOrderExtend, err error)
	Create(ctx context.Context, extend *model.TWorkOrderExtend) error
	Update(ctx context.Context, extend *model.TWorkOrderExtend) error
	DeleteByWorkOrderId(ctx context.Context, workOrderId string) error
}
