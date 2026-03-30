package nsq

import (
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/driver/mq/common"
	mq_nsq "github.com/nsqio/go-nsq"
)

type SyncProducerSt struct {
	parent   common.MQProducerInterface
	producer *mq_nsq.Producer
}

func NewSyncProducer(parent common.MQProducerInterface) (p *SyncProducerSt, err error) {
	var producer *mq_nsq.Producer
	producer, err = mq_nsq.NewProducer(parent.Addr(), mq_nsq.NewConfig())
	if err == nil {
		p = &SyncProducerSt{parent: parent, producer: producer}
	}
	return p, err
}

func (p *SyncProducerSt) Produce(key []byte, msg []byte) error {
	return p.producer.Publish(p.parent.Topic(), msg)
}

func (p *SyncProducerSt) Close() error {
	p.producer.Stop()
	return nil
}
