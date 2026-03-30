package workflow

import (
	"errors"
	"net/http"

	"github.com/kweaver-ai/idrm-go-common/workflow"
	"github.com/kweaver-ai/idrm-go-common/workflow/common"

	"github.com/kweaver-ai/dsg/services/apps/task_center/common/settings"
)

func NewWFStarter(wf workflow.WorkflowInterface, _ *http.Client) workflow.WFStarter {
	return wf
}

func NewWorkflow(httpClient *http.Client) (workflow.WorkflowInterface, error) {
	var mqConf *common.MQConf

	switch settings.ConfigInstance.DepServices.MQ.ConnectorType {
	case common.MQ_TYPE_NSQ:
		nsqConf := settings.ConfigInstance.DepServices.MQ
		if nsqConf == nil {
			return nil, errors.New("nsq conf not found")
		}

		httpHost := nsqConf.MqHost + ":" + nsqConf.MqPort
		lookupdHost := nsqConf.MqLookupdHost + ":" + nsqConf.MqLookupdPort
		Host := nsqConf.MqHost + ":" + nsqConf.NsqdPortTCP
		mqConf = &common.MQConf{
			MqType:      common.MQ_TYPE_NSQ,
			Host:        Host,
			HttpHost:    httpHost,
			LookupdHost: lookupdHost,
			Channel:     "af.task-center",
		}
	case common.MQ_TYPE_KAFKA:
		fallthrough
	default: // default mq is kafka
		kafkaConf := settings.ConfigInstance.KafkaConf
		mqConf = &common.MQConf{
			MqType:  common.MQ_TYPE_KAFKA,
			Host:    kafkaConf.URI,
			Channel: "af_task",
			Version: kafkaConf.Version,
			Sasl: &common.Sasl{
				Enabled:   true,
				Mechanism: kafkaConf.Mechanism,
				Username:  kafkaConf.Username,
				Password:  kafkaConf.Password,
			},
			// Producer: &common.Producer{
			// 	SendBufSize: int32(settings.GetConfig().MQConf.SendBufSize),
			// 	RecvBufSize: int32(settings.GetConfig().MQConf.RecvBufSize),
			// },
		}
	}
	return workflow.NewWorkflow(httpClient, mqConf)
}
