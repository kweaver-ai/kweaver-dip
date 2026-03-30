package nsq

import (
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/driver/mq/common"
	mq_nsq "github.com/nsqio/go-nsq"
)

type ConsumerMessageHandler struct {
	fn common.Handler
}

func NewConsumerMessageHandler(f common.Handler) *ConsumerMessageHandler {
	return &ConsumerMessageHandler{fn: f}
}

func (c *ConsumerMessageHandler) HandleMessage(m *mq_nsq.Message) error {
	if len(m.Body) == 0 {
		return nil
	}
	return c.fn(m.Body)
}
