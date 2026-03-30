// Package form_view_field_info_temp 库表字段信息临时表Model
package form_view_field_info_temp

import "time"

// FormViewFieldInfoTemp 库表字段信息临时表结构
type FormViewFieldInfoTemp struct {
	Id                string     `db:"id"`
	FormViewId        string     `db:"form_view_id"`
	FormViewFieldId   string     `db:"form_view_field_id"`
	UserId            *string    `db:"user_id"`
	Version           int        `db:"version"`
	FieldBusinessName *string    `db:"field_business_name"`
	FieldRole         *int8      `db:"field_role"`
	FieldDescription  *string    `db:"field_description"`
	CreatedAt         time.Time  `db:"created_at"`
	UpdatedAt         time.Time  `db:"updated_at"`
	DeletedAt         *time.Time `db:"deleted_at"`
}

// TableName 表名
func (FormViewFieldInfoTemp) TableName() string {
	return "t_form_view_field_info_temp"
}
