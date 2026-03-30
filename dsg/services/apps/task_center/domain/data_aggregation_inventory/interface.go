package data_aggregation_inventory

import (
	"context"

	task_center_v1 "github.com/kweaver-ai/idrm-go-common/api/task_center/v1"
)

type Domain interface {
	// 创建
	Create(ctx context.Context, inventory *task_center_v1.DataAggregationInventory) (*task_center_v1.DataAggregationInventory, error)
	// 删除
	Delete(ctx context.Context, id string) error
	// 更新（全量）
	Update(ctx context.Context, inventory *task_center_v1.DataAggregationInventory) (*task_center_v1.DataAggregationInventory, error)
	// 获取
	Get(ctx context.Context, id string) (*task_center_v1.AggregatedDataAggregationInventory, error)
	// 获取列表
	List(ctx context.Context, opts *task_center_v1.DataAggregationInventoryListOptions) (*task_center_v1.AggregatedDataAggregationInventoryList, error)
	//查询业务标准表物化的表信息
	BatchGetDataTable(ctx context.Context, ids []string) ([]*task_center_v1.BusinessFormDataTableItem, error)
	// 检查归集清单名称是否存在
	CheckName(ctx context.Context, name, id string) (bool, error)

	// 辅助工具
	AggregateBusinessForms(ctx context.Context, ids []string) (out []task_center_v1.AggregatedBusinessFormReference)
}
