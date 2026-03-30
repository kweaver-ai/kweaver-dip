// Package business_object_attributes_temp 业务对象属性临时表Model
package business_object_attributes_temp

import "time"

// BusinessObjectAttributesTemp 业务对象属性临时表结构
type BusinessObjectAttributesTemp struct {
	Id               string     `db:"id"`
	FormViewId       string     `db:"form_view_id"`
	InUse            int8       `db:"in_use"` // 当前使用标识: 0=历史版本, 1=当前使用
	BusinessObjectId string     `db:"business_object_id"`
	UserId           *string    `db:"user_id"`
	Version          int        `db:"version"`
	FormViewFieldId  string     `db:"form_view_field_id"`
	AttrName         string     `db:"attr_name"`
	CreatedAt        time.Time  `db:"created_at"`
	UpdatedAt        time.Time  `db:"updated_at"`
	DeletedAt        *time.Time `db:"deleted_at"`
}

// TableName 表名
func (BusinessObjectAttributesTemp) TableName() string {
	return "t_business_object_attributes_temp"
}
