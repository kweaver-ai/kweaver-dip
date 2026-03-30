package kafka

import (
	"time"

	"github.com/Shopify/sarama"
	"github.com/kweaver-ai/dsg/services/apps/data-exploration-service/common/settings"
)

type KafkaProducer struct {
	// 同步方式的生产者，用于消息可靠推送
	syncProducer sarama.SyncProducer
}

func NewKafkaProducer() (p *KafkaProducer, err error) {
	producer, err := sarama.NewSyncProducer([]string{settings.GetConfig().Kafka.Addr}, getProducerConfig())
	if err == nil {
		p = &KafkaProducer{
			syncProducer: producer,
		}
	}
	return p, err
}

func getProducerConfig() *sarama.Config {
	conf := sarama.NewConfig()
	conf.Producer.Timeout = 100 * time.Millisecond
	if len(settings.GetConfig().Kafka.Mechanism) > 0 {
		conf.Net.SASL.Enable = true
		conf.Net.SASL.Mechanism = sarama.SASLMechanism(settings.GetConfig().Kafka.Mechanism)
		conf.Net.SASL.User = settings.GetConfig().Kafka.UserName
		conf.Net.SASL.Password = settings.GetConfig().Kafka.Password
		conf.Net.SASL.Handshake = true
	}
	conf.Producer.Return.Successes = true
	conf.Producer.Return.Errors = true
	conf.Producer.RequiredAcks = sarama.WaitForAll
	conf.Producer.Partitioner = sarama.NewRandomPartitioner
	return conf
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
