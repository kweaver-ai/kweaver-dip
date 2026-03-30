package impl

import (
	"context"

	domain "github.com/kweaver-ai/dsg/services/apps/task_center/domain/work_order"
	"github.com/kweaver-ai/dsg/services/apps/task_center/infrastructure/repository/db/model"
)

// 其他模块想要的
func NewWorkOrderInterface(w domain.WorkOrderUseCase) domain.WorkOrderInterface {
	return w
}

func (w *workOrderUseCase) GetListbySourceIDs(ctx context.Context, ids []string) ([]*model.WorkOrder, error) {
	workOrders, err := w.repo.GetListbySourceIDs(ctx, ids)
	if err != nil {
		return nil, err
	}
	return workOrders, nil
}
