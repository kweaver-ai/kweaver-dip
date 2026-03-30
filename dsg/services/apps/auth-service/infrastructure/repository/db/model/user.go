package model

const TableNameUser = "user"

// 用户
type User struct {
	// ID
	ID string `json:"id,omitempty"`
	// 显示名称
	Name string `json:"name,omitempty"`
	// 用户状态
	Status UserStatus `json:"status,omitempty"`
}

func (User) TableName() string { return TableNameUser }

// 用户状态
type UserStatus int

const (
	// 正常
	UserNormal UserStatus = 1
	// 已删除
	UserDeleted UserStatus = 2
)
