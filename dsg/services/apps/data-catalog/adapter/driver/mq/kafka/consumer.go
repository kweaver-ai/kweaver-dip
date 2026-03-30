package kafka

import (
	"context"

	"github.com/Shopify/sarama"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/driver/mq/common"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
)

type ConsumerSt struct {
	parent   common.MQConsumerInterface
	consumer sarama.ConsumerGroup
	ctx      context.Context
	cancel   context.CancelFunc
}

func NewConsumer(parent common.MQConsumerInterface) (c *ConsumerSt, err error) {
	var consumer sarama.ConsumerGroup
	conf := sarama.NewConfig()
	conf.ClientID = parent.ClientID()
	consumer, err = sarama.NewConsumerGroup([]string{parent.Addr()}, parent.Channel(), conf)
	if err == nil {
		ctx, cancel := context.WithCancel(context.Background())
		c = &ConsumerSt{parent: parent, consumer: consumer, ctx: ctx, cancel: cancel}
		go func() {
			for {
				err := c.consumer.Consume(c.ctx, []string{c.parent.Topic()}, NewConsumerGroupHandler(c.parent.Handler()))
				if err != nil {
					log.WithContext(ctx).Warnf("mq addr:%s topic:%s consume failed (error:%s), recreate consumer", c.parent.Addr(), c.parent.Topic(), err.Error())
				}
			}
		}()
	}
	return c, err
}

func (c *ConsumerSt) Close() error {
	c.cancel()
	return c.consumer.Close()
}
