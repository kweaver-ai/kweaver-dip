package data_aggregation_resource

import (
	"gorm.io/gorm"

	"github.com/kweaver-ai/dsg/services/apps/task_center/infrastructure/repository/db/model"
)

// ListByDataAggregationInventoryID 获取列表，根据数据归集清单 ID
func ListByDataAggregationInventoryID(tx *gorm.DB, id string) ([]model.DataAggregationResource, error) {
	var resources []model.DataAggregationResource
	if err := tx.Model(&model.DataAggregationResource{}).
		Where(&model.DataAggregationResource{DataAggregationInventoryID: id}).
		Find(&resources).
		Error; err != nil {
		return nil, err
	}
	return resources, nil
}

// ListByWorkOrderID 获取列表，根据工单 ID
func ListByWorkOrderID(tx *gorm.DB, id string) ([]model.DataAggregationResource, error) {
	var resources []model.DataAggregationResource
	if err := tx.Model(&model.DataAggregationResource{}).
		Where(&model.DataAggregationResource{WorkOrderID: id}).
		Find(&resources).
		Error; err != nil {
		return nil, err
	}
	return resources, nil
}
