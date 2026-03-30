package model

import (
	"github.com/kweaver-ai/idrm-go-frame/core/utils"
	"gorm.io/gorm"
	"time"
)

const TableNameTObjectMainBusiness = "t_object_main_business"

// TObjectMainBusiness mapped from table <t_object_main_business>
type TObjectMainBusiness struct {
	ID               uint64     `gorm:"column:id;primaryKey" json:"id"`                             // 唯一id，雪花算法
	ObjectId         string     `gorm:"column:object_id;not null" json:"object_id"`                 // 对象ID
	Name             string     `gorm:"column:name;not null" json:"name"`                           // 主干业务名称
	AbbreviationName string     `gorm:"column:abbreviation_name;not null" json:"abbreviation_name"` // 主干业务简称
	CreatedAt        time.Time  `gorm:"column:created_at;not null" json:"created_at"`               // 创建时间
	CreatedBy        string     `gorm:"column:created_by;not null" json:"created_by"`               // 创建用户ID
	UpdatedAt        *time.Time `gorm:"column:updated_at;autoUpdateTime" json:"updated_at"`                        // 更新时间
	UpdatedBy        *string    `gorm:"column:updated_by" json:"updated_by"`                        // 更新用户ID
	DeletedAt        *time.Time `gorm:"column:deleted_at" json:"deleted_at"`                        // 删除时间
	DeletedBy        *string    `gorm:"column:deleted_by" json:"deleted_by"`                        // 删除用户ID
}

func (m *TObjectMainBusiness) BeforeCreate(_ *gorm.DB) error {
	if m == nil {
		return nil
	}

	if m.ID == 0 {
		m.ID, _ = utils.GetUniqueID()
	}

	return nil
}

func (m *TObjectMainBusiness) UniqueKey() string {
	return "id"
}

// TableName TObjectMainBusiness's table name
func (*TObjectMainBusiness) TableName() string {
	return TableNameTObjectMainBusiness
}
