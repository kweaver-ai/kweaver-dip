package kafka

import (
	"github.com/Shopify/sarama"
	"github.com/kweaver-ai/TelemetrySDK-Go/exporter/v2/ar_trace"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/settings"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/mq/kafkax"
)

func NewConsumer() kafkax.Consumer {
	mechanism := ""
	if settings.ConfigInstance.Config.KafkaMQ.Sasl.Enabled {
		mechanism = sarama.SASLTypePlaintext
	}
	Consumer := kafkax.NewConsumerService(&kafkax.ConsumerConfig{
		Version:   "2.3.1",
		Addr:      settings.ConfigInstance.Config.KafkaMQ.Host,
		ClientID:  settings.ConfigInstance.Config.KafkaMQ.ClientID,
		UserName:  settings.ConfigInstance.Config.KafkaMQ.Sasl.User,
		Password:  settings.ConfigInstance.Config.KafkaMQ.Sasl.Password,
		GroupID:   settings.ConfigInstance.Config.KafkaMQ.GroupID,
		Mechanism: mechanism,
		Trace:     ar_trace.Tracer,
	})
	return Consumer
}
