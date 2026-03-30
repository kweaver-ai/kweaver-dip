package data_aggregation_inventory

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/task_center/infrastructure/repository/db/model"
	task_center_v1 "github.com/kweaver-ai/idrm-go-common/api/task_center/v1"
)

type Repository interface {
	// 创建
	Create(ctx context.Context, inventory *task_center_v1.DataAggregationInventory) error
	// 删除
	Delete(ctx context.Context, id string) error
	// 更新
	Update(ctx context.Context, id string, tryUpdate UpdateFunc) (*task_center_v1.DataAggregationInventory, error)
	// 更新，根据 ApplyID
	UpdateByApplyID(ctx context.Context, id string, tryUpdate UpdateFunc) (*task_center_v1.DataAggregationInventory, error)
	// 更新，根据 Status
	UpdateByStatus(ctx context.Context, status task_center_v1.DataAggregationInventoryStatus, tryUpdate UpdateFunc) error
	// 更新状态
	UpdateStatus(ctx context.Context, id string, s task_center_v1.DataAggregationInventoryStatus) error
	// 更新审核状态，根据 ApplyID
	UpdateStatusByApplyID(ctx context.Context, applyID string, s task_center_v1.DataAggregationInventoryStatus) error
	// 获取
	Get(ctx context.Context, id string) (*task_center_v1.DataAggregationInventory, error)
	// 获取列表
	List(ctx context.Context, opts *task_center_v1.DataAggregationInventoryListOptions) (*task_center_v1.DataAggregationInventoryList, error)
	//根据业务表ID查询物化的物理表
	QueryDataTable(ctx context.Context, ids []string) (rs []*model.DataAggregationResource, err error)
	// 检查归集清单名称是否存在
	CheckName(ctx context.Context, name, id string) (bool, error)
}

type UpdateFunc func(inventory *task_center_v1.DataAggregationInventory) error
