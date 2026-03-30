package settings

import (
	"fmt"
	"net"

	"github.com/kweaver-ai/idrm-go-common/workflow/common"
)

// Work
type Workflow struct {
	// Workflow 使用的消息队列类型，Kafka、NSQ 等
	MQType string `json:"mq_type,omitempty"`
	// 使用这个 channel 与 workflow 通信，包括创建审批、获取审批结果
	Channel string `json:"channel,omitempty"`

	// 使用 Kafka 时需要
	SendBufSize int32 `json:"send_buf_size,omitempty"`
	// 使用 Kafka 时需要
	RecvBufSize int32 `json:"recv_buf_size,omitempty"`
}

// 返回与 workflow 通信所使用的消息队列配置，用于 wire
func WorkflowMQConf(s *Settings) (*common.MQConf, error) {
	return newWorkflowMQConf(&s.Workflow, &s.MQ)
}

// 返回与 workflow 通信所使用的消息队列配置
func newWorkflowMQConf(w *Workflow, mq *MQ) (*common.MQConf, error) {
	switch w.MQType {
	case common.MQ_TYPE_KAFKA:
		return newWorkflowMQConfForKafka(w, &mq.Kafka), nil
	case common.MQ_TYPE_NSQ:
		return newWorkflowMQConfForNSQ(w, &mq.NSQ), nil
	default:
		return nil, fmt.Errorf("unsupported mq type %s", w.MQType)
	}
}

func newWorkflowMQConfForKafka(w *Workflow, c *MQConfig) *common.MQConf {
	return &common.MQConf{
		MqType:  common.MQ_TYPE_KAFKA,
		Host:    net.JoinHostPort(c.Host, c.Port),
		Channel: w.Channel,
		Sasl: &common.Sasl{
			Enabled:   true,
			Mechanism: c.Mechanism,
			Username:  c.Username,
			Password:  c.Password,
		},
		Producer: &common.Producer{
			SendBufSize: w.SendBufSize,
			RecvBufSize: w.RecvBufSize,
		},
		Version: c.Version,
	}
}

func newWorkflowMQConfForNSQ(w *Workflow, c *MQConfig) *common.MQConf {
	return &common.MQConf{
		MqType:      common.MQ_TYPE_NSQ,
		Host:        net.JoinHostPort(c.Host, c.Port),
		HttpHost:    net.JoinHostPort(c.HttpHost, c.HttpPort),
		LookupdHost: net.JoinHostPort(c.LookupdHost, c.LookupdPort),
		Channel:     w.Channel,
	}
}
