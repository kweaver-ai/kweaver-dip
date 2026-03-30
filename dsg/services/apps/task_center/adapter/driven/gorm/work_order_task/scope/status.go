package scope

import (
	"gorm.io/gorm"

	"github.com/kweaver-ai/dsg/services/apps/task_center/infrastructure/repository/db/model"
	task_center_v1 "github.com/kweaver-ai/idrm-go-common/api/task_center/v1"
)

type Status task_center_v1.WorkOrderTaskStatus

// Scope implements Scope.
func (s Status) Scope(tx *gorm.DB) *gorm.DB {
	return tx.Where(&model.WorkOrderTask{Status: model.WorkOrderTaskStatus(s)})
}

var _ Scope = (*Status)(nil)
