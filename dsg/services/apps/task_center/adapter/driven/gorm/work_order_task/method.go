package work_order_task

import (
	"errors"
	"log"

	"gorm.io/gorm"

	"github.com/kweaver-ai/dsg/services/apps/task_center/infrastructure/repository/db/model"
)

// Create 创建工单任务，不包括工单类型对应的任务详情
func Create(tx *gorm.DB, task *model.WorkOrderTask) (err error) {
	return tx.Create(task).Error
}

// CreateWorkOrderTaskTypedDetail 创建工单类型对应的任务详情
func CreateWorkOrderTaskTypedDetail(tx *gorm.DB, detail *model.WorkOrderTaskTypedDetail) (err error) {
	var d any
	switch {
	// 数据归集
	case detail.DataAggregation != nil:
		d = detail.DataAggregation
		// 数据理解
	case detail.DataComprehension != nil:
		d = detail.DataComprehension
		// 数据融合
	case detail.DataFusion != nil:
		d = detail.DataFusion
		// 数据质量
	case detail.DataQuality != nil:
		d = detail.DataQuality
		// 数据质量稽核
	case detail.DataQualityAudit != nil:
		d = detail.DataQualityAudit
	default:
		return errors.New("all details are nil")
	}
	log.Printf("DEBUG.CreateWorkOrderTaskTypedDetail, d is nil: %v, d: %+v", d == nil, d)
	return tx.Create(d).Error
}

// Get 返回指定 ID 的工单任务，不包括对应类型工单的详情
func Get(tx *gorm.DB, id string) (task *model.WorkOrderTask, err error) {
	task = new(model.WorkOrderTask)
	err = tx.Take(task, "id = ?", id).Error
	if err != nil {
		task = nil
	}
	if errors.Is(err, gorm.ErrRecordNotFound) {
		err = ErrNotFound
	}
	return
}

// GetWorkOrder 根据 ID 获取工单
func GetWorkOrder(tx *gorm.DB, id string) (*model.WorkOrder, error) {
	result := &model.WorkOrder{}
	if err := tx.Where("work_order_id=?", id).Take(result).Error; err != nil {
		return nil, err
	}
	return result, nil
}

// Update 更新工单任务
func Update(tx *gorm.DB, task *model.WorkOrderTask) error { return tx.Save(task).Error }

// UpdateWorkOrderTaskTypedDetail 更新工单任务的详情
func UpdateWorkOrderTaskTypedDetail(tx *gorm.DB, detail *model.WorkOrderTaskTypedDetail) (err error) {
	var d any
	switch {
	// 数据归集
	case detail.DataAggregation != nil:
		d = detail.DataAggregation
		// 数据理解
	case detail.DataComprehension != nil:
		d = detail.DataComprehension
		// 数据融合
	case detail.DataFusion != nil:
		d = detail.DataFusion
		// 数据质量
	case detail.DataQuality != nil:
		d = detail.DataQuality
		// 数据质量稽核
	case detail.DataQualityAudit != nil:
		d = detail.DataQualityAudit
	default:
		return errors.New("all details are nil")
	}
	log.Printf("DEBUG.UpdateWorkOrderTaskTypedDetail, d is nil: %v, d: %+v", d == nil, d)
	return tx.Save(d).Error
}
