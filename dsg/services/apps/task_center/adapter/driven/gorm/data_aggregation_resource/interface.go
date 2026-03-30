package data_aggregation_resource

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/task_center/infrastructure/repository/db/model"
)

type Interface interface {
	// 更新归集清单相关的资源（逻辑视图），使数据库记录与期望相同
	ReconcileByDataInventoryID(ctx context.Context, dataInventoryID string, resources []model.DataAggregationResource) error
	// 更新归集工单相关的资源（逻辑视图），使数据库记录与期望相同
	ReconcileByWorkOrderID(ctx context.Context, workOrderID string, resources []model.DataAggregationResource) error
	// ListByDataAggregationInventoryID 获取列表，根据数据归集清单 ID
	ListByDataAggregationInventoryID(ctx context.Context, id string) ([]model.DataAggregationResource, error)
	// ListByWorkOrderID 获取列表，根据工单 ID
	ListByWorkOrderID(ctx context.Context, id string) ([]model.DataAggregationResource, error)
}
