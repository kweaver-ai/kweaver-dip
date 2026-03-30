package workflow

import (
	"fmt"
	"net/http"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/settings"
	"github.com/kweaver-ai/idrm-go-common/workflow"
	"github.com/kweaver-ai/idrm-go-common/workflow/common"
	// "devops.kweaver-ai.cn/kweaver-aiDevOps/AnyFabric/_git/sszd-service/domain/audit"
	// "devops.KweaverAIer-aKweaverAIkweaver-aiDevOps/AnyFabric/_git/task_center/common/settings"
)

// Host:        settings.ConfigInstance.Config.Nsq.Host,
// HttpHost:    settings.ConfigInstance.Config.Nsq.HttpHost,
// LookupdHost: settings.ConfigInstance.Config.Nsq.LookupdHost,
// Channel:     ConfigurationCenterChannel,

func NewWFStarter(wf workflow.WorkflowInterface, _ *http.Client) workflow.WFStarter {
	return wf
}

func NewWorkflow(httpClient *http.Client) (workflow.WorkflowInterface, error) {
	var mqConf *common.MQConf
	// switch settings.ConfigInstance.Config.MQType {
	// case common.MQ_TYPE_NSQ:
	// 	// nsqConf := settings.ConfigInstance.Config.Nsq
	// 	// if nsqConf == nil {
	// 	// 	return nil, errors.New("nsq conf not found")
	// 	// }

	httpHost := settings.ConfigInstance.Config.Nsq.HttpHost
	lookupdHost := settings.ConfigInstance.Config.Nsq.LookupdHost
	Host := settings.ConfigInstance.Config.Nsq.Host
	fmt.Println("start------------------------")
	fmt.Println(httpHost)
	fmt.Println(lookupdHost)
	fmt.Println(Host)

	mqConf = &common.MQConf{
		// MqType:      common.MQ_TYPE_NSQ,
		MqType:      "nsq",
		Host:        Host,
		HttpHost:    httpHost,
		LookupdHost: lookupdHost,
		Channel:     "af.configuration-center",
	}
	// case common.MQ_TYPE_KAFKA:
	// 	fallthrough
	// default: // default mq is kafka
	// kafkaConf := settings.ConfigInstance.DepServices.MQ
	// if kafkaConf == nil {
	// 	return nil, errors.New("kafka conf not found")
	// }

	// Host := kafkaConf.MqHost + ":" + kafkaConf.MqPort
	// mqConf = &common.MQConf{
	// 	MqType:  common.MQ_TYPE_KAFKA,
	// 	Host:    Host,
	// 	Channel: "af_task",
	// 	Version: "2.3.1",
	// 	Sasl: &common.Sasl{
	// 		Enabled:   true,
	// 		Mechanism: kafkaConf.Auth.Mechanism,
	// 		Username:  kafkaConf.Auth.Username,
	// 		Password:  kafkaConf.Auth.Password,
	// 	},
	// Producer: &common.Producer{
	// 	SendBufSize: int32(settings.GetConfig().MQConf.SendBufSize),
	// 	RecvBufSize: int32(settings.GetConfig().MQConf.RecvBufSize),
	// },
	// }
	// }

	// mqConf = &common.MQConf{}
	return workflow.NewWorkflow(httpClient, mqConf)
}
