package nsq

import (
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/driver/mq/common"
	mq_nsq "github.com/nsqio/go-nsq"
)

type ConsumerSt struct {
	parent   common.MQConsumerInterface
	consumer *mq_nsq.Consumer
}

func NewConsumer(parent common.MQConsumerInterface) (c *ConsumerSt, err error) {
	var consumer *mq_nsq.Consumer
	conf := mq_nsq.NewConfig()
	conf.ClientID = parent.ClientID()
	consumer, err = mq_nsq.NewConsumer(parent.Topic(), parent.Channel(), conf)
	if err == nil {
		c = &ConsumerSt{parent: parent, consumer: consumer}
		consumer.AddHandler(NewConsumerMessageHandler(c.parent.Handler()))
		if err := consumer.ConnectToNSQLookupd(c.parent.LookupdAddr()); err != nil {
			return nil, err
		}
	}
	return c, err
}

func (c *ConsumerSt) Close() error {
	c.consumer.Stop()
	return nil
}
