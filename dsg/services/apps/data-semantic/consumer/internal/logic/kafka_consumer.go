// Package logic Kafka消费者逻辑
package logic

import (
	"context"
	"fmt"
	"time"

	"github.com/IBM/sarama"
	"github.com/zeromicro/go-zero/core/logx"
)

const maxRetries = 3

// KafkaConsumer Kafka消费者结构
type KafkaConsumer struct {
	consumer sarama.ConsumerGroup
	handlers map[string]MessageHandler
}

// MessageHandler 消息处理接口
type MessageHandler interface {
	Handle(ctx context.Context, message *sarama.ConsumerMessage) error
}

// NewKafkaConsumer 创建Kafka消费者
func NewKafkaConsumer(brokers []string, groupID string) (*KafkaConsumer, error) {
	return NewKafkaConsumerWithAuth(brokers, groupID, "", "")
}

// NewKafkaConsumerWithAuth 创建带认证的Kafka消费者
func NewKafkaConsumerWithAuth(brokers []string, groupID string, username, password string) (*KafkaConsumer, error) {
	config := sarama.NewConfig()
	config.Consumer.Return.Errors = true
	config.Consumer.Group.Rebalance.Strategy = sarama.NewBalanceStrategyRoundRobin()
	config.Consumer.Offsets.Initial = sarama.OffsetOldest

	config.Consumer.Retry.Backoff = 3 * time.Second

	config.Consumer.Group.Session.Timeout = 30 * time.Second
	config.Consumer.Group.Heartbeat.Interval = 3 * time.Second
	config.Consumer.MaxProcessingTime = 30 * time.Second

	if username != "" && password != "" {
		config.Net.SASL.Enable = true
		config.Net.SASL.Mechanism = sarama.SASLTypePlaintext
		config.Net.SASL.User = username
		config.Net.SASL.Password = password
	}

	consumer, err := sarama.NewConsumerGroup(brokers, groupID, config)
	if err != nil {
		return nil, fmt.Errorf("创建消费者失败: %w", err)
	}

	kafkaConsumer := &KafkaConsumer{
		consumer: consumer,
		handlers: make(map[string]MessageHandler),
	}

	return kafkaConsumer, nil
}

// RegisterHandler 注册消息处理器
func (kc *KafkaConsumer) RegisterHandler(topic string, handler MessageHandler) {
	kc.handlers[topic] = handler
}

// Start 启动消费者（在循环中调用 Consume，rebalance 后自动恢复）
func (kc *KafkaConsumer) Start(ctx context.Context) error {
	topics := make([]string, 0, len(kc.handlers))
	for topic := range kc.handlers {
		topics = append(topics, topic)
	}

	logx.Infof("启动Kafka消费者，订阅主题: %v", topics)

	// Consume 在 rebalance 后会返回，需要在循环中重新调用
	for {
		if err := kc.consumer.Consume(ctx, topics, kc); err != nil {
			if ctx.Err() != nil {
				return ctx.Err()
			}
			logx.Errorf("Kafka消费异常，准备重新连接: %v", err)
		}
		if ctx.Err() != nil {
			return ctx.Err()
		}
		logx.Info("Kafka消费者 rebalance，准备重新加入消费者组...")
	}
}

// Close 关闭消费者组，释放资源
func (kc *KafkaConsumer) Close() error {
	return kc.consumer.Close()
}

// Errors 返回消费者错误通道
func (kc *KafkaConsumer) Errors() <-chan error {
	return kc.consumer.Errors()
}

// Setup 会话开始时调用
func (kc *KafkaConsumer) Setup(sarama.ConsumerGroupSession) error {
	logx.Info("Kafka消费者会话开始")
	return nil
}

// Cleanup 会话结束时调用
func (kc *KafkaConsumer) Cleanup(sarama.ConsumerGroupSession) error {
	logx.Info("Kafka消费者会话结束")
	return nil
}

// ConsumeClaim 消费消息 (必须实现 ConsumerGroupHandler 接口)
func (kc *KafkaConsumer) ConsumeClaim(session sarama.ConsumerGroupSession, claim sarama.ConsumerGroupClaim) error {
	for msg := range claim.Messages() {
		topic := msg.Topic
		handler, ok := kc.handlers[topic]
		if !ok {
			logx.Errorf("未找到topic处理器，跳过消息: topic=%s partition=%d offset=%d key=%s",
				topic, msg.Partition, msg.Offset, string(msg.Key))
			session.MarkMessage(msg, "")
			continue
		}

		// 有限次重试，失败后标记消息避免阻塞后续消费
		if err := kc.handleWithRetry(session.Context(), handler, msg); err != nil {
			logx.Errorf("消息处理最终失败（已重试%d次），标记跳过: topic=%s partition=%d offset=%d error=%v",
				maxRetries, topic, msg.Partition, msg.Offset, err)
		}

		session.MarkMessage(msg, "")
	}

	return nil
}

func (kc *KafkaConsumer) handleWithRetry(ctx context.Context, handler MessageHandler, msg *sarama.ConsumerMessage) error {
	var lastErr error
	for i := 0; i < maxRetries; i++ {
		if err := handler.Handle(ctx, msg); err != nil {
			lastErr = err
			logx.Errorf("消息处理失败（第%d/%d次）: topic=%s partition=%d offset=%d error=%v",
				i+1, maxRetries, msg.Topic, msg.Partition, msg.Offset, err)
			if i < maxRetries-1 {
				time.Sleep(time.Duration(i+1) * 2 * time.Second)
			}
			continue
		}
		return nil
	}
	return lastErr
}
