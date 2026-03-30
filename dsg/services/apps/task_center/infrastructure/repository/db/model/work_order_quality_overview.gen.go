package model

import "time"

const TableNameQualityOverview = "work_order_quality_overview"

// WorkOrder mapped from table <work_order>
type WorkOrderQualityOverview struct {
	DepartmentId           string    `gorm:"column:department_id;comment:所属部门id" json:"department_id"`                   //所属部门(创建人部门id)
	TableCount             uint64    `gorm:"column:table_count;not null" json:"table_count"`                             // 应检测表数量
	QualitiedTableCount    uint64    `gorm:"column:qualitied_table_count;not null" json:"qualitied_table_count"`         // 已检测表数量
	ProcessedTableCount    uint64    `gorm:"column:processed_table_count;not null" json:"processed_table_count"`         // 已整改表数量
	QuestionTableCount     uint64    `gorm:"column:question_table_count;not null" json:"question_table_count"`           // 问题表数量
	StartProcessTableCount uint64    `gorm:"column:start_process_table_count;not null" json:"start_process_table_count"` // 已响应表数量
	ProcessingTableCount   uint64    `gorm:"column:processing_table_count;not null" json:"processing_table_count"`       // 整改中表数量
	NotProcessTableCount   uint64    `gorm:"column:not_process_table_count;not null" json:"not_process_table_count"`     // 未整改表数量
	QualityRate            string    `gorm:"column:quality_rate;not null" json:"quality_rate"`                           // 整改率
	CreatedAt              time.Time `gorm:"column:created_at;not null;default:current_timestamp(3)" json:"created_at"`  // 创建时间
}

type WorkOrderQualityOverviewAndDepartmentName struct {
	WorkOrderQualityOverview
	DepartmentName string `gorm:"column:department_name" json:"department_name"` //所属部门(创建人部门)
}

// TableName WorkOrderQualityOverview's table name
func (*WorkOrderQualityOverview) TableName() string {
	return TableNameQualityOverview
}
