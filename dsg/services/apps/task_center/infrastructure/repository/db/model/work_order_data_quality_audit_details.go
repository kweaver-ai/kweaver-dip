package model

const TableNameWorkOrderDataQualityAuditDetail = "work_order_data_quality_audit_details"

// WorkOrderDataQualityAuditDetail mapped from table <work_order_data_quality_audit_details>
type WorkOrderDataQualityAuditDetail struct {
	ID              string `gorm:"column:id" json:"id"`                             // ID
	WorkOrderID     string `gorm:"column:work_order_id" json:"work_order_id"`       // 工单任务 ID
	DatasourceID    string `gorm:"column:datasource_id" json:"datasource_id"`       // 数据源 ID
	DatasourceName  string `gorm:"column:datasource_name" json:"datasource_name"`   // 数据源名称
	DataTable       string `gorm:"column:data_table" json:"data_table"`             // 数据表名称
	DetectionScheme string `gorm:"column:detection_scheme" json:"detection_scheme"` // 检测方案
	Status          string `gorm:"column:status" json:"status"`                     // 工单任务状态
	Reason          string `gorm:"column:reason" json:"reason"`                     // 任务处于当前状态的原因，比如失败原因
	Link            string `gorm:"column:link" json:"link"`                         // 任务失败处理 URL
}

// TableName WorkOrderDataQualityAuditDetail's table name
func (*WorkOrderDataQualityAuditDetail) TableName() string {
	return TableNameWorkOrderDataQualityAuditDetail
}
