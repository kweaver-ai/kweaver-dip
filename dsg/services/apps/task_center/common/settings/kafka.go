package settings

import (
	"time"

	"github.com/IBM/sarama"
)

func NewSaramaConfig(conf *KafkaConf) *sarama.Config {
	cfg := sarama.NewConfig()
	cfg.Producer.Timeout = 100 * time.Millisecond
	if conf.Mechanism != "" {
		cfg.Net.SASL.Enable = true
		cfg.Net.SASL.Mechanism = sarama.SASLMechanism(conf.Mechanism)
		cfg.Net.SASL.User = conf.Username
		cfg.Net.SASL.Password = conf.Password
		cfg.Net.SASL.Handshake = true
	}
	cfg.Producer.Return.Successes = true
	cfg.Producer.Return.Errors = true
	return cfg
}
