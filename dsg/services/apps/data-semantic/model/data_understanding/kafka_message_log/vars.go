// Package kafka_message_log Kafka消息处理记录Model
package kafka_message_log

const (
	// StatusProcessed 处理成功
	StatusProcessed int8 = 1
	// StatusFailed 处理失败
	StatusFailed int8 = 2
)

// Table 表名
const Table = "t_kafka_message_log"
