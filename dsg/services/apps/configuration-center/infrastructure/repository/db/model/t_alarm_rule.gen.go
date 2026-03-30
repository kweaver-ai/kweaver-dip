package model

import (
	"github.com/google/uuid"
	"gorm.io/gorm"
	"time"
)

const TableNameTAlarmRule = "t_alarm_rule"

// TAlarmRule mapped from table <t_alarm_rule>
type TAlarmRule struct {
	ID                 int64      `gorm:"column:id;primaryKey" json:"id"`                                 // 唯一id, 雪花算法
	Type               string     `gorm:"column:type;not null;unique" json:"type"`                        // 规则类型
	DeadlineTime       int64      `gorm:"column:deadline_time;not null" json:"deadline_time"`             // 截止告警时间
	DeadlineReminder   string     `gorm:"column:deadline_reminder;not null" json:"deadline_reminder"`     // 截止告警内容
	BeforehandTime     int64      `gorm:"column:beforehand_time;not null" json:"beforehand_time"`         // 提前告警时间
	BeforehandReminder string     `gorm:"column:beforehand_reminder;not null" json:"beforehand_reminder"` // 提前告警内容
	UpdatedAt          *time.Time `gorm:"column:updated_at;autoUpdateTime" json:"updated_at"`                            // 更新时间
	UpdatedBy          *string    `gorm:"column:updated_by" json:"updated_by"`                            // 更新用户ID
}

// TableName TAlarmRule's table name
func (*TAlarmRule) TableName() string {
	return TableNameTAlarmRule
}

func (m *TAlarmRule) BeforeCreate(tx *gorm.DB) error {
	if m.ID == 0 {
		m.ID = int64(uuid.New().ID())
	}
	return nil
}
