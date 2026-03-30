package kafka

import (
	"context"

	"github.com/Shopify/sarama"
	"github.com/kweaver-ai/dsg/services/apps/data-exploration-service/adapter/driven/mq"
	"github.com/kweaver-ai/dsg/services/apps/data-exploration-service/common/settings"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
)

type KafkaConsumerClient struct {
	ctx    context.Context
	cancel context.CancelFunc
}

const (
// GroupId = "data-exploration-service-channel"
)

func NewConsumerClient() (c mq.MQClient, err error) {
	ctx, cancel := context.WithCancel(context.Background())
	c = &KafkaConsumerClient{ctx: ctx, cancel: cancel}
	return c, err
}

func (c *KafkaConsumerClient) Close() (err error) {
	c.cancel()
	return
}

// Subscribe 服务订阅
func (c *KafkaConsumerClient) Subscribe(topic string, cmd func(message []byte) error) {
	var consumer sarama.ConsumerGroup
	conf := sarama.NewConfig()
	if len(settings.GetConfig().Kafka.Mechanism) > 0 {
		conf.Net.SASL.Enable = true
		conf.Net.SASL.Mechanism = sarama.SASLMechanism(settings.GetConfig().Kafka.Mechanism)
		conf.Net.SASL.User = settings.GetConfig().Kafka.UserName
		conf.Net.SASL.Password = settings.GetConfig().Kafka.Password
		conf.Net.SASL.Handshake = true
	}

	consumer, err := sarama.NewConsumerGroup([]string{settings.GetConfig().Kafka.Addr}, settings.GetConfig().Kafka.GroupId, conf)
	if err == nil {
		go func() {
			for {
				log.Infof("start create consume. addr:%s , topic:%s", settings.GetConfig().Kafka.Addr, topic)
				err := consumer.Consume(c.ctx, []string{topic}, NewConsumerGroupHandler(cmd)) //创建消费者
				if err != nil {
					log.Fatalf("mq addr:%s topic:%s consume failed (error:%s), recreate consumer", settings.GetConfig().Kafka.Addr, topic, err.Error())
				}
			}
		}()
	}
}
