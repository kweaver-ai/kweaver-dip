// Package business_object 业务对象正式表Model
package business_object

import "time"

// BusinessObject 业务对象正式表结构
type BusinessObject struct {
	Id         string     `db:"id"`
	ObjectName string     `db:"object_name"`
	ObjectType int8       `db:"object_type"`
	FormViewId string     `db:"form_view_id"`
	MdlId      string     `db:"mdl_id"` // 统一视图ID
	Status     int8       `db:"status"`
	CreatedAt  time.Time  `db:"created_at"`
	UpdatedAt  time.Time  `db:"updated_at"`
	DeletedAt  *time.Time `db:"deleted_at"`
}

// TableName 表名
func (BusinessObject) TableName() string {
	return "t_business_object"
}
