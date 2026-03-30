package model

import (
	"time"

	utilities "github.com/kweaver-ai/idrm-go-frame/core/utils"
	"gorm.io/gorm"
)

const TableNameTQualityAuditFormViewRelation = "t_quality_audit_form_view_relation"

// TQualityAuditFormViewRelation mapped from table <t_quality_audit_form_view_relation>
type TQualityAuditFormViewRelation struct {
	ID           uint64     `gorm:"column:id" json:"id"`                                                            // 雪花id
	WorkOrderID  string     `gorm:"column:work_order_id;not null" json:"work_order_id"`                             // 工单ID
	FormViewID   string     `gorm:"column:form_view_id;not null" json:"form_view_id"`                               // 逻辑视图ID
	DatasourceID string     `gorm:"column:datasource_id" json:"datasource_id"`                                      // 数据源ID
	Status       int        `gorm:"column:status" json:"status"`                                                    // 视图探查状态
	CreatedByUID string     `gorm:"column:created_by_uid;not null" json:"created_by_uid"`                           // 创建人
	CreatedAt    time.Time  `gorm:"column:created_at;not null" json:"created_at"`                                   // 创建时间
	UpdatedByUID *string    `gorm:"column:updated_by_uid" json:"updated_by_uid"`                                    // 更新人
	UpdatedAt    *time.Time `gorm:"column:updated_at;autoUpdateTime;default:current_timestamp()" json:"updated_at"` // 更新时间
	DeletedByUID *string    `gorm:"column:deleted_by_uid" json:"deleted_by_uid"`                                    // 删除人
	DeletedAt    *time.Time `gorm:"column:deleted_at" json:"deleted_at"`                                            // 删除时间
}

func (m *TQualityAuditFormViewRelation) BeforeCreate(_ *gorm.DB) error {
	if m == nil {
		return nil
	}

	if m.ID == 0 {
		m.ID, _ = utilities.GetUniqueID()
	}

	now := time.Now()
	if m.CreatedAt.IsZero() {
		m.CreatedAt = now
	}
	if m.UpdatedAt == nil {
		m.UpdatedAt = &now
	}
	return nil
}

// TableName TQualityAuditFormViewRelation's table name
func (*TQualityAuditFormViewRelation) TableName() string {
	return TableNameTQualityAuditFormViewRelation
}
