package model

const TableNameWorkOrderDataFusionDetails string = "work_order_data_fusion_details"

// WorkOrderDataFusionDetail mapped from table
// <work_order_data_fusion_details>
type WorkOrderDataFusionDetail struct {
	// 工单 ID
	ID string `gorm:"column:id" json:"id,omitempty"`
	// 数据源 ID
	DatasourceID string `gorm:"column:datasource_id" json:"datasource_id,omitempty"`
	// 数据源名称
	DatasourceName string `gorm:"column:datasource_name" json:"datasource_name,omitempty"`
	// 数据表名称
	DataTable string `gorm:"column:data_table" json:"data_table,omitempty"`
}

func (WorkOrderDataFusionDetail) TableName() string { return TableNameWorkOrderDataFusionDetails }
