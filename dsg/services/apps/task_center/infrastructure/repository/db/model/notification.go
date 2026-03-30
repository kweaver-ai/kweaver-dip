package model

import (
	"github.com/google/uuid"
)

const TableNameNotifications = "notifications"

// Notification mapped from table <notifications>
type Notification struct {
	Metadata `json:"metadata,omitempty" gorm:"embedded"`
	// 消息通知的内容
	Spec NotificationSpec `json:"spec,omitempty" gorm:"embedded"`
	// 消息通知的状态
	Status NotificationStatus `json:"status,omitempty" gorm:"embedded"`
}

// TableName Notification's table name
func (*Notification) TableName() string { return TableNameNotifications }

// NotificationSpec 代表消息通知的内容
type NotificationSpec struct {
	// 收件人 ID
	RecipientID uuid.UUID `json:"recipient_id,omitempty"`
	// 用户收到这个消息通知的理由，例如：数据质量工单告警
	Reason Reason `json:"reason,omitempty"`
	// 通知的内容
	Message string `json:"message,omitempty"`
	// 工单的 ID，通知的理由是数据质量工单告警时有值
	WorkOrderID uuid.UUID `json:"work_order_id,omitempty"`
	// 同一个工单所发出的通知的索引。用于避免重复发送。0 代表临期告警，1 代表剩
	// 余 1 天的提前告警，n 代表剩余 n 天的提前告警
	WorkOrderAlarmIndex *int `json:"work_order_alarm_index,omitempty"`
}

// 用户收到消息通知的理由，例如：数据质量工单告警
type Reason string

const (
	// 数据质量工单告警
	NotificationReasonDataQualityWorkOrderAlarm Reason = "DataQualityWorkOrderAlarm"
)

// NotificationStatus 代表消息通知的状态
type NotificationStatus struct {
	// 是否已读，为了在过滤条件中区别《未读》和《未指定是否已读》，以及避免 gorm
	// 更新零值的问题，使用指针
	//
	// 想点别的方法解决更新过滤条件和零值问题
	Read *bool `json:"read,omitempty" gorm:"not null"`
}
