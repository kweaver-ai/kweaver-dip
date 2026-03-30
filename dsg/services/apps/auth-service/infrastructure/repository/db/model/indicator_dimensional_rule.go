package model

import (
	"encoding/json"
	"time"
)

const TableNameIndicatorDimensionalRules = "indicator_dimensional_rules"

type IndicatorDimensionalRule struct {
	Metadata `json:"metadata,omitempty"`

	Spec IndicatorDimensionalRuleSpec `json:"spec,omitempty" gorm:"embedded"`
}

func (IndicatorDimensionalRule) TableName() string { return TableNameIndicatorDimensionalRules }

type IndicatorDimensionalRuleSpec struct {
	// 名称
	Name string `json:"name,omitempty"`
	// 维度规则所属指标的 ID
	IndicatorID int `json:"indicator_id,omitempty"`
	//上一级的范围ID
	AuthScopeID int `gorm:"column:auth_scope_id"  json:"auth_scope_id"`
	// 授权范围的字段
	ScopeFields json.RawMessage `json:"scope_field,omitempty"`
	// 列、字段列表
	Fields []IndicatorDimensionalRuleFieldSpec `json:"fields,omitempty" gorm:"-"`
	// 行过滤规则
	RowFilters json.RawMessage `json:"row_filters,omitempty"`
	// 行过滤规则
	FixedRowFilters json.RawMessage `json:"fixed_row_filters,omitempty"`
	UpdatedAt       time.Time       `gorm:"column:updated_at;not null;autoUpdateTime;comment:更新时间" json:"updated_at"` // 更新时间
}

type IndicatorDimensionalRuleList List[IndicatorDimensionalRule]

type IndicatorDimensionalRuleListOptions struct {
	ListOptions

	// 返回属于指定指标的指标维度规则
	IndicatorID int
}
