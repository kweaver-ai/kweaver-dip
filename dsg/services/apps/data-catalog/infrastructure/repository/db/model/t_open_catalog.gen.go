package model

import (
	"time"

	"github.com/kweaver-ai/idrm-go-frame/core/utils"
	"gorm.io/gorm"
)

const TableNameTOpenCatalog = "t_open_catalog"

// TOpenCatalog mapped from table <t_open_catalog>
type TOpenCatalog struct {
	ID           uint64     `gorm:"column:id;primaryKey" json:"id,string"`                                     // 唯一id，雪花算法
	CatalogID    uint64     `gorm:"column:catalog_id;not null" json:"catalog_id,string"`                       // 数据资源目录ID
	OpenType     int8       `gorm:"column:open_type;not null" json:"open_type"`                                // 开放方式 1 无条件开放 2 有条件开放
	OpenLevel    int8       `gorm:"column:open_level" json:"open_level,omitempty"`                             // 开放级别 1 实名认证开放 2 审核开放
	OpenStatus   string     `gorm:"column:open_status;not null;default:notOpen" json:"open_status"`            // 开放状态 未开放 notOpen、已开放 opened
	OpenAt       *time.Time `gorm:"column:open_at" json:"open_at,omitempty"`                                   // 开放时间
	AuditApplySN uint64     `gorm:"column:audit_apply_sn;not null;default:0" json:"audit_apply_sn,string"`     // 发起审核申请序号
	AuditAdvice  string     `gorm:"column:audit_advice" json:"audit_advice,omitempty"`                         // 审核意见，仅驳回时有用
	ProcDefKey   string     `gorm:"column:proc_def_key;not null;default:''" json:"proc_def_key"`               // 审核流程key
	AuditState   int8       `gorm:"column:audit_state" json:"audit_state,omitempty"`                           // 审核状态，0 未审核 1 审核中  2 通过  3 驳回                                                                                                                    // 审核流程key
	FlowApplyId  string     `gorm:"column:flow_apply_id" json:"flow_apply_id"`                                 // 审核流程ID
	FlowNodeID   string     `gorm:"column:flow_node_id" json:"flow_node_id"`                                   // 目录当前所处审核流程结点ID
	FlowNodeName string     `gorm:"column:flow_node_name" json:"flow_node_name"`                               // 目录当前所处审核流程结点名称
	FlowID       string     `gorm:"column:flow_id" json:"flow_id"`                                             // 审批流程实例ID
	FlowName     string     `gorm:"column:flow_name" json:"flow_name"`                                         // 审批流程名称
	FlowVersion  string     `gorm:"column:flow_version" json:"flow_version"`                                   // 审批流程版本
	CreatedAt    time.Time  `gorm:"column:created_at;not null;default:current_timestamp(3)" json:"created_at"` // 创建时间
	CreatorUID   string     `gorm:"column:creator_uid;not null;default:''" json:"creator_uid"`                 // 创建用户ID
	UpdatedAt    time.Time  `gorm:"column:updated_at;autoUpdateTime;not null" json:"updated_at,omitempty"`     // 更新时间
	UpdaterUID   string     `gorm:"column:updater_uid" json:"updater_uid,omitempty"`                           // 更新用户ID
	DeletedAt    *time.Time `gorm:"column:deleted_at" json:"deleted_at,omitempty"`                             // 删除时间
	DeleteUID    string     `gorm:"column:delete_uid" json:"delete_uid,omitempty"`                             // 删除用户ID
}

func (m *TOpenCatalog) UniqueKey() string {
	return "id"
}

func (m *TOpenCatalog) BeforeCreate(_ *gorm.DB) error {
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
		m.UpdatedAt = now
	}
	return err
}

// TableName TOpenCatalog's table name
func (*TOpenCatalog) TableName() string {
	return TableNameTOpenCatalog
}
