package kafka

import (
	"github.com/Shopify/sarama"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/settings"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/mq/kafkax"
)

func NewSyncProducer() (kafkax.Producer, error) {
	mechanism := ""
	if settings.ConfigInstance.Config.KafkaMQ.Sasl.Enabled {
		mechanism = sarama.SASLTypePlaintext
	}
	producer, err := kafkax.NewSyncProducer(&kafkax.ProducerConfig{
		Addr:      settings.ConfigInstance.Config.KafkaMQ.Host,
		UserName:  settings.ConfigInstance.Config.KafkaMQ.Sasl.User,
		Password:  settings.ConfigInstance.Config.KafkaMQ.Sasl.Password,
		Mechanism: mechanism,
	})
	return producer, err
}

func NewSyncProducerMock() (sarama.SyncProducer, error) {
	return nil, nil
}
