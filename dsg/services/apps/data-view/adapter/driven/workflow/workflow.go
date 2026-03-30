package workflow

import (
	"fmt"
	"github.com/kweaver-ai/dsg/services/apps/data-view/common/constant"
	"github.com/kweaver-ai/dsg/services/apps/data-view/infrastructure/config"
	"github.com/kweaver-ai/idrm-go-common/workflow"
	"github.com/kweaver-ai/idrm-go-common/workflow/common"

	"net/http"
)

func NewWFStarter(wf workflow.WorkflowInterface) workflow.WFStarter {
	return wf
}

func NewWorkflow(conf *config.Bootstrap, httpClient *http.Client) (workflow.WorkflowInterface, error) {
	var mqConf *common.MQConf
	switch conf.DepServices.MqType {
	case common.MQ_TYPE_NSQ:
		mqConf = &common.MQConf{
			MqType:      common.MQ_TYPE_NSQ,
			Host:        fmt.Sprintf("%s:%s", conf.DepServices.Nsq.Host, conf.DepServices.Nsq.Port),
			HttpHost:    fmt.Sprintf("%s:%s", conf.DepServices.Nsq.HttpHost, conf.DepServices.Nsq.HttpPort),
			LookupdHost: fmt.Sprintf("%s:%s", conf.DepServices.Nsq.LookupdHost, conf.DepServices.Nsq.LookupdPort),
			Channel:     constant.ServiceChannel,
		}
	case common.MQ_TYPE_KAFKA:
		mqConf = &common.MQConf{
			MqType:  common.MQ_TYPE_KAFKA,
			Host:    conf.DepServices.KafkaMQ.Host,
			Channel: constant.ServiceChannel,
			Version: "2.3.1",
			Sasl: &common.Sasl{
				Enabled:   true,
				Mechanism: "PLAIN",
				Username:  conf.DepServices.KafkaMQ.Sasl.Username,
				Password:  conf.DepServices.KafkaMQ.Sasl.Password,
			},
			Producer: &common.Producer{
				SendBufSize: conf.DepServices.KafkaMQ.Producer.SendBufSize,
				RecvBufSize: conf.DepServices.KafkaMQ.Producer.RecvBufSize,
			},
		}
	}
	return workflow.NewWorkflow(httpClient, mqConf)
}
