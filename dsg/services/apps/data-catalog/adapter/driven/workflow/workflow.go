package workflow

import (
	"errors"
	"net/http"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/settings"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/data_catalog"
	data_catalog_frontend "github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/frontend/data_catalog"
	"github.com/kweaver-ai/idrm-go-common/workflow"
	"github.com/kweaver-ai/idrm-go-common/workflow/common"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"go.uber.org/zap"
)

func NewWFStarter(wf workflow.WorkflowInterface,
	_ *data_catalog.DataCatalogDomain,
	_ *data_catalog_frontend.DataCatalogDomain) workflow.WFStarter {
	return wf
}

func NewWorkflow(httpClient *http.Client) (workflow.WorkflowInterface, error) {
	var mqConf *common.MQConf
	switch settings.GetConfig().DepServicesConf.WorkflowMQType {
	case common.MQ_TYPE_NSQ:
		nsqConf := settings.GetConfig().GetMQConnConfByMQType(common.MQ_TYPE_NSQ)
		if nsqConf == nil {
			return nil, errors.New("nsq conf not found")
		}
		mqConf = &common.MQConf{
			MqType:      common.MQ_TYPE_NSQ,
			Host:        nsqConf.Addr,
			HttpHost:    nsqConf.HttpHost,
			LookupdHost: nsqConf.LookupdAddr,
			Channel:     settings.GetConfig().MQConf.Channel,
		}
	case common.MQ_TYPE_KAFKA:
		fallthrough
	default: // default mq is kafka
		kafkaConf := settings.GetConfig().GetMQConnConfByMQType(common.MQ_TYPE_KAFKA)
		if kafkaConf == nil {
			return nil, errors.New("kafka conf not found")
		}
		mqConf = &common.MQConf{
			MqType:  common.MQ_TYPE_KAFKA,
			Host:    kafkaConf.Addr,
			Channel: settings.GetConfig().MQConf.Channel,
			Version: kafkaConf.Version,
			Sasl: &common.Sasl{
				Enabled:   true,
				Mechanism: kafkaConf.MQAuthConf.Mechanism,
				Username:  kafkaConf.MQAuthConf.User,
				Password:  kafkaConf.MQAuthConf.Password,
			},
			Producer: &common.Producer{
				SendBufSize: int32(settings.GetConfig().MQConf.SendBufSize),
				RecvBufSize: int32(settings.GetConfig().MQConf.RecvBufSize),
			},
		}
	}
	res, err := workflow.NewWorkflow(httpClient, mqConf)
	if err != nil {
		log.Error("workflow.NewWorkflow err", zap.Error(err))
		return res, nil
	}
	return res, err
}
