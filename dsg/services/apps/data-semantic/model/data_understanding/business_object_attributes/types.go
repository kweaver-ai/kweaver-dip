// Package business_object_attributes 业务对象属性正式表Model
package business_object_attributes

import "time"

// BusinessObjectAttributes 业务对象属性正式表结构
type BusinessObjectAttributes struct {
	Id               string     `db:"id"`
	FormViewId       string     `db:"form_view_id"`
	BusinessObjectId string     `db:"business_object_id"`
	FormViewFieldId  string     `db:"form_view_field_id"`
	AttrName         string     `db:"attr_name"`
	CreatedAt        time.Time  `db:"created_at"`
	UpdatedAt        time.Time  `db:"updated_at"`
	DeletedAt        *time.Time `db:"deleted_at"`
}

// TableName 表名
func (BusinessObjectAttributes) TableName() string {
	return "t_business_object_attributes"
}
