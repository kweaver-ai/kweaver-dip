package kafka

import (
	"time"

	"github.com/IBM/sarama"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/settings"
)

func NewSaramaClient() (sarama.Client, error) {
	cfg := sarama.NewConfig()
	cfg.Net.SASL.Enable = settings.ConfigInstance.Config.KafkaMQ.Sasl.Enabled
	if settings.ConfigInstance.Config.KafkaMQ.Sasl.Enabled {
		cfg.Net.SASL.Enable = true
		cfg.Net.SASL.Mechanism = sarama.SASLTypePlaintext
		cfg.Net.SASL.User = settings.ConfigInstance.Config.KafkaMQ.Sasl.User
		cfg.Net.SASL.Password = settings.ConfigInstance.Config.KafkaMQ.Sasl.Password
		cfg.Net.SASL.Handshake = true
	}
	cfg.Producer.Timeout = time.Millisecond * 100
	cfg.Producer.Return.Successes = true
	cfg.Producer.Return.Errors = true

	c, err := sarama.NewClient([]string{settings.ConfigInstance.Config.KafkaMQ.Host}, cfg)
	if err != nil {
		return nil, err
	}
	return c, nil
}
