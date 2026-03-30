package kafka

import (
	"github.com/Shopify/sarama"
)

type KafkaProducer struct {
	// 同步方式的生产者，用于消息可靠推送
	syncProducer sarama.SyncProducer
}

func NewKafkaProducer(client sarama.SyncProducer) *KafkaProducer {
	return &KafkaProducer{
		syncProducer: client,
	}
}

func (p *KafkaProducer) SyncProduce(topic string, key []byte, value []byte) error {
	msg := &sarama.ProducerMessage{
		Topic: topic,
		Key:   sarama.ByteEncoder(key),
		Value: sarama.ByteEncoder(value),
	}
	_, _, err := p.syncProducer.SendMessage(msg)
	return err
}

func (p *KafkaProducer) SyncProduceClose() error {
	return p.syncProducer.Close()
}
