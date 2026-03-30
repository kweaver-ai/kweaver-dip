package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
	"gorm.io/plugin/soft_delete"

	"github.com/kweaver-ai/idrm-go-frame/core/utils"
)

const TableNameCodeGenerationRule = "code_generation_rules"

// CodeGenerationRule mapped from table <code_generation_rules>
type CodeGenerationRule struct {
	SnowflakeID uint64    `gorm:"column:snowflake_id;not null" json:"snowflakeID,omitempty"`
	ID          uuid.UUID `gorm:"column:id;not null" json:"id,omitempty"`
	Name        string    `gorm:"name:not null" json:"name,omitempty"`

	CodeGenerationRuleSpec   `gorm:"embedded" json:",inline"`
	CodeGenerationRuleStatus `gorm:"embedded" json:",inline"`
}

type CodeGenerationRuleSpec struct {
	// 类型，表示编码生成规则适用于哪一种数据资产
	Type CodeGenerationRuleType `gorm:"column:type;not null" json:"type"`
	// 前缀，支持 2-6 个大写字母
	Prefix string `gorm:"column:prefix;not null" json:"prefix"`
	// 是否启用前缀
	PrefixEnabled bool `gorm:"column:prefix_enabled;not null" json:"prefix_enabled"`
	// 规则码
	RuleCode CodeGenerationRuleRuleCode `gorm:"column:rule_code;not null" json:"rule_code"`
	// 是否启用规则码
	RuleCodeEnabled bool `gorm:"column:rule_code_enabled;not null" json:"rule_code_enabled"`
	// 编码分隔符
	CodeSeparator CodeGenerationRuleCodeSeparator `gorm:"column:code_separator;not null;" json:"code_separator"`
	// 是否启用编码分隔符
	CodeSeparatorEnabled bool `gorm:"column:code_separator_enabled;not null" json:"code_separator_enabled"`
	// 数字码类型
	DigitalCodeType CodeGenerationRuleDigitalCodeType `gorm:"column:digital_code_type;not null" json:"digital_code_type"`
	// 数字码位数
	DigitalCodeWidth int `gorm:"column:digital_code_width;not null;" json:"digital_code_width"`
	// 数字码起始值
	DigitalCodeStarting int `gorm:"column:digital_code_starting;not null" json:"digital_code_starting"`
	// 数字码终止值
	DigitalCodeEnding int `gorm:"column:digital_code_ending;not null" json:"digital_code_ending"`
}

type CodeGenerationRuleStatus struct {
	UpdaterID uuid.UUID `gorm:"column:updater_id;not null" json:"updater_id"`

	CreatedAt time.Time             `gorm:"column:created_at;not null" json:"created_at,omitempty"`
	UpdatedAt time.Time             `gorm:"column:updated_at;not null" json:"updated_at,omitempty"`
	DeletedAt soft_delete.DeletedAt `gorm:"column:deleted_at;not null" json:"deleted_at,omitempty"`
}

// TableName CodeGenerationRule's table name
func (*CodeGenerationRule) TableName() string {
	return TableNameCodeGenerationRule
}

func (s *CodeGenerationRule) BeforeCreate(_ *gorm.DB) error {
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

type CodeGenerationRuleType string // 编码生成规则的类型，表示编码生成规则适用于哪一种数据资产

const (
	CodeGenerationRuleTypeDataView          CodeGenerationRuleType = "DataView"          // 逻辑视图
	CodeGenerationRuleTypeDataCatalog       CodeGenerationRuleType = "DataCatalog"       // 数据资源目录
	CodeGenerationRuleTypeInfoCatalog       CodeGenerationRuleType = "InfoCatalog"       // 信息资源目录
	CodeGenerationRuleTypeDimensionalModel  CodeGenerationRuleType = "DimensionalModel"  // 维度模型
	CodeGenerationRuleTypeIndicator         CodeGenerationRuleType = "Indicator"         // 指标
	CodeGenerationRuleTypeApi               CodeGenerationRuleType = "Api"               // 接口
	CodeGenerationRuleTypeLogicalEntity     CodeGenerationRuleType = "LogicalEntity"     // 逻辑模型
	CodeGenerationRuleTypeDataRequirement   CodeGenerationRuleType = "DataRequirement"   // 需求
	CodeGenerationRuleTypeApplication       CodeGenerationRuleType = "Application"       // 共享申请
	CodeGenerationRuleTypeFileResource      CodeGenerationRuleType = "FileResource"      // 文件资源
	CodeGenerationRuleTypeTenantApplication CodeGenerationRuleType = "TenantApplication" // 租户申请
)

type CodeGenerationRuleRuleCode string

const (
	CodeGenerationRuleRuleCodeYYYYMMDD CodeGenerationRuleRuleCode = "YYYYMMDD"
)

type CodeGenerationRuleCodeSeparator string // 编码生成规则的分隔符

const (
	CodeGenerationRuleCodeSeparatorUnderscore CodeGenerationRuleCodeSeparator = `_` // 下划线
	CodeGenerationRuleCodeSeparatorHyphen     CodeGenerationRuleCodeSeparator = `-` // 中划线
	CodeGenerationRuleCodeSeparatorSlash      CodeGenerationRuleCodeSeparator = `/` // 正斜杠
	CodeGenerationRuleCodeSeparatorBackslash  CodeGenerationRuleCodeSeparator = `\` // 反斜杠
)

type CodeGenerationRuleDigitalCodeType string // 编码生成规则的数字码类型

const (
	CodeGenerationRuleDigitalCodeTypeSequence CodeGenerationRuleDigitalCodeType = "Sequence" // 顺序码
)
