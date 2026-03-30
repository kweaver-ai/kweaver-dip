package model

const TableNameViewAuthedUser = "service_authed_users"

// ServiceAuthedUser 视图授权用户关系表
type ServiceAuthedUser struct {
	ID        string `gorm:"column:id" json:"id"`
	ServiceID string `gorm:"column:service_id;not null;comment:接口服务ID" json:"service_id"` // 接口服务ID
	UserID    string `gorm:"column:user_id;not null;comment:用户ID" json:"user_id"`         // 用户ID
}

// TableName ServiceAuthedUser's table name
func (*ServiceAuthedUser) TableName() string {
	return TableNameViewAuthedUser
}
