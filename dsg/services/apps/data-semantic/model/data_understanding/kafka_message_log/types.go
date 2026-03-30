// Package kafka_message_log Kafka消息处理记录Model
package kafka_message_log

import (
	"time"
)

// KafkaMessageLog Kafka消息处理记录表结构
type KafkaMessageLog struct {
	Id          string    `db:"id"`
	MessageId   string    `db:"message_id"`
	FormViewId  string    `db:"form_view_id"`
	ProcessedAt time.Time `db:"processed_at"`
	Status      int8      `db:"status"` // 1-处理成功，2-处理失败
	ErrorMsg    *string   `db:"error_msg"`
}

// TableName 表名
func (KafkaMessageLog) TableName() string {
	return "t_kafka_message_log"
}
