package model

import (
	"time"

	"github.com/kweaver-ai/idrm-go-frame/core/utils"
	"gorm.io/gorm"
)

const TableNameTFileResource = "t_file_resource"

// TFileResource mapped from table <t_file_resource>
type TFileResource struct {
	ID            uint64     `gorm:"column:id;primaryKey" json:"id,string"`                                     // 唯一id，雪花算法
	Name          string     `gorm:"column:name;not null" json:"name,string"`                                   // 文件资源名称
	Code          string     `gorm:"column:code;not null" json:"code"`                                          // 文件资源编码
	DepartmentID  string     `gorm:"column:department_id;not null" json:"department_id"`                        // 所属部门ID
	Description   string     `gorm:"column:description" json:"description,omitempty"`                           // 文件资源描述
	PublishStatus string     `gorm:"column:publish_status;not null;default:unpublished" json:"publish_status"`  // 发布状态 未发布 unpublished、已发布 published
	PublishedAt   *time.Time `gorm:"column:published_at" json:"published_at,omitempty"`                         // 发布时间
	AuditApplySN  uint64     `gorm:"column:audit_apply_sn;not null;default:0" json:"audit_apply_sn,string"`     // 发起审核申请序号
	AuditAdvice   string     `gorm:"column:audit_advice" json:"audit_advice,omitempty"`                         // 审核意见，仅驳回时有用
	ProcDefKey    string     `gorm:"column:proc_def_key;not null;default:''" json:"proc_def_key"`               // 审核流程key                                                                                                                  // 审核流程key
	FlowApplyId   string     `gorm:"column:flow_apply_id" json:"flow_apply_id"`                                 // 审核流程ID
	FlowNodeID    string     `gorm:"column:flow_node_id" json:"flow_node_id"`                                   // 目录当前所处审核流程结点ID
	FlowNodeName  string     `gorm:"column:flow_node_name" json:"flow_node_name"`                               // 目录当前所处审核流程结点名称
	FlowID        string     `gorm:"column:flow_id" json:"flow_id"`                                             // 审批流程实例ID
	FlowName      string     `gorm:"column:flow_name" json:"flow_name"`                                         // 审批流程名称
	FlowVersion   string     `gorm:"column:flow_version" json:"flow_version"`                                   // 审批流程版本
	AuditState    int8       `gorm:"column:audit_state" json:"audit_state,omitempty"`                           // 审核状态，0 未审核 1 审核中  2 通过  3 驳回
	CreatedAt     time.Time  `gorm:"column:created_at;not null;default:current_timestamp(3)" json:"created_at"` // 创建时间
	CreatorUID    string     `gorm:"column:creator_uid;not null;default:''" json:"creator_uid"`                 // 创建用户ID
	UpdatedAt     *time.Time `gorm:"column:updated_at;autoUpdateTime" json:"updated_at,omitempty"`              // 更新时间
	UpdaterUID    string     `gorm:"column:updater_uid" json:"updater_uid,omitempty"`                           // 更新用户ID
	DeletedAt     *time.Time `gorm:"column:deleted_at" json:"deleted_at,omitempty"`                             // 删除时间
	DeleterUID    string     `gorm:"column:deleter_uid" json:"deleter_uid,omitempty"`                           // 删除用户ID
}

func (m *TFileResource) UniqueKey() string {
	return "id"
}

func (m *TFileResource) BeforeCreate(_ *gorm.DB) error {
	var err error
	if m == nil {
		return nil
	}

	if m.ID == 0 {
		m.ID, err = utils.GetUniqueID()
	}
	now := time.Now()

	if m.CreatedAt.IsZero() {
		m.CreatedAt = now
	}
	if m.UpdatedAt.IsZero() {
		m.UpdatedAt = &now
	}
	return err
}

// TableName TFileResource's table name
func (*TFileResource) TableName() string {
	return TableNameTFileResource
}
