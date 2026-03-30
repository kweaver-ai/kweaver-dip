package work_order_single

import (
	task_v1 "github.com/kweaver-ai/idrm-go-common/api/task_center/v1"
	"github.com/kweaver-ai/idrm-go-common/reconcile"
)

type WorkOrderReconcilerGetter interface {
	// 返回处理工单消息的 Reconciler
	WorkOrderReconciler() reconcile.Reconciler[task_v1.WorkOrder]
}
