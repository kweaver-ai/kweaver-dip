package kafka

import (
	"context"
	"errors"

	"github.com/Shopify/sarama"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/driver/mq/common"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/settings"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
)

type Consumer struct {
}

func NewConsumer() *Consumer {
	return &Consumer{}
}

// Subscribe 服务订阅
func (c *Consumer) Subscribe(topic string, cmd func(message []byte) error) {
	go func() {
		client, err := c.GetConsumerGroup()
		if err != nil {
			log.Fatalf("create consume Fatal, topic:%s", topic)
			return
		}
		for {
			log.Infof("start create consume , topic:%s", topic)
			err := client.Consume(context.Background(), []string{topic}, NewConsumerGroupHandler(cmd))
			if err != nil {
				log.Fatalf("mq topic:%s consume failed (error:%s), recreate consumer", topic, err.Error())
			}
		}
	}()
}

func (c *Consumer) GetConsumerGroup() (sarama.ConsumerGroup, error) {
	mqConf := settings.GetConfig().MQConf
	for _, connConf := range mqConf.ConnConfs {
		if connConf.MQType == common.MQ_TYPE_KAFKA {
			//配置订阅者
			config := sarama.NewConfig()
			config.Net.SASL.Enable = true
			config.Net.SASL.Mechanism = sarama.SASLTypePlaintext
			config.Net.SASL.User = connConf.User
			config.Net.SASL.Password = connConf.Password
			config.Net.SASL.Handshake = true
			//配置偏移量
			config.Consumer.Offsets.Initial = sarama.OffsetNewest

			client, err := sarama.NewConsumerGroup([]string{connConf.Addr}, "data-catalog2", config)
			if err != nil {
				log.Errorf("Error creating consumer group client: %v", err)
				return nil, err
			}
			return client, nil
		}
	}
	return nil, errors.New("kafka GetConsumerGroup config not exist")
}
