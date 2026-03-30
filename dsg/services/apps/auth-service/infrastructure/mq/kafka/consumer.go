package kafka

import (
	"github.com/kweaver-ai/TelemetrySDK-Go/exporter/v2/ar_trace"
	"github.com/kweaver-ai/dsg/services/apps/auth-service/common/settings"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/mq/kafkax"
)

func NewConsumer() kafkax.Consumer {
	s := settings.Instance
	return kafkax.NewConsumerService(&kafkax.ConsumerConfig{
		Version:   s.Kafka.Version,
		Addr:      s.Kafka.URI,
		ClientID:  s.Kafka.ClientId,
		UserName:  s.Kafka.Username,
		Password:  s.Kafka.Password,
		GroupID:   s.Kafka.GroupId,
		Mechanism: s.Kafka.Mechanism,
		Trace:     ar_trace.Tracer,
	})
}
