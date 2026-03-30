// Package form_view 库表视图Model
package form_view

import "time"

// FormView 库表视图结构 (仅包含本功能需要的字段)
type FormView struct {
	Id               string     `db:"id"`
	UnderstandStatus int8       `db:"understand_status"`
	TechnicalName    string     `db:"technical_name"`
	BusinessName     *string    `db:"business_name"`
	Description      *string    `db:"description"`
	MdlId            string     `db:"mdl_id"` // 统一视图ID
	CreatedAt        time.Time  `db:"created_at"`
	UpdatedAt        time.Time  `db:"updated_at"`
}

// TableName 表名
func (FormView) TableName() string {
	return "form_view"
}
