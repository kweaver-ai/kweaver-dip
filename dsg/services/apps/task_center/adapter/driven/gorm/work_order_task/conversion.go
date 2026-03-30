package work_order_task

import (
	"github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/gorm/work_order_task/scope"
	meta_v1 "github.com/kweaver-ai/idrm-go-common/api/meta/v1"
	task_center_v1 "github.com/kweaver-ai/idrm-go-common/api/task_center/v1"
)

func Convert_v1_WorkOrderListOptions_To_workOrderTask_ListOptions(in *task_center_v1.WorkOrderTaskListOptions, out *ListOptions) error {
	out.Limit = in.Limit
	out.Offset = (in.Offset - 1) * in.Limit
	if in.Sort != "" {
		out.OrderBy = []OrderByColumn{{
			Column:     in.Sort,
			Descending: in.Direction == meta_v1.Descending,
		}}
	}
	if in.Keyword != "" {
		out.Scopes = append(out.Scopes, &scope.Keyword{Columns: []string{"name"}, Value: in.Keyword})
	}
	if in.Status != "" {
		out.Scopes = append(out.Scopes, scope.Status(in.Status))
	}
	if in.WorkOrderType != "" {
		out.Scopes = append(out.Scopes, scope.WorkOrderType(in.WorkOrderType))
	}
	if in.WorkOrderID != "" {
		out.Scopes = append(out.Scopes, &scope.Function{Description: map[string]string{"work_order_id": in.WorkOrderID}, Underlying: scope.WorkOrderID(in.WorkOrderID)})
	}
	return nil
}
