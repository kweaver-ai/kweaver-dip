package kafka

import (
	"github.com/Shopify/sarama"
	my_config "github.com/kweaver-ai/dsg/services/apps/data-view/infrastructure/config"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
)

var (
	group = "data-view"
)

type ConsumerGroupFactory interface {
	GetConsumerGroup() (sarama.ConsumerGroup, error)
}

type ConsumerGroupProduct struct {
	conf *my_config.Bootstrap
}

func NewConsumerGroupProduct(c *my_config.Bootstrap) ConsumerGroupFactory {
	return &ConsumerGroupProduct{conf: c}
}

func (c *ConsumerGroupProduct) GetConsumerGroup() (sarama.ConsumerGroup, error) {
	//配置订阅者
	config := sarama.NewConfig()
	config.Net.SASL.Enable = true
	config.Net.SASL.Mechanism = sarama.SASLTypePlaintext
	config.Net.SASL.User = c.conf.DepServices.KafkaMQ.Sasl.Username
	config.Net.SASL.Password = c.conf.DepServices.KafkaMQ.Sasl.Password
	config.Net.SASL.Handshake = true
	//配置偏移量
	config.Consumer.Offsets.Initial = sarama.OffsetNewest

	client, err := sarama.NewConsumerGroup([]string{c.conf.DepServices.KafkaMQ.Host}, group, config)
	if err != nil {
		log.Errorf("Error creating consumer group client: %v", err)
		return nil, err
	}
	return client, nil
}

// Productmock

type ConsumerGroupMock struct {
	conf *my_config.Bootstrap
}

func NewConsumerGroupMock(c *my_config.Bootstrap) ConsumerGroupFactory {
	return &ConsumerGroupMock{conf: c}
}

func (c *ConsumerGroupMock) GetConsumerGroup() (sarama.ConsumerGroup, error) {
	return nil, nil
}

func NewSyncConsumerMock(c *my_config.Bootstrap) (sarama.ConsumerGroup, error) {
	return nil, nil
}
