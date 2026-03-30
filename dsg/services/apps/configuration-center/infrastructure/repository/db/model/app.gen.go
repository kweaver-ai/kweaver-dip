package model

import (
	"time"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/util"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/kweaver-ai/idrm-go-frame/core/utils"
	"gorm.io/gorm"
	"gorm.io/plugin/soft_delete"
)

const TableNameApps = "app"

type AllApp struct {
	Apps
	AppsHistory
}

// App mapped from table <apps>
type Apps struct {
	ID                       uint64                `gorm:"column:id;primaryKey" json:"id"`                                            // 雪花id
	AppsID                   string                `gorm:"column:apps_id;not null" json:"apps_id"`                                    // 授权管理ID
	PublishedVersionID       uint64                `gorm:"column:published_version_id" json:"published_version_id"`                   // 已发布版本
	EditingVersionID         *uint64               `gorm:"column:editing_version_id" json:"editing_version_id"`                       // 当前编辑版本
	ReportPublishedVersionID uint64                `gorm:"column:report_published_version_id" json:"report_published_version_id"`     // 已发布版本
	ReportEditingVersionID   *uint64               `gorm:"column:report_editing_version_id" json:"report_editing_version_id"`         // 当前编辑版本
	Mark                     string                `gorm:"column:mark" json:"makr"`                                                   // 应用标识
	CreatedAt                time.Time             `gorm:"column:created_at;not null;default:current_timestamp(3)" json:"created_at"` // 创建时间
	CreatorUID               string                `gorm:"column:creator_uid;not null" json:"creator_uid"`                            // 创建用户ID
	CreatorName              string                `gorm:"column:creator_name" json:"creator_name"`                                   // 创建用户名称
	UpdatedAt                time.Time             `gorm:"column:updated_at;not null;autoUpdateTime" json:"updated_at"`               // 更新时间
	UpdaterUID               string                `gorm:"column:updater_uid;not null" json:"updater_uid"`                            // 更新用户ID
	UpdaterName              string                `gorm:"column:updater_name" json:"updater_name"`                                   // 更新用户名称
	DeletedAt                soft_delete.DeletedAt `gorm:"column:deleted_at;not null;softDelete:milli" json:"deleted_at"`             // 删除时间(逻辑删除)
}

func (m *Apps) BeforeCreate(_ *gorm.DB) error {
	var err error
	if m == nil {
		return nil
	}
	if m.ID == 0 {
		if m.ID, err = utils.GetUniqueID(); err != nil {
			log.Errorf("failed to general unique id, err: %v", err)
			err = errorcode.Desc(errorcode.PublicUniqueIDError)
			return err
		}
	}

	if len(m.AppsID) == 0 {
		m.AppsID = util.NewUUID()
	}

	return nil
}

// TableName App's table name
func (*Apps) TableName() string {
	return TableNameApps
}
