package kafka

import (
	"github.com/kweaver-ai/TelemetrySDK-Go/exporter/v2/ar_trace"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/settings"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/mq/kafkax"
)

func NewConsumer() kafkax.Consumer {
	Consumer := kafkax.NewConsumerService(&kafkax.ConsumerConfig{
		Version:   settings.ConfigInstance.KafkaConf.Version,
		Addr:      settings.ConfigInstance.KafkaConf.URI,
		ClientID:  settings.ConfigInstance.KafkaConf.ClientId,
		UserName:  settings.ConfigInstance.KafkaConf.Username,
		Password:  settings.ConfigInstance.KafkaConf.Password,
		GroupID:   settings.ConfigInstance.KafkaConf.GroupId,
		Mechanism: settings.ConfigInstance.KafkaConf.Mechanism,
		Trace:     ar_trace.Tracer,
	})
	return Consumer
}
