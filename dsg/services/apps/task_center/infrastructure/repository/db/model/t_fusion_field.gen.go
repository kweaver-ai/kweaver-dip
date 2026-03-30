package model

import (
	"time"

	utilities "github.com/kweaver-ai/idrm-go-frame/core/utils"
	"gorm.io/gorm"
)

const TableNameTFusionField = "t_fusion_field"

// TFusionField mapped from table <t_fusion_field>
type TFusionField struct {
	ID                uint64     `gorm:"column:id" json:"id"`                                                            // 列雪花id
	CName             string     `gorm:"column:c_name;not null" json:"c_name"`                                           // 列中文名称
	EName             string     `gorm:"column:e_name;not null" json:"e_name"`                                           // 列英文名称
	WorkOrderID       string     `gorm:"column:work_order_id;not null" json:"work_order_id"`                             // 工单ID
	StandardID        *uint64    `gorm:"column:standard_id" json:"standard_id"`                                          // 标准ID
	CodeTableID       *uint64    `gorm:"column:code_table_id" json:"code_table_id"`                                      // 码表ID
	CodeRuleID        *uint64    `gorm:"column:code_rule_id" json:"code_rule_id"`                                        // 编码规则ID
	DataRange         *string    `gorm:"column:data_range" json:"data_range"`                                            // 值域
	DataType          int        `gorm:"column:data_type;not null" json:"data_type"`                                     // 数据类型
	DataLength        *int       `gorm:"column:data_length" json:"data_length"`                                          // 数据长度
	DataAccuracy      *int       `gorm:"column:data_accuracy" json:"data_accuracy"`                                      // 数据精度
	PrimaryKey        *bool      `gorm:"column:primary_key" json:"primary_key"`                                          // 是否主键
	IsRequired        *bool      `gorm:"column:is_required" json:"is_required"`                                          // 是否必填
	IsIncrement       *bool      `gorm:"column:is_increment" json:"is_increment"`                                        // 是否增量
	IsStandard        *bool      `gorm:"column:is_standard" json:"is_standard"`                                          // 是否标准
	FieldRelationship string     `gorm:"column:field_relationship;not null;default:''" json:"field_relationship"`        // 字段关系
	CatalogID         *string    `gorm:"column:catalog_id" json:"catalog_id"`                                            // 数据资源目录ID
	InfoItemID        *string    `gorm:"column:info_item_id" json:"info_item_id"`                                        // 信息项ID
	Index             int        `gorm:"column:index;not null" json:"index"`                                             // 字段顺序
	CreatedByUID      string     `gorm:"column:created_by_uid;not null" json:"created_by_uid"`                           // 创建人
	CreatedAt         time.Time  `gorm:"column:created_at;not null" json:"created_at"`                                   // 创建时间
	UpdatedByUID      *string    `gorm:"column:updated_by_uid" json:"updated_by_uid"`                                    // 更新人
	UpdatedAt         *time.Time `gorm:"column:updated_at;autoUpdateTime;default:current_timestamp()" json:"updated_at"` // 更新时间
	DeletedByUID      *string    `gorm:"column:deleted_by_uid" json:"deleted_by_uid"`                                    // 删除人
	DeletedAt         *time.Time `gorm:"column:deleted_at" json:"deleted_at"`                                            // 删除时间
}

func (m *TFusionField) BeforeCreate(_ *gorm.DB) error {
	if m == nil {
		return nil
	}

	if m.ID == 0 {
		m.ID, _ = utilities.GetUniqueID()
	}

	now := time.Now()
	if m.CreatedAt.IsZero() {
		m.CreatedAt = now
	}
	if m.UpdatedAt.IsZero() {
		m.UpdatedAt = &now
	}
	return nil
}

// TableName TFusionField's table name
func (*TFusionField) TableName() string {
	return TableNameTFusionField
}
