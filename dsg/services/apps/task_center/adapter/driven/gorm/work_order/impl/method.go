package impl

import (
	"gorm.io/gorm"

	"github.com/kweaver-ai/dsg/services/apps/task_center/infrastructure/repository/db/model"
)

// UpdateStatus 更新工单状态为指定值
func UpdateStatus(tx *gorm.DB, id string, s int32) error {
	return tx.Where(&model.WorkOrder{WorkOrderID: id}).Updates(&model.WorkOrder{Status: s}).Error
}

// 根据 sonyflake id 查询工单
func GetBySonyflakeID(tx *gorm.DB, id uint64) (*model.WorkOrder, error) {
	var order model.WorkOrder
	if err := tx.Model(&model.WorkOrder{}).
		Where(&model.WorkOrder{ID: id}).
		Take(&order).
		Error; err != nil {
		return nil, err
	}
	return &order, nil
}
