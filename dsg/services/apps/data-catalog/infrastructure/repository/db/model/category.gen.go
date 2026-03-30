package model

import (
	"time"

	"github.com/kweaver-ai/idrm-go-frame/core/utils"
	"gorm.io/gorm"
	"gorm.io/plugin/soft_delete"
)

const TableNameCategory = "category"

// Category mapped from table <category>
type Category struct {
	ID          uint64                `gorm:"column:id;primaryKey" json:"id"`                                   // 唯一id，雪花算法
	CategoryID  string                `gorm:"column:category_id" json:"category_id"`                            // 类目ID
	Name        string                `gorm:"column:name;not null" json:"name"`                                 // 类目名称
	Using       int                   `gorm:"column:using" json:"using"`                                        // 是否启用类目，bool：0：不是；1：是
	Type        string                `gorm:"column:type" json:"type"`                                          // 类目的类型：系统、自定义
	Required    int                   `gorm:"column:required" json:"required"`                                  // 是否必选类目，bool：0：不是；1：是
	Description string                `gorm:"column:description" json:"description"`                            // 类目描述
	SortWeight  uint64                `gorm:"column:sort_weight;not null" json:"sort_weight"`                   // 排序权重
	CreatedAt   time.Time             `gorm:"column:created_at;default:current_timestamp(3)" json:"created_at"` // 创建时间
	CreatorUID  string                `gorm:"column:creator_uid" json:"creator_uid"`                            // 创建用户ID
	CreatorName string                `gorm:"column:creator_name" json:"creator_name"`                          // 创建用户名称
	UpdatedAt   time.Time             `gorm:"column:updated_at;default:current_timestamp()" json:"updated_at"`  // 更新时间
	UpdaterUID  string                `gorm:"column:updater_uid" json:"updater_uid"`                            // 更新用户ID
	UpdaterName string                `gorm:"column:updater_name" json:"updater_name"`                          // 更新用户名称
	DeletedAt   soft_delete.DeletedAt `gorm:"column:deleted_at;not null;softDelete:milli" json:"deleted_at"`    // 删除时间(逻辑删除)
	DeleterUID  string                `gorm:"column:deleter_uid" json:"deleter_uid"`                            // 删除用户ID
	DeleterName string                `gorm:"column:deleter_name" json:"deleter_name"`                          // 删除用户名称
}

func (m *Category) BeforeCreate(_ *gorm.DB) error {
	var err error
	if m == nil {
		return nil
	}

	if m.ID == 0 {
		m.ID, err = utils.GetUniqueID()
	}

	return err
}

// TableName Category's table name
func (*Category) TableName() string {
	return TableNameCategory
}
