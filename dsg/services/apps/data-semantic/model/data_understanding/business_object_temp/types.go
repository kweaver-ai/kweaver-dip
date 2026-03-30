// Package business_object_temp 业务对象临时表Model
package business_object_temp

import "time"

// BusinessObjectTemp 业务对象临时表结构
type BusinessObjectTemp struct {
	Id         string     `db:"id"`
	FormViewId string     `db:"form_view_id"`
	InUse      int8       `db:"in_use"` // 当前使用标识: 0=历史版本, 1=当前使用
	UserId     *string    `db:"user_id"`
	Version    int        `db:"version"`
	ObjectName string     `db:"object_name"`
	CreatedAt  time.Time  `db:"created_at"`
	UpdatedAt  time.Time  `db:"updated_at"`
	DeletedAt  *time.Time `db:"deleted_at"`
}

// TableName 表名
func (BusinessObjectTemp) TableName() string {
	return "t_business_object_temp"
}
