package kafka

import (
	"github.com/Shopify/sarama"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/driver/mq/common"
)

type SyncProducerSt struct {
	parent   common.MQProducerInterface
	producer sarama.SyncProducer
}

func NewSyncProducer(parent common.MQProducerInterface) (p *SyncProducerSt, err error) {
	var producer sarama.SyncProducer
	addrs := []string{parent.Addr()}
	producer, err = sarama.NewSyncProducer(addrs, getProducerConfig(parent))
	if err == nil {
		p = &SyncProducerSt{parent: parent, producer: producer}
	}
	return p, err
}

func (p *SyncProducerSt) Produce(key []byte, value []byte) error {
	msg := &sarama.ProducerMessage{
		Topic: p.parent.Topic(),
		Key:   sarama.ByteEncoder(key),
		Value: sarama.ByteEncoder(value),
	}
	_, _, err := p.producer.SendMessage(msg)
	return err
}

func (p *SyncProducerSt) Close() error {
	return p.producer.Close()
}
