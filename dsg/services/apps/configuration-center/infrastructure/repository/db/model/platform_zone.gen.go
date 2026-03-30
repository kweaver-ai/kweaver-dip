package model

import (
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/errorcode"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/kweaver-ai/idrm-go-frame/core/utils"
	"gorm.io/gorm"
)

const TableNamePlatformZone = "t_platform_zone"

// PlatformZone mapped from table <t_platform_zone>
type PlatformZone struct {
	PlatformZoneID uint64          `gorm:"column:platform_zone_id;primaryKey" json:"platform_zone_id"` // 唯一id，雪花算法
	ID             string          `gorm:"column:id;not null" json:"id"`                               // 对象ID
	Name           string          `json:"name" gorm:"-"`                                              // 非数据库字段
	Description    string          `gorm:"column:description;not null;default:''" json:"description"`  // 运营流程描述说明
	ImageData      string          `gorm:"column:image_data;not null" json:"image_data"`               // 图片二进制base64编码
	SortWeight     int64           `gorm:"column:sort_weight;not null;default:0" json:"-"`             // 排序权重
	Children       []*PlatformZone `json:"children"`                                                   // 子菜单
}

func (m *PlatformZone) BeforeCreate(_ *gorm.DB) error {
	var err error
	if m == nil {
		return nil
	}
	if m.PlatformZoneID == 0 {
		if m.PlatformZoneID, err = utils.GetUniqueID(); err != nil {
			log.Errorf("failed to general unique id, err: %v", err)
			err = errorcode.Desc(errorcode.PublicUniqueIDError)
			return err
		}
	}

	return nil
}

// TableName PlatformZone's table name
func (*PlatformZone) TableName() string {
	return TableNamePlatformZone
}

const TableNamePlatformZoneHistoryRecord = "t_platform_zone_history_record"

// PlatformZoneHistoryRecord mapped from table <t_platform_zone_history_record>
type PlatformZoneHistoryRecord struct {
	PlatformZoneID uint64 `gorm:"column:platform_zone_history_record_id;primaryKey" json:"platform_zone_history_record_id"` // 唯一id，雪花算法
	ID             string `gorm:"column:id;not null" json:"id"`                                                             // 对象ID
	Name           string `json:"name" gorm:"-"`                                                                            // 非数据库字段
	UpdatedAt      string `gorm:"column:updated_at;not null;autoUpdateTime" json:"updated_at"`                              // 更新时间
	UpdatedBy      string `gorm:"column:updated_by" json:"updated_by"`                                                      // 更新用户ID
}

// TableName PlatformZoneHistoryRecord's table name
func (*PlatformZoneHistoryRecord) TableName() string {
	return TableNamePlatformZoneHistoryRecord
}

func (m *PlatformZoneHistoryRecord) BeforeCreate(_ *gorm.DB) error {
	var err error
	if m == nil {
		return nil
	}
	if m.PlatformZoneID == 0 {
		if m.PlatformZoneID, err = utils.GetUniqueID(); err != nil {
			log.Errorf("failed to general unique id, err: %v", err)
			err = errorcode.Desc(errorcode.PublicUniqueIDError)
			return err
		}
	}

	return nil
}

const TableNamePlatformService = "t_platform_service"

// PlatformService mapped from table <t_platform_service>
type PlatformService struct {
	PlatformZoneServiceID uint64 `gorm:"column:platform_zone_service_id;primaryKey" json:"platform_zone_service_id"` // 唯一id，雪花算法
	ID                    string `gorm:"column:id;not null" json:"id"`                                               // 对象ID
	Name                  string `gorm:"column:name;not null" json:"name"`                                           // 运营流程描述说明
	Description           string `gorm:"column:description;not null;default:''" json:"description"`                  // 运营流程描述说明
	URL                   string `gorm:"column:url;not null" json:"url"`                                             // 运营流程描述说明
	ImageData             string `gorm:"column:image_data;not null" json:"image_data"`                               // 图片二进制base64编码
	IsEnabled             bool   `gorm:"column:is_enabled;not null" json:"is_enabled"`                               // 是否启用
	SortWeight            int64  `gorm:"column:sort_weight;not null;default:0" json:"-"`                             // 排序权重
}

// TableName PlatformService's table name
func (*PlatformService) TableName() string {
	return TableNamePlatformService
}

func (m *PlatformService) BeforeCreate(_ *gorm.DB) error {
	var err error
	if m == nil {
		return nil
	}
	if m.PlatformZoneServiceID == 0 {
		if m.PlatformZoneServiceID, err = utils.GetUniqueID(); err != nil {
			log.Errorf("failed to general unique id, err: %v", err)
			err = errorcode.Desc(errorcode.PublicUniqueIDError)
			return err
		}
	}

	return nil
}
