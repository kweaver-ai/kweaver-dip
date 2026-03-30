package kafka

import (
	"github.com/Shopify/sarama"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/driver/mq/common"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
)

type ConsumerGroupHandler struct {
	fn common.Handler
}

func NewConsumerGroupHandler(f common.Handler) *ConsumerGroupHandler {
	return &ConsumerGroupHandler{fn: f}
}

func (c *ConsumerGroupHandler) Setup(sarama.ConsumerGroupSession) error {
	return nil
}

func (c *ConsumerGroupHandler) Cleanup(sarama.ConsumerGroupSession) error {
	return nil
}

func (c *ConsumerGroupHandler) ConsumeClaim(sess sarama.ConsumerGroupSession, claim sarama.ConsumerGroupClaim) error {
	for msg := range claim.Messages() {
		//log.Infof("Message topic: %q partition: %d offset: %d start consume", msg.Topic, msg.Partition, msg.Offset)
		if err := c.fn(msg.Value); err != nil {
			sess.ResetOffset(msg.Topic, msg.Partition, msg.Offset, "")
			log.Errorf("Message topic: %q partition:%d offset:%d reseted, err: %s", msg.Topic, msg.Partition, msg.Offset, err.Error())
			continue
		}
		sess.MarkMessage(msg, "")
		//log.Infof("Message topic: %q partition: %d offset: %d consumed success", msg.Topic, msg.Partition, msg.Offset)
	}
	return nil
}
