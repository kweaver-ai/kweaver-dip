package settings

import (
	"fmt"
	"net"

	"github.com/kweaver-ai/idrm-go-common/workflow/common"
)

const (
	WorkflowKafkaSendBufSize = 1 << 10
	WorkflowKafkaRecvBufSize = 1 << 10
)

type Workflow struct {
	// workflow 所使用的消息队列类型，kafka 或 nsq
	MQType string `json:"mq_type,omitempty"`
	// 与 workflow 通信所使用的 channel
	MQChannel string `json:"mq_channel,omitempty"`
}

func WorkflowMQConfFor(s *Settings) (conf *common.MQConf, err error) {
	w := s.Workflow
	mq := s.MQ
	switch w.MQType {
	case "kafka":
		conf = &common.MQConf{
			MqType:  mq.Kafka.Type,
			Host:    net.JoinHostPort(mq.Kafka.Host, mq.Kafka.Port),
			Channel: w.MQChannel,
			Sasl: &common.Sasl{
				Enabled:   mq.Kafka.Username != "" || mq.Kafka.Password != "",
				Mechanism: mq.Kafka.Mechanism,
				Username:  mq.Kafka.Username,
				Password:  mq.Kafka.Password,
			},
			Producer: &common.Producer{
				SendBufSize: WorkflowKafkaSendBufSize,
				RecvBufSize: WorkflowKafkaRecvBufSize,
			},
			Version: mq.Kafka.Version,
		}
	case "nsq":
		conf = &common.MQConf{
			MqType:      mq.NSQ.Type,
			Host:        net.JoinHostPort(mq.NSQ.Host, mq.NSQ.Port),
			HttpHost:    net.JoinHostPort(mq.NSQ.HttpHost, mq.NSQ.HttpPort),
			LookupdHost: net.JoinHostPort(mq.NSQ.LookupdHost, mq.NSQ.LookupdPort),
			Channel:     w.MQChannel,
		}
	default:
		err = fmt.Errorf("unsupported mq type %s", w.MQType)
	}
	return
}
