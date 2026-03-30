package model

import (
	"database/sql"
	"time"

	"github.com/google/uuid"
	utilities "github.com/kweaver-ai/idrm-go-frame/core/utils"
	"gorm.io/gorm"
	"gorm.io/plugin/soft_delete"
)

const TableNameDataProcessingPlan = "data_processing_plan"

// DataAggregationPlan mapped from table <data_aggregation_plan>
type DataProcessingPlan struct {
	DataProcessingPlanID uint64                `gorm:"column:data_processing_plan_id" json:"data_processing_plan_id"`             // 雪花id
	ID                   string                `gorm:"column:id;not null" json:"id"`                                              // 对象id，uuid
	Name                 string                `gorm:"column:name;not null" json:"name"`                                          // 名称
	ResponsibleUID       string                `gorm:"column:responsible_uid;not null" json:"responsible_uid"`                    // 责任人id
	Priority             string                `gorm:"column:priority;not null" json:"priority"`                                  // 优先级
	StartedAt            sql.NullInt64         `gorm:"column:started_at" json:"started_at"`                                       // 开始日期
	FinishedAt           sql.NullInt64         `gorm:"column:finished_at" json:"finished_at"`                                     // 结束日期
	Content              string                `gorm:"column:content;not null" json:"content"`                                    // 计划内容
	Opinion              *string               `gorm:"column:opinion;not null" json:"opinion"`                                    // 申报意见
	AuditStatus          *int                  `gorm:"column:audit_status;not null" json:"audit_status"`                          // 审核状态【1:审核中 2: 已撤销 3：已驳回 4: 通过】
	AuditID              *uint64               `gorm:"column:audit_id" json:"audit_id"`                                           // 审核记录ID
	AuditProcInstID      *string               `gorm:"column:audit_proc_inst_id" json:"audit_proc_inst_id"`                       // 审核实例ID
	AuditResult          *string               `gorm:"column:audit_result" json:"audit_result"`                                   // 审核结果 agree 通过 reject 拒绝 undone 撤销
	RejectReason         *string               `gorm:"column:reject_reason" json:"reject_reason"`                                 // 驳回原因
	CancelReason         *string               `gorm:"column:cancel_reason" json:"cancel_reason"`                                 // 需求撤销原因
	Status               *int                  `gorm:"column:status;not null" json:"status"`                                      // 申报状态【1:待申报  2：已申报】
	CreatedAt            time.Time             `gorm:"column:created_at;not null;default:current_timestamp(3)" json:"created_at"` // 创建时间
	CreatedByUID         string                `gorm:"column:created_by_uid;not null" json:"created_by_uid"`                      // 创建用户ID
	UpdatedAt            time.Time             `gorm:"column:updated_at;autoUpdateTime;not null" json:"updated_at"`               // 更新时间
	UpdatedByUID         string                `gorm:"column:updated_by_uid;not null" json:"updated_by_uid"`                      // 更新用户ID
	DeletedAt            soft_delete.DeletedAt `gorm:"column:deleted_at;not null;softDelete:milli" json:"deleted_at"`             // 删除时间(逻辑删除)
}

func (m *DataProcessingPlan) BeforeCreate(_ *gorm.DB) error {
	if m == nil {
		return nil
	}

	if m.DataProcessingPlanID == 0 {
		m.DataProcessingPlanID, _ = utilities.GetUniqueID()
	}

	if len(m.ID) == 0 {
		m.ID = uuid.NewString()
	}
	return nil
}

// TableName DataProcessingPlan's table name
func (*DataProcessingPlan) TableName() string {
	return TableNameDataProcessingPlan
}
