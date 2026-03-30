package model

import (
	"time"

	"gorm.io/plugin/soft_delete"
)

const TableNameApp = "apps"

// App mapped from table <apps>
type OldApps struct {
	ID                     uint64                `gorm:"column:id;primaryKey" json:"id"`                                            // 雪花id
	AppsId                 string                `gorm:"column:apps_id;not null" json:"apps_id"`                                    // 应用ID
	Name                   string                `gorm:"column:name;not null" json:"name"`                                          // 应用名称
	Description            *string               `gorm:"column:description" json:"description"`                                     // 应用描述
	InfoSystem             *string               `gorm:"column:info_system" json:"info_system"`                                     // 信息系统                                                                                                               // 信息系统id
	ApplicationDeveloperId *string               `gorm:"column:application_developer_id" json:"application_developer_id"`           //应用开发者ID
	AccountID              string                `gorm:"column:account_id;not null" json:"account_id"`                              // 账号ID
	AccountName            string                `gorm:"column:account_name" json:"account_name"`                                   // 账户名称
	ProvinceId             uint64                `gorm:"column:province_id;primaryKey" json:"province_id"`                          // 关联province表
	CreatedAt              time.Time             `gorm:"column:created_at;not null;default:current_timestamp(3)" json:"created_at"` // 创建时间
	CreatorUID             string                `gorm:"column:creator_uid" json:"creator_uid"`                                     // 创建用户ID
	CreatorName            string                `gorm:"column:creator_name" json:"creator_name"`                                   // 创建用户名称
	UpdatedAt              time.Time             `gorm:"column:updated_at;not null;autoUpdateTime" json:"updated_at"` // 更新时间
	UpdaterUID             string                `gorm:"column:updater_uid" json:"updater_uid"`                                     // 更新用户ID
	UpdaterName            string                `gorm:"column:updater_name" json:"updater_name"`                                   // 更新用户名称
	DeletedAt              soft_delete.DeletedAt `gorm:"column:deleted_at;not null;softDelete:milli" json:"deleted_at"`             // 删除时间(逻辑删除)
}

// TableName App's table name
func (*OldApps) TableName() string {
	return TableNameApp
}
