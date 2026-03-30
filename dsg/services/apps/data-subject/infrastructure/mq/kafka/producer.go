package kafka

import (
	"time"

	"github.com/Shopify/sarama"
	my_config "github.com/kweaver-ai/dsg/services/apps/data-subject/infrastructure/config"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"go.uber.org/zap"
)

func NewSyncProducer(c *my_config.Bootstrap) (sarama.SyncProducer, error) {
	addrs := []string{c.DepServices.KafkaMQ.Host}
	conf := sarama.NewConfig()
	conf.Producer.Timeout = 100 * time.Millisecond
	conf.Net.SASL.Enable = c.DepServices.KafkaMQ.Sasl.Enabled
	conf.Net.SASL.Mechanism = sarama.SASLTypePlaintext
	conf.Net.SASL.User = c.DepServices.KafkaMQ.Sasl.Username
	conf.Net.SASL.Password = c.DepServices.KafkaMQ.Sasl.Password
	conf.Net.SASL.Handshake = true
	conf.Producer.Return.Successes = true
	conf.Producer.Return.Errors = true
	producer, err := sarama.NewSyncProducer(addrs, conf)
	if err != nil {
		log.Error("New kafka Producer err", zap.Error(err))
		return nil, err
	}
	return producer, nil
}
func NewSyncProducerMock() (sarama.SyncProducer, error) {
	return nil, nil
}
