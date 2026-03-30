package model

import (
	"time"

	"github.com/google/uuid"
	utilities "github.com/kweaver-ai/idrm-go-frame/core/utils"
	"gorm.io/gorm"
)

const TableNameDataResearchReport = "data_research_report"
const TableNameDataResearchReportChangeAudit = "data_research_report_change_audit"

// DataResearchReport mapped from table <data_research_report>
type DataResearchReport struct {
	DataResearchReportID uint64    `gorm:"column:data_research_report_id" json:"-"`                                   // 雪花id
	ID                   string    `gorm:"column:id;not null" json:"id"`                                              // 对象id，uuid
	Name                 string    `gorm:"column:name;not null" json:"name"`                                          // 名称
	WorkOrderID          string    `gorm:"column:work_order_id;not null" json:"work_order_id"`                        // 关联数据归集计划ID
	ResearchPurpose      string    `gorm:"column:research_purpose;not null" json:"research_purpose"`                  // 调研目的
	ResearchObject       string    `gorm:"column:research_object;not null" json:"research_object"`                    // 调研对象
	ResearchMethod       string    `gorm:"column:research_method;not null" json:"research_method"`                    // 调研方法
	ResearchContent      string    `gorm:"column:research_content;not null" json:"research_content"`                  // 调研内容
	ResearchConclusion   string    `gorm:"column:research_conclusion;not null" json:"research_conclusion"`            // 调研结论
	Remark               *string   `gorm:"column:remark" json:"remark"`                                               // 申报意见
	AuditStatus          *int      `gorm:"column:audit_status"`                                                       // 审核状态【1：审核中  2: 撤回  3: 拒绝 4: 通过 5:变更审核中 6:变更审核拒绝】
	AuditID              *uint64   `gorm:"column:audit_id" json:"audit_id"`                                           // 审核记录ID
	AuditProcInstID      *string   `gorm:"column:audit_proc_inst_id" json:"audit_proc_inst_id"`                       // 审核实例ID
	AuditResult          *string   `gorm:"column:audit_result" json:"audit_result"`                                   // 审核结果 agree 通过 reject 拒绝 undone 撤销
	RejectReason         *string   `gorm:"column:reject_reason" json:"reject_reason"`                                 // 驳回原因
	CancelReason         *string   `gorm:"column:cancel_reason" json:"cancel_reason"`                                 // 需求撤销原因
	DeclarationStatus    *int      `gorm:"column:declaration_status;not null"`                                        // 申报状态【1:待申报  2：已申报】
	CreatedAt            time.Time `gorm:"column:created_at;not null;default:current_timestamp(3)" json:"created_at"` // 创建时间
	CreatedByUID         string    `gorm:"column:created_by_uid;not null" json:"created_by_uid"`                      // 创建用户ID
	UpdatedAt            time.Time `gorm:"column:updated_at;autoUpdateTime;not null" json:"updated_at"`               // 更新时间
	UpdatedByUID         string    `gorm:"column:updated_by_uid;not null" json:"updated_by_uid"`                      // 更新用户ID
	DeletedAt            int64     `gorm:"column:deleted_at;not null;softDelete:milli" json:"-"`                      // 删除时间(逻辑删除)
}

func (m *DataResearchReport) BeforeCreate(_ *gorm.DB) error {
	if m == nil {
		return nil
	}

	if m.DataResearchReportID == 0 {
		m.DataResearchReportID, _ = utilities.GetUniqueID()
	}

	if len(m.ID) == 0 {
		m.ID = uuid.NewString()
	}

	return nil
}

// TableName DataResearchReport's table name
func (*DataResearchReport) TableName() string {
	return TableNameDataResearchReport
}

type DataResearchReportObject struct {
	DataResearchReport
	WorkOrderName     string `gorm:"column:work_order_name" json:"work_order_name"`
	UpdatedByUserName string `gorm:"column:updated_by_user_name" json:"updated_by_user_name"`
	CreatedByUserName string `gorm:"column:created_by_user_name" json:"created_by_user_name"`
}

// DataResearchReportChangeAudit represents a data research report change audit record
type DataResearchReportChangeAudit struct {
	DataResearchReportID uint64    `gorm:"column:data_research_report_id" json:"-"`                                   // 雪花id
	ID                   string    `gorm:"column:id;not null" json:"id"`                                              // 对象id，uuid
	WorkOrderID          string    `gorm:"column:work_order_id;not null" json:"work_order_id"`                        // 关联数据归集计划ID
	ResearchPurpose      string    `gorm:"column:research_purpose;not null" json:"research_purpose"`                  // 调研目的
	ResearchObject       string    `gorm:"column:research_object;not null" json:"research_object"`                    // 调研对象
	ResearchMethod       string    `gorm:"column:research_method;not null" json:"research_method"`                    // 调研方法
	ResearchContent      string    `gorm:"column:research_content;not null" json:"research_content"`                  // 调研内容
	ResearchConclusion   string    `gorm:"column:research_conclusion;not null" json:"research_conclusion"`            // 调研结论
	Remark               string    `gorm:"column:remark;not null" json:"remark"`                                      // 申报意见
	CreatedAt            time.Time `gorm:"column:created_at;not null;default:current_timestamp(3)" json:"created_at"` // 创建时间
	CreatedByUID         string    `gorm:"column:created_by_uid;not null" json:"created_by_uid"`                      // 创建用户ID
	UpdatedAt            time.Time `gorm:"column:updated_at;autoUpdateTime;not null" json:"updated_at"`               // 更新时间
	UpdatedByUID         string    `gorm:"column:updated_by_uid;not null" json:"updated_by_uid"`                      // 更新用户ID
	DeletedAt            int64     `gorm:"column:deleted_at;not null" json:"-"`                                       // 删除时间
}

func (m *DataResearchReportChangeAudit) BeforeCreate(_ *gorm.DB) error {
	if m == nil {
		return nil
	}

	if m.DataResearchReportID == 0 {
		m.DataResearchReportID, _ = utilities.GetUniqueID()
	}

	if len(m.ID) == 0 {
		m.ID = uuid.NewString()
	}

	return nil
}

// TableName DataResearchReportChangeAudit's table name
func (*DataResearchReportChangeAudit) TableName() string {
	return TableNameDataResearchReportChangeAudit
}

type DataResearchReportChangeAuditObject struct {
	DataResearchReportChangeAudit
	WorkOrderName     string `gorm:"column:work_order_name" json:"work_order_name"`
	UpdatedByUserName string `gorm:"column:updated_by_user_name" json:"updated_by_user_name"`
	CreatedByUserName string `gorm:"column:created_by_user_name" json:"created_by_user_name"`
}
