package consumer

import (
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/adapter/driven/mq"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/adapter/driven/mq/consumer/service"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"go.uber.org/zap"
)

const (
	nsqChannel = "data-application-service-channel"
)

type Consumer struct {
	mqMQ           *mq.MQ
	serviceHandler *service.Handler
	topicHandles   map[string]mq.MessageHandler
}

func NewConsumer(
	mqMQ *mq.MQ,
	serviceHandler *service.Handler,
) *Consumer {
	c := &Consumer{
		mqMQ:           mqMQ,
		serviceHandler: serviceHandler,
		topicHandles:   map[string]mq.MessageHandler{},
	}
	c.register()
	return c
}

func (c *Consumer) register() {
	c.topicHandles[ServiceAuthUpdate] = c.serviceHandler.UpdateAuthedUsers
}

func (c *Consumer) Register() {
	for topic, handler := range c.topicHandles {
		go func(topic string, handler mq.MessageHandler) {
			err := c.mqMQ.KafkaClient.Sub(topic, "data-application-service", handler, 1000, 1)
			if err != nil {
				log.Error("kafka consumer", zap.String("topic", topic), zap.Error(err))
				return
			}
		}(topic, handler)
	}
}
