package kafka

import (
	"errors"

	"github.com/Shopify/sarama"
	"go.uber.org/zap"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/driver/mq/common"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
)

type AsyncProducerSt struct {
	parent   common.MQProducerInterface
	producer sarama.AsyncProducer
	result   chan<- *common.PubResult
}

func NewAsyncProducer(parent common.MQProducerInterface, result chan<- *common.PubResult) (p *AsyncProducerSt, err error) {
	// 创建 ClusterAdmin 客户端用来创建 Topic
	a, err := sarama.NewClusterAdmin([]string{parent.Addr()}, getProducerConfig(parent))
	if err != nil {
		return
	}
	defer a.Close()

	// 如果 topic 不存在则创建
	topics, err := a.ListTopics()
	if err != nil {
		return
	}
	if t, ok := topics[parent.Topic()]; ok {
		log.Debug("kafka topic already exists", zap.Any("topic", t))
	} else {
		log.Info("create kafka topic")
		if err = a.CreateTopic(parent.Topic(), &sarama.TopicDetail{NumPartitions: 1, ReplicationFactor: 1}, false); err != nil {
			if errors.Is(err, sarama.ErrTopicAlreadyExists) {
				log.Warn("kafka topic already exists", zap.Any("topic", t))
			} else {
				return
			}
		}
	}

	var producer sarama.AsyncProducer
	addrs := []string{parent.Addr()}
	producer, err = sarama.NewAsyncProducer(addrs, getProducerConfig(parent))
	if err == nil {
		p = &AsyncProducerSt{parent: parent, producer: producer, result: result}
		go p.start()
	}
	return p, err
}

func (p *AsyncProducerSt) Produce(key []byte, value []byte) error {
	msg := &sarama.ProducerMessage{
		Topic: p.parent.Topic(),
		Key:   sarama.ByteEncoder(key),
		Value: sarama.ByteEncoder(value),
	}
	select {
	case p.producer.Input() <- msg:
	case <-p.parent.StopCh():
	}
	return nil
}

func (p *AsyncProducerSt) start() {
	var errMsg *sarama.ProducerError
	var respMsg *sarama.ProducerMessage
	defer recover()
	for {
		msg := &common.PubResult{}
		select {
		case errMsg = <-p.producer.Errors():
			msg.SetError(errMsg.Err)
			respMsg = errMsg.Msg
		case respMsg = <-p.producer.Successes():
		case <-p.parent.StopCh():
			return
		}

		key, _ := respMsg.Key.Encode()
		value, _ := respMsg.Value.Encode()
		msg.SetSrcMsg(key, value)
		select {
		case p.result <- msg:
		case <-p.parent.StopCh():
			return
		}
	}
}

func (p *AsyncProducerSt) Close() error {
	return p.producer.Close()
}
