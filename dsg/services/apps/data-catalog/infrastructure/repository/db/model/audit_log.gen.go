package model

import (
	"time"

	"github.com/kweaver-ai/idrm-go-frame/core/utils"
	"gorm.io/gorm"
)

const TableNameAuditLog = "audit_log"

// AuditLog mapped from table <audit_log>
type AuditLog struct {
	ID                uint64    `gorm:"column:id;primaryKey;not null" json:"id"`                                     // 标识
	CatalogID         uint64    `gorm:"column:catalog_id;type:bigint(20);not null" json:"catalog_id"`                // 目录id
	AuditType         string    `gorm:"column:audit_type;type:varchar(255);not null" json:"audit_type"`              // 审核类型
	AuditState        int       `gorm:"column:audit_state;type:int(11);not null" json:"audit_state"`                 // 审核状态
	AuditTime         time.Time `gorm:"column:audit_time;type:datetime(3);not null" json:"audit_time"`               // 审核时间
	AuditResourceType int8      `gorm:"column:audit_resource_type;type:int(11);not null" json:"audit_resource_type"` // 审核的资源类型

}

// TableName TableNameAuditLog's table name
func (*AuditLog) TableName() string {
	return TableNameAuditLog
}

func (m *AuditLog) BeforeCreate(_ *gorm.DB) error {
	var err error
	if m == nil {
		return nil
	}

	if m.ID, err = utils.GetUniqueID(); err != nil {
		return err
	}

	return err
}
