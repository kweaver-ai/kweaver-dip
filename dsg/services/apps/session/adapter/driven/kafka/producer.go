package kafka

import (
	"net"

	"github.com/IBM/sarama"
	"github.com/kweaver-ai/dsg/services/apps/session/common/settings"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/mq/kafkax"
)

func NewSaramaSyncProducer(s *settings.ConfigContains) (sarama.SyncProducer, error) {
	v, err := sarama.ParseKafkaVersion(s.Config.MQ.Kafka.Version)
	if err != nil {
		return nil, err
	}

	// Kafka 配置
	k := &s.Config.MQ.Kafka
	// Kafka 地址列表
	var addresses = []string{net.JoinHostPort(k.Host, k.Port)}
	// Kafka 客户端 sarama 的配置
	config := sarama.NewConfig()
	config.Net.SASL.Enable = k.Username != "" || k.Password != ""
	config.Net.SASL.Mechanism = sarama.SASLMechanism(k.Mechanism)
	config.Net.SASL.User = k.Username
	config.Net.SASL.Password = k.Password
	config.Net.SASL.Handshake = true
	config.Producer.Return.Successes = true
	config.Version = v

	return sarama.NewSyncProducer(addresses, config)
}

func NewSyncProducer() (kafkax.Producer, error) {
	kafkaConfig := settings.ConfigInstance.Config.MQ.Kafka
	producer, err := kafkax.NewSyncProducer(&kafkax.ProducerConfig{
		Addr:      kafkaConfig.Host + ":" + kafkaConfig.Port,
		UserName:  kafkaConfig.Username,
		Password:  kafkaConfig.Password,
		Mechanism: kafkaConfig.Mechanism,
	})
	return producer, err
}
