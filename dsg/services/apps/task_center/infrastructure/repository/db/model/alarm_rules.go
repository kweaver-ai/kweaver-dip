package model

import (
	"time"

	"github.com/google/uuid"
)

const TableNameAlarmRule = "t_alarm_rule"

// AlarmRule mapped from table <t_alarm_rule>
//
// 工单，只包含用到的字段。剩下的用到的时候再补充
type AlarmRule struct {
	// 唯一id，雪花算法
	ID int `json:"id,omitempty"`
	// 规则类型
	Type AlarmRuleType `json:"type,omitempty"`
	// 截止告警时间
	DeadlineTime int `json:"deadline_time,omitempty"`
	// 截止告警内容
	DeadlineReminder string `json:"deadline_reminder,omitempty"`
	// 提前告警时间
	BeforehandTime int `json:"beforehand_time,omitempty"`
	// 提前告警内容
	BeforehandReminder string `json:"beforehand_reminder,omitempty"`
	// 更新时间
	UpdatedAt time.Time `json:"updated_at,omitempty"`
	// 更新用户ID
	UpdatedBy uuid.UUID `json:"updated_by,omitempty"`
}

func (m *AlarmRule) TableName() string { return TableNameAlarmRule }

// 规则类型
type AlarmRuleType string

const (
	// 数据质量
	AlarmRuleDataQuality AlarmRuleType = "data_quality"
)
