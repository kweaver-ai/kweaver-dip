// Package kafka_message_log Kafka消息处理记录Model
package kafka_message_log

import "context"

// KafkaMessageLogModel Kafka消息处理记录Model接口
type KafkaMessageLogModel interface {
	// Insert 插入Kafka消息处理记录
	Insert(ctx context.Context, data *KafkaMessageLog) (*KafkaMessageLog, error)

	// FindOneByMessageId 根据消息ID查询记录
	FindOneByMessageId(ctx context.Context, messageId string) (*KafkaMessageLog, error)

	// Update 更新处理状态
	Update(ctx context.Context, data *KafkaMessageLog) error

	// WithTx 设置事务
	WithTx(tx interface{}) KafkaMessageLogModel
}
