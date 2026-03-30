package nsq

import (
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driver/mq/impl"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/mq/nsqx"
	"github.com/nsqio/go-nsq"
)

type NSQ struct {
	consumer nsqx.Consumer
	producer nsqx.Producer
}

func New(consumer nsqx.Consumer, producer nsqx.Producer) impl.MQ {
	return &NSQ{
		consumer: consumer,
		producer: producer,
	}
}

func (n NSQ) Handler(topic string, handler func(msg []byte) error) {
	n.consumer.Register(topic, func(message *nsq.Message) error {
		return handler(message.Body)
	})
}

func (n NSQ) Produce(topic string, key []byte, msg []byte) error {
	return n.producer.Send(topic, msg)
}

func (n NSQ) Start() error {
	return nil
}

func (n NSQ) Stop() error {
	n.consumer.Close()
	return nil
}
