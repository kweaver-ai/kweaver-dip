package model

const TableNameWorkOrderDataAggregationDetails = "work_order_data_aggregation_details"

// 数据归集工单的任务详情
//
// WorkOrderDataAggregationDetail mapped from table
// <work_order_data_aggregation_details>
type WorkOrderDataAggregationDetail struct {
	// 工单任务 ID
	ID string `json:"id,omitempty"`
	// 部门 ID
	DepartmentID string `json:"department_id,omitempty"`
	// 源表
	Source WorkOrderTaskDetailAggregationTableReference `json:"source,omitempty" gorm:"embedded;embeddedPrefix:source_"`
	// 目标表
	Target WorkOrderTaskDetailAggregationTableReference `json:"target,omitempty" gorm:"embedded;embeddedPrefix:target_"`
	// 归集数量，代表这个任务中归集的数据的数量
	Count int `json:"count,omitempty"`
}

func (WorkOrderDataAggregationDetail) TableName() string {
	return TableNameWorkOrderDataAggregationDetails
}

// 数据归集工单任务中对数据表的引用
type WorkOrderTaskDetailAggregationTableReference struct {
	// 数据源 ID。第三方数据源的 ID，而不是 AnyFabric 数据源的 ID。
	DatasourceID string `json:"datasource_id,omitempty"`
	// 表名称
	TableName string `json:"table_name,omitempty"`
}
