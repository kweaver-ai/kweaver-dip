package mq

import (
	"errors"
	"os"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/driver/mq/common"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/driver/mq/kafka"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/driver/mq/nsq"
)

type MQAsyncProducer struct {
	common.MQProducerConfInterface
	producer common.Producer
	topic    string
	s        chan *common.PubMsg
	r        chan *common.PubResult
}

func NewAsyncProducer(conf common.MQProducerConfInterface, topic string) (common.MQProducer, error) {
	if conf == nil {
		return nil, errors.New("")
	}
	p := new(MQAsyncProducer)
	p.MQProducerConfInterface = conf
	p.topic = topic
	p.s = make(chan *common.PubMsg, conf.SendSize())
	p.r = make(chan *common.PubResult, conf.RecvSize())

	var err error
	switch conf.MQType() {
	case common.MQ_TYPE_KAFKA:
		p.producer, err = kafka.NewAsyncProducer(p, p.r)
	case common.MQ_TYPE_NSQ:
		p.producer, err = nsq.NewAsyncProducer(p, p.r)
	default:
		return nil, errors.New("unsupported mq type")
	}

	if err == nil {
		go func() {
			for {
				select {
				case msg, ok := <-p.s:
					if !ok {
						return
					}
					p.producer.Produce(msg.Key(), msg.Value())
				case <-stopCh:
					p.producer.Close()
					close(p.s)
					close(p.r)
					return
				}
			}
		}()
	}
	return p, err
}

func (mqp *MQAsyncProducer) Topic() string {
	return mqp.topic
}

func (mqp *MQAsyncProducer) Input() chan<- *common.PubMsg {
	return mqp.s
}

func (mqp *MQAsyncProducer) Output() *common.PubResult {
	if retMsg, ok := <-mqp.r; ok {
		return retMsg
	}
	return nil
}

func (mqp *MQAsyncProducer) StopCh() <-chan os.Signal {
	return stopCh
}

func (mqp *MQAsyncProducer) Produce(msg *common.PubMsg) error {
	defer recover()
	select {
	case mqp.s <- msg:
	case <-stopCh:
		return errors.New("program exit signal received, producer closed")
	}
	return nil
}
