package model

import (
	"time"

	"github.com/kweaver-ai/idrm-go-frame/core/utils"
	"gorm.io/gorm"
)

const TableNameCategoryModuleConfig = "category_module_config"

type CategoryModuleConfig struct {
	ID          uint64    `gorm:"column:id;primaryKey" json:"id"`
	CategoryID  string    `gorm:"column:category_id;not null" json:"category_id"`
	ModuleCode  string    `gorm:"column:module_code;not null" json:"module_code"`
	Selected    int       `gorm:"column:selected;not null" json:"selected"`
	Required    int       `gorm:"column:required;not null" json:"required"`
	CreatedAt   time.Time `gorm:"column:created_at;not null;default:current_timestamp(3)" json:"created_at"`
	CreatorUID  string    `gorm:"column:creator_uid" json:"creator_uid"`
	CreatorName string    `gorm:"column:creator_name" json:"creator_name"`
	UpdatedAt   time.Time `gorm:"column:updated_at;not null;autoUpdateTime" json:"updated_at"`
	UpdaterUID  string    `gorm:"column:updater_uid" json:"updater_uid"`
	UpdaterName string    `gorm:"column:updater_name" json:"updater_name"`
}

func (m *CategoryModuleConfig) BeforeCreate(_ *gorm.DB) error {
	var err error
	if m == nil {
		return nil
	}
	if m.ID == 0 {
		m.ID, err = utils.GetUniqueID()
	}
	return err
}

func (*CategoryModuleConfig) TableName() string {
	return TableNameCategoryModuleConfig
}
