package model

import "time"

const TableNameIndicatorDimensionalRuleFields = "indicator_dimensional_rule_fields"

// 指标维度规则的字段
type IndicatorDimensionalRuleField struct {
	Metadata `json:"metadata,omitempty"`

	// 所属指标维度规则的 ID
	RuleID string `json:"rule_id,omitempty"`

	Spec IndicatorDimensionalRuleFieldSpec `json:"spec,omitempty" gorm:"embedded"`
}

type IndicatorDimensionalRuleFieldSpec struct {
	// 字段 ID
	FieldID string `json:"field_id,omitempty"`
	// 字段名称，不确定如何根据字段 ID 查询名称，所以冗余记录
	Name string `json:"name,omitempty"`
	// 字段英文名称，同 name
	NameEn string `json:"name_en,omitempty"`
	// 字段数据类型，同 name
	DataType  string    `json:"data_type,omitempty"`
	UpdatedAt time.Time `gorm:"column:updated_at;not null;autoUpdateTime;comment:更新时间" json:"updated_at"` // 更新时间
}

func (IndicatorDimensionalRuleField) TableName() string {
	return TableNameIndicatorDimensionalRuleFields
}
