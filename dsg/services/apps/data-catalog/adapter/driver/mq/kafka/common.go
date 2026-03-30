package kafka

import (
	"time"

	"github.com/Shopify/sarama"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/driver/mq/common"
)

func getProducerConfig(p common.MQProducerInterface) *sarama.Config {
	conf := sarama.NewConfig()
	conf.Producer.Timeout = 100 * time.Millisecond
	if len(p.Mechanism()) > 0 {
		conf.Net.SASL.Enable = true
		conf.Net.SASL.Mechanism = sarama.SASLMechanism(p.Mechanism())
		conf.Net.SASL.User = p.UserName()
		conf.Net.SASL.Password = p.Password()
		conf.Net.SASL.Handshake = true
	}
	conf.Producer.Return.Successes = true
	conf.Producer.Return.Errors = true
	return conf
}
