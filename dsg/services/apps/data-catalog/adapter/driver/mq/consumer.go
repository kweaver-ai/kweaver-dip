package mq

import (
	"errors"
	"os"
	"os/signal"
	"syscall"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/driver/mq/common"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/driver/mq/kafka"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/driver/mq/nsq"
)

type Consumer interface{}

type MQConsumer struct {
	common.MQConsumerConfInterface
	topic    string
	consumer common.Consumer
	stopCh   <-chan os.Signal
	fn       common.Handler
}

func NewConsumer(conf common.MQConsumerConfInterface, topic string, fn common.Handler) (Consumer, error) {
	if conf == nil {
		return nil, errors.New("")
	}
	c := new(MQConsumer)
	c.MQConsumerConfInterface = conf
	c.topic = topic
	stopCh := make(chan os.Signal)
	c.stopCh = stopCh
	signal.Notify(stopCh, syscall.SIGTERM, syscall.SIGQUIT, syscall.SIGINT)
	c.fn = fn

	var err error
	switch conf.MQType() {
	case common.MQ_TYPE_KAFKA:
		c.consumer, err = kafka.NewConsumer(c)
	case common.MQ_TYPE_NSQ:
		c.consumer, err = nsq.NewConsumer(c)
	default:
		return nil, errors.New("unknown mq type")
	}

	if err != nil {
		go func() {
			<-stopCh
			c.consumer.Close()
		}()
	}
	return c, err
}

func (mqc *MQConsumer) Topic() string {
	return mqc.topic
}

func (mqc *MQConsumer) Handler() common.Handler {
	return mqc.fn
}

func (mqc *MQConsumer) StopCh() <-chan os.Signal {
	return mqc.stopCh
}
