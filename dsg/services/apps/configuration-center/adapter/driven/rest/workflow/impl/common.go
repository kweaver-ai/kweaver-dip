package impl

import (
	"fmt"
	"net"
	"net/http"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/settings"
	"github.com/kweaver-ai/idrm-go-common/workflow"
	"github.com/kweaver-ai/idrm-go-common/workflow/common"
)

const mqChannel string = "configuration-center"

// 返回 WorkflowInterface
func NewCommonWorkflow(client *http.Client) (workflow.WorkflowInterface, error) {
	var conf *common.MQConf
	switch settings.ConfigInstance.Config.MQType {
	case "kafka":
		conf = WorkflowMQConfForKafka(&settings.ConfigInstance.Config.DepServices.MQ, &settings.ConfigInstance.Config.KafkaMQ)
	case "nsq":
		conf = WorkflowMQConfForNSQ(&settings.ConfigInstance.Config.DepServices.MQ, &settings.ConfigInstance.Config.Nsq)
	default:
		return nil, fmt.Errorf("unsupported mq type for workflow: %v", settings.ConfigInstance.Config.MQType)
	}
	return workflow.NewWorkflow(client, conf)
}

func WorkflowMQConfForKafka(mq *settings.MQ, config *settings.KafkaMQ) *common.MQConf {
	return &common.MQConf{
		MqType:  mq.MQType,
		Host:    net.JoinHostPort(mq.MQHost, mq.MQPort),
		Channel: mqChannel,
		Sasl: &common.Sasl{
			Enabled:   mq.Auth.Mechanism != "",
			Mechanism: mq.Auth.Mechanism,
			Username:  mq.Auth.Username,
			Password:  mq.Auth.Password,
		},
		Producer: &common.Producer{
			SendBufSize: int32(config.Producer.SendBufSize),
			RecvBufSize: int32(config.Producer.RecvBufSize),
		},
		Version: "2.3.1",
	}
}

func WorkflowMQConfForNSQ(mq *settings.MQ, config *settings.Nsq) *common.MQConf {
	return &common.MQConf{
		MqType:      mq.MQType,
		Host:        net.JoinHostPort(mq.MQHost, "4150"),
		HttpHost:    net.JoinHostPort(mq.MQHost, mq.MQPort),
		LookupdHost: net.JoinHostPort(mq.MQLookupdHost, mq.MQLookupdPort),
		Channel:     mqChannel,
	}
}
