package model

import (
	"github.com/kweaver-ai/idrm-go-frame/core/utils"
	"gorm.io/gorm"
)

const TableFormBusinessObjectRelation = "form_business_object_relation"

// FormBusinessObjectRelation mapped from table <form_business_object_relation>
type FormBusinessObjectRelation struct {
	RelationID       uint64 `gorm:"column:relation_id" json:"relation_id"`               // 关联雪花id
	FormID           string `gorm:"column:form_id;not null" json:"form_id"`              // 表单id
	BusinessObjectID string `gorm:"column:business_object_id" json:"business_object_id"` // 业务对象、业务活动id
	LogicalEntityID  string `gorm:"column:logical_entity_id" json:"logical_entity_id"`   // 逻辑实体ID
	AttributeID      string `gorm:"column:attribute_id" json:"attribute_id"`             // 属性ID
	FieldID          string `gorm:"column:field_id" json:"field_id"`                     // 字段ID
}

// TableName FormBusinessObjectRelation's table name
func (*FormBusinessObjectRelation) TableName() string {
	return TableFormBusinessObjectRelation
}

func (b *FormBusinessObjectRelation) BeforeCreate(_ *gorm.DB) error {
	if b == nil {
		return nil
	}

	if b.RelationID == 0 {
		id, _ := utils.GetUniqueID()
		b.RelationID = id
	}
	return nil
}
