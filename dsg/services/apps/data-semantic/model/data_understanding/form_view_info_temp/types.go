// Package form_view_info_temp 库表信息临时表Model
package form_view_info_temp

import "time"

// FormViewInfoTemp 库表信息临时表结构
type FormViewInfoTemp struct {
	Id                string     `db:"id"`
	FormViewId        string     `db:"form_view_id"`
	UserId            *string    `db:"user_id"`
	Version           int        `db:"version"`
	TableBusinessName *string    `db:"table_business_name"`
	TableDescription  *string    `db:"table_description"`
	CreatedAt         time.Time  `db:"created_at"`
	UpdatedAt         time.Time  `db:"updated_at"`
	DeletedAt         *time.Time `db:"deleted_at"`
}

// TableName 表名
func (FormViewInfoTemp) TableName() string {
	return "t_form_view_info_temp"
}
