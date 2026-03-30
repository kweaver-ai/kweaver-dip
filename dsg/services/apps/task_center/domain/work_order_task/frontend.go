package work_order_task

import (
	"context"

	"go.uber.org/zap"

	"github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/gorm/work_order_task"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/errorcode"
	task_center_v1 "github.com/kweaver-ai/idrm-go-common/api/task_center/v1"
	task_center_v1_frontend "github.com/kweaver-ai/idrm-go-common/api/task_center/v1/frontend"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
)

// 获取工单任务列表
func (d *domain) ListFrontend(ctx context.Context, opts *task_center_v1.WorkOrderTaskListOptions) (*task_center_v1_frontend.WorkOrderTaskList, error) {
	log.WithContext(ctx).Debug("list work order task", zap.Any("opts", opts))

	var listOpts work_order_task.ListOptions
	if err := work_order_task.Convert_v1_WorkOrderListOptions_To_workOrderTask_ListOptions(opts, &listOpts); err != nil {
		log.Error("convert task_center_v1.WorkOrderTaskListOptions to work_order_task.ListOptions fail", zap.Error(err), zap.Any("in", opts))
		return nil, err
	}

	tasks, total, err := d.repo.List(ctx, listOpts)
	if err != nil {
		return nil, errorcode.NewPublicDatabaseError(err)
	}

	list := &task_center_v1_frontend.WorkOrderTaskList{TotalCount: int(total)}
	d.aggregator.aggregate_Slice_model_WorkOrderTask_To_Slice_frontend_WorkOrderTask(ctx, &tasks, &list.Entries)
	return list, nil
}
