package kafka

import (
	"context"
	"github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driver/mq"
	"github.com/kweaver-ai/dsg/services/apps/data-view/infrastructure/mq/kafka"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
)

type KafkaConsumerClient struct {
	consumerGroupProduct kafka.ConsumerGroupFactory
	ctx                  context.Context
	cancel               context.CancelFunc
}

func NewConsumerClient(consumerGroupProduct kafka.ConsumerGroupFactory) (c mq.MQClient, err error) {
	ctx, cancel := context.WithCancel(context.Background())
	c = &KafkaConsumerClient{
		consumerGroupProduct: consumerGroupProduct,
		ctx:                  ctx,
		cancel:               cancel,
	}
	return c, err
}

func (c *KafkaConsumerClient) Close() (err error) {
	c.cancel()
	return
}

// Subscribe 服务订阅
func (c *KafkaConsumerClient) Subscribe(topic string, cmd func(message []byte) error) {
	go func() {
		client, err := c.consumerGroupProduct.GetConsumerGroup()
		if err != nil {
			log.Fatalf("create consume Fatal, topic:%s", topic)
			return
		}
		for {
			log.Infof("start create consume , topic:%s", topic)
			err := client.Consume(c.ctx, []string{topic}, NewConsumerGroupHandler(cmd)) //创建消费者
			if err != nil {
				log.Fatalf("mq topic:%s consume failed (error:%s), recreate consumer", topic, err.Error())
			}
		}
	}()
}
