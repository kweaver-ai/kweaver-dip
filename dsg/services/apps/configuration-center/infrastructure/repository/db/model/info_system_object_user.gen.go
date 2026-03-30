package model

import (
	"database/sql"
	"time"

	"gorm.io/plugin/soft_delete"
)

type InfoSystemObjectUser struct {
	InfoStstemID      uint64                `gorm:"column:info_ststem_id;primaryKey" json:"info_ststem_id"`         // 信息系统雪花id
	ID                string                `gorm:"column:id;not null" json:"id"`                                   // 信息系统业务id
	Name              string                `gorm:"column:name;not null" json:"name"`                               // 信息系统名称
	Description       sql.NullString        `gorm:"column:description" json:"description"`                          // 信息系统描述
	DepartmentId      string                `gorm:"column:department_id" json:"department_id"`                      // 信息系统部门ID
	IsRegisterGateway sql.NullInt32         `gorm:"column:is_register_gateway;not null" json:"is_register_gateway"` // 是否必填，bool：0：不是；1：是
	AcceptanceAt      sql.NullInt64         `gorm:"column:acceptance_at" json:"acceptance_at"`                      // 验收日期
	CreatedAt         time.Time             `gorm:"column:created_at;not null" json:"created_at"`                   // 创建时间
	CreatedByUID      string                `gorm:"column:created_by_uid;not null" json:"created_by_uid"`           // 创建用户ID
	UpdatedAt         time.Time             `gorm:"column:updated_at;not null;autoUpdateTime" json:"updated_at"`                   // 更新时间
	UpdatedByUID      string                `gorm:"column:updated_by_uid;not null" json:"updated_by_uid"`           // 更新用户ID
	DeletedAt         soft_delete.DeletedAt `gorm:"column:deleted_at;not null" json:"deleted_at"`                   // 删除时间
	DepartmentName    string                `gorm:"column:department_name" json:"department_name"`                  // 部门名称
	DepartmentPath    string                `gorm:"column:department_path" json:"department_path"`                  // 部门路径
	SystemIdentifier  string                `gorm:"column:system_identifier" json:"system_identifier"`              // 系统标识·
	RegisterAt        time.Time             `gorm:"column:register_at;not null" json:"register_at"`                 // 注册时间
	//CreatedUserName string                `gorm:"column:created_user_name" json:"created_user_name"`      // 创建人名称
	UpdatedUserName  string `gorm:"column:updated_user_name" json:"updated_user_name"`   // 更新人名称
	JsDepartmentId   string `json:"js_department_id" gorm:"js_department_id" `           // 建设部门ID
	Status           int    `json:"status" gorm:"status"`                                // 状态1已建、2拟建、3在建
	JsDepartmentName string `gorm:"column:js_department_name" json:"js_department_name"` // 建设部门名称
	JsDepartmentPath string `gorm:"column:js_department_path" json:"js_department_path"` // 建设部门路径
}
