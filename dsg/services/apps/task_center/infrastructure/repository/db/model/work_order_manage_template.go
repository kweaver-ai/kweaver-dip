package model

import (
	"encoding/json"
	"time"

	utilities "github.com/kweaver-ai/idrm-go-frame/core/utils"
	"gorm.io/gorm"
)

const TableNameWorkOrderManageTemplate = "t_work_order_manage_template"

// WorkOrderManageTemplate 工单模板管理表
type WorkOrderManageTemplate struct {
	ID             uint64          `gorm:"column:id;primaryKey" json:"id"`                                                           // 主键ID，雪花算法
	TemplateName   string          `gorm:"column:template_name;not null" json:"template_name"`                                       // 工单模板名称
	TemplateType   string          `gorm:"column:template_type;not null" json:"template_type"`                                       // 工单模板类型
	Description    string          `gorm:"column:description" json:"description"`                                                    // 模板描述
	Content        json.RawMessage `gorm:"column:content;type:json" json:"content"`                                                  // 模板内容（JSON格式）
	Version        int             `gorm:"column:version;not null;default:1" json:"version"`                                         // 版本号
	IsActive       int8            `gorm:"column:is_active;not null;default:1" json:"is_active"`                                     // 是否启用：0-禁用，1-启用
	ReferenceCount int64           `gorm:"column:reference_count;not null;default:0" json:"reference_count"`                         // 引用次数
	CreatedAt      time.Time       `gorm:"column:created_at;not null;default:current_timestamp(3)" json:"created_at"`                // 创建时间
	CreatedBy      string          `gorm:"column:created_by;not null" json:"created_by"`                                             // 创建人ID
	UpdatedAt      time.Time       `gorm:"column:updated_at;autoUpdateTime;not null;default:current_timestamp(3)" json:"updated_at"` // 更新时间
	UpdatedBy      string          `gorm:"column:updated_by;not null" json:"updated_by"`                                             // 更新人ID
	IsDeleted      int8            `gorm:"column:is_deleted;not null;default:0" json:"is_deleted"`                                   // 是否删除：0-否，1-是
}

func (WorkOrderManageTemplate) TableName() string {
	return TableNameWorkOrderManageTemplate
}

func (m *WorkOrderManageTemplate) BeforeCreate(_ *gorm.DB) error {
	if m == nil {
		return nil
	}
	if m.ID == 0 {
		m.ID, _ = utilities.GetUniqueID()
	}
	return nil
}

const TableNameWorkOrderManageTemplateVersion = "t_work_order_manage_template_version"

// WorkOrderManageTemplateVersion 工单模板历史版本表
type WorkOrderManageTemplateVersion struct {
	ID           uint64          `gorm:"column:id;primaryKey" json:"id"`                                            // 主键ID，雪花算法
	TemplateID   uint64          `gorm:"column:template_id;not null" json:"template_id"`                            // 模板ID
	Version      int             `gorm:"column:version;not null" json:"version"`                                    // 版本号
	TemplateName string          `gorm:"column:template_name;not null" json:"template_name"`                        // 工单模板名称
	TemplateType string          `gorm:"column:template_type;not null" json:"template_type"`                        // 工单模板类型
	Description  string          `gorm:"column:description" json:"description"`                                     // 模板描述
	Content      json.RawMessage `gorm:"column:content;type:json" json:"content"`                                   // 模板内容（JSON格式）
	CreatedAt    time.Time       `gorm:"column:created_at;not null;default:current_timestamp(3)" json:"created_at"` // 创建时间
	CreatedBy    string          `gorm:"column:created_by;not null" json:"created_by"`                              // 创建人ID
}

func (WorkOrderManageTemplateVersion) TableName() string {
	return TableNameWorkOrderManageTemplateVersion
}

func (m *WorkOrderManageTemplateVersion) BeforeCreate(_ *gorm.DB) error {
	if m == nil {
		return nil
	}
	if m.ID == 0 {
		m.ID, _ = utilities.GetUniqueID()
	}
	return nil
}
