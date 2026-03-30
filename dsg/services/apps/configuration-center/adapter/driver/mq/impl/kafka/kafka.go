package kafka

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driver/mq/impl"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/mq/kafkax"
	"go.uber.org/zap"
)

type Kafka struct {
	consumer kafkax.Consumer
	producer kafkax.Producer
}

func New(consumer kafkax.Consumer, producer kafkax.Producer) impl.MQ {
	return &Kafka{consumer: consumer, producer: producer}
}

func (k Kafka) Handler(topic string, handler func(msg []byte) error) {
	k.consumer.RegisterHandles(func(ctx context.Context, msg *kafkax.Message) bool {
		err := handler(msg.Value)
		if err != nil {
			log.WithContext(ctx).Error("kafak handler func error", zap.Error(err))
			return false
		}
		return true
	}, topic)
}

func (k Kafka) Produce(topic string, key []byte, msg []byte) error {
	return k.producer.SendWithKey(topic, key, msg)
}

func (k Kafka) Start() error {
	return k.consumer.Start(context.Background())
}

func (k Kafka) Stop() error {
	return k.consumer.Stop(context.Background())
}
