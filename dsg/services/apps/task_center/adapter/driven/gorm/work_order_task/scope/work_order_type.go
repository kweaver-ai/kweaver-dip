package scope

import (
	"gorm.io/gorm"

	"github.com/kweaver-ai/dsg/services/apps/task_center/domain/work_order"
	task_center_v1 "github.com/kweaver-ai/idrm-go-common/api/task_center/v1"
)

type WorkOrderType task_center_v1.WorkOrderType

// Scope implements Scope.
func (w WorkOrderType) Scope(tx *gorm.DB) *gorm.DB {
	var v int32
	work_order.Convert_task_center_v1_WorkOrderType_To_WorkOrderType((*task_center_v1.WorkOrderType)(&w), &v)
	return tx.Joins("INNER JOIN work_order ON work_order.work_order_id = work_order_tasks.work_order_id AND work_order.type = ?", v)
}

var _ Scope = (*WorkOrderType)(nil)
