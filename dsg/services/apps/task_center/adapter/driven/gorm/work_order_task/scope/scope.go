package scope

import (
	"gorm.io/gorm"

	"github.com/kweaver-ai/dsg/services/apps/task_center/infrastructure/repository/db/model"
)

// WorkOrderID 限制所属工单 ID
func WorkOrderID(id string) func(*gorm.DB) *gorm.DB {
	return func(tx *gorm.DB) *gorm.DB {
		return tx.Where(&model.WorkOrderTask{WorkOrderID: id})
	}
}

// 限制状态为已完成
func Completed(tx *gorm.DB) *gorm.DB {
	return tx.Where(&model.WorkOrderTask{Status: model.WorkOrderTaskCompleted})
}

type Scope interface {
	Scope(tx *gorm.DB) *gorm.DB
}
