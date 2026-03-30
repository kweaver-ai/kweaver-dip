package model

import "time"

const TableNameWorkOrderTemplate = "work_order_template"

// WorkOrderTemplate mapped from table <work_order_template>
type WorkOrderTemplate struct {
	ID           int64     `gorm:"column:id" json:"id"`                                           // 主键ID
	TicketType   string    `gorm:"column:ticket_type;not null" json:"ticket_type"`                // 工单类型
	TemplateName string    `gorm:"column:template_name;not null" json:"template_name"`            // 工单模板名称
	Description  string    `gorm:"column:description" json:"description"`                         // 工单描述
	CreatedByUID string    `gorm:"column:created_by_uid;not null" json:"created_by_uid"`          // 创建人
	CreatedAt    time.Time `gorm:"column:created_at;not null" json:"created_at"`                  // 创建时间
	UpdatedTime  time.Time `gorm:"column:updated_at;autoUpdateTime;not null" json:"updated_time"` // 更新时间
	UpdatedByUID string    `gorm:"column:updated_by_uid;not null" json:"updated_by_uid"`          // 更新人
	IsBuiltin    int32     `gorm:"column:is_builtin;not null;default:0" json:"is_builtin"`        // 是否内置模板 0-否 1-是
	Status       int32     `gorm:"column:status;not null;default:1" json:"status"`                // 状态 0-禁用 1-启用
	IsDeleted    int32     `gorm:"column:is_deleted;not null;default:0" json:"is_deleted"`        // 是否删除 0-否 1-是
}

func (WorkOrderTemplate) TableName() string { return TableNameWorkOrderTemplate }

// 工单类型常量
const (
	// 数据归集工单模板
	TicketTypeDataAggregation = "data_aggregation"
	// 标准化工单模板
	TicketTypeStandardization = "data_standardization"
	// 质量检测工单模板
	TicketTypeQualityDetection = "data_quality_audit"
	// 数据融合工单模板
	TicketTypeDataFusion = "data_fusion"
)

// 工单类型排序权重
var TicketTypeOrder = map[string]int{
	TicketTypeDataAggregation:  1,
	TicketTypeStandardization:  2,
	TicketTypeQualityDetection: 3,
	TicketTypeDataFusion:       4,
}
