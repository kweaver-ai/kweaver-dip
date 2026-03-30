package model

import (
	"github.com/kweaver-ai/idrm-go-frame/core/utils"
	"time"

	"gorm.io/gorm"
)

const TableNameTAddressBook = "t_address_book"

// TAddressBook mapped from table <t_address_book>
type TAddressBook struct {
	ID           uint64     `gorm:"column:id;primaryKey" json:"id"`                                 // 唯一id，雪花算法
	Name         string     `gorm:"column:name;not null" json:"name"`                               // 人员名称
	DepartmentID string     `gorm:"column:department_id" json:"department_id"`                      // 所属部门ID
	ContactPhone string     `gorm:"column:contact_phone;not null" json:"contact_phone"`             // 手机号码
	ContactMail  string     `gorm:"column:contact_mail;default:null" json:"contact_mail,omitempty"` // 邮箱地址
	CreatedAt    time.Time  `gorm:"column:created_at;not null" json:"created_at"`                   // 创建时间
	CreatedBy    string     `gorm:"column:created_by;not null" json:"created_by"`                   // 创建用户ID
	UpdatedAt    *time.Time `gorm:"column:updated_at;autoUpdateTime" json:"updated_at"`                            // 更新时间
	UpdatedBy    *string    `gorm:"column:updated_by" json:"updated_by"`                            // 更新用户ID
	DeletedAt    *time.Time `gorm:"column:deleted_at" json:"deleted_at"`                            // 删除时间
	DeletedBy    *string    `gorm:"column:deleted_by" json:"deleted_by"`                            // 删除用户ID
}

func (m *TAddressBook) BeforeCreate(_ *gorm.DB) error {
	if m == nil {
		return nil
	}

	if m.ID == 0 {
		m.ID, _ = utils.GetUniqueID()
	}

	return nil
}

// TableName TAddressBook's table name
func (*TAddressBook) TableName() string {
	return TableNameTAddressBook
}
