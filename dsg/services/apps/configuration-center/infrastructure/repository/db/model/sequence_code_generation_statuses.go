package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
	"gorm.io/plugin/soft_delete"

	"github.com/kweaver-ai/idrm-go-frame/core/utils"
)

const TableNameSequenceCodeGenerationStatuses = "sequence_code_generation_statuses"

// SequenceCodeGenerationStatus mapped from table <sequence_code_generation_statuses>
type SequenceCodeGenerationStatus struct {
	SnowflakeID uint64    `gorm:"column:snowflake_id;not null" json:"snowflake_id,omitempty"`
	ID          uuid.UUID `gorm:"column:id;not null" json:"id,omitempty"`

	// 编码生成规则的 ID
	RuleID uuid.UUID `gorm:"column:rule_id;not null" json:"rule_id,omitempty"`
	// 前缀，未启用时为空
	Prefix string `gorm:"column:prefix;not null" json:"prefix,omitempty"`
	// 规则码，未启用时为空
	RuleCode string `gorm:"column:rule_code;not null" json:"rule_code,omitempty"`
	// 编码分隔符，未启用时为空
	CodeSeparator CodeGenerationRuleCodeSeparator `gorm:"column:code_separator;not null" json:"code_separator,omitempty"`
	// 数字码位数
	DigitalCodeWidth int `gorm:"column:digital_code_width;not null" json:"digital_code_width,omitempty"`

	// 数字码
	DigitalCode int `gorm:"column:digital_code;not null" json:"digital_code,omitempty"`

	CreatedAt time.Time             `gorm:"column:created_at;not null" json:"created_at,omitempty"`
	UpdatedAt time.Time             `gorm:"column:updated_at;not null" json:"updated_at,omitempty"`
	DeletedAt soft_delete.DeletedAt `gorm:"column:deleted_at;not null" json:"deleted_at,omitempty"`
}

// TableName SequenceCodeGenerationStatus's table name
func (*SequenceCodeGenerationStatus) TableName() string {
	return TableNameSequenceCodeGenerationStatuses
}

func (s *SequenceCodeGenerationStatus) BeforeCreate(_ *gorm.DB) error {
	if s == nil {
		return nil
	}

	if s.SnowflakeID == 0 {
		id, err := utils.GetUniqueID()
		if err != nil {
			return err
		}
		s.SnowflakeID = id
	}
	if s.ID == uuid.Nil {
		s.ID = uuid.New()
	}

	return nil
}
