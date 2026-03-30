package nsq

import (
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/driver/mq/common"
	mq_nsq "github.com/nsqio/go-nsq"
)

type AsyncProducerSt struct {
	parent   common.MQProducerInterface
	producer *mq_nsq.Producer
	doneChan chan *mq_nsq.ProducerTransaction
	result   chan<- *common.PubResult
}

func NewAsyncProducer(parent common.MQProducerInterface, result chan<- *common.PubResult) (p *AsyncProducerSt, err error) {
	var producer *mq_nsq.Producer
	producer, err = mq_nsq.NewProducer(parent.Addr(), mq_nsq.NewConfig())
	if err == nil {
		p = &AsyncProducerSt{parent: parent, producer: producer, doneChan: make(chan *mq_nsq.ProducerTransaction, cap(result)), result: result}
		go p.start()
	}
	return p, err
}

func (p *AsyncProducerSt) Produce(key []byte, msg []byte) error {
	return p.producer.PublishAsync(p.parent.Topic(), msg, p.doneChan, msg)
}

func (p *AsyncProducerSt) start() {
	var respMsg *mq_nsq.ProducerTransaction
	defer recover()
	for {
		msg := &common.PubResult{}
		select {
		case respMsg = <-p.doneChan:
			msg.SetError(respMsg.Error)
		case <-p.parent.StopCh():
			return
		}

		msg.SetSrcMsg(nil, respMsg.Args[0].([]byte))
		select {
		case p.result <- msg:
		case <-p.parent.StopCh():
			return
		}
	}
}

func (p *AsyncProducerSt) Close() error {
	p.producer.Stop()
	return nil
}
