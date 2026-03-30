package model

import (
	"time"

	"github.com/google/uuid"
)

const TableNameWorkOrderAlarms = "work_order_alarms"

// WorkOrderAlarm mapped from table <work_order_alarms>
type WorkOrderAlarm struct {
	Metadata `json:"metadata,omitempty" gorm:"embedded"`
	// 工单告警的内容
	Spec WorkOrderAlarmSpec `json:"spec,omitempty" gorm:"embedded"`
	// 工单告警的状态
	Status WorkOrderAlarmStatus `json:"status,omitempty" gorm:"embedded"`
}

// 工单告警的内容
type WorkOrderAlarmSpec struct {
	// 工单 ID
	WorkOrderID uuid.UUID `json:"work_order_id,omitempty"`
	// 工单截止日期
	Deadline time.Time `json:"deadline,omitempty"`
}

// 工单告警的状态
type WorkOrderAlarmStatus struct {
	// 上一次发送用户通知的时间，nil 代表尚未发送
	LastNotifiedAt *time.Time `json:"last_notified_at,omitempty"`
}

func (m *WorkOrderAlarm) TableName() string { return TableNameWorkOrderAlarms }
