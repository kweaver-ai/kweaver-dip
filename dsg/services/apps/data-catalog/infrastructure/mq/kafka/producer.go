package kafka

import (
	"errors"
	"time"

	"github.com/Shopify/sarama"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/driver/mq/common"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/settings"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/mq/kafkax"
	"go.uber.org/zap"
)

func NewSyncProducer() (sarama.SyncProducer, error) {
	mqConf := settings.GetConfig().MQConf
	for _, connConf := range mqConf.ConnConfs {
		if connConf.MQType == common.MQ_TYPE_KAFKA {
			conf := sarama.NewConfig()
			conf.Producer.Timeout = 100 * time.Millisecond
			conf.Net.SASL.Enable = true
			conf.Net.SASL.Mechanism = sarama.SASLTypePlaintext
			conf.Net.SASL.User = connConf.User
			conf.Net.SASL.Password = connConf.Password
			conf.Net.SASL.Handshake = true
			conf.Producer.Return.Successes = true
			conf.Producer.Return.Errors = true
			producer, err := sarama.NewSyncProducer([]string{connConf.Addr}, conf)
			if err != nil {
				log.Error("New kafka Producer err", zap.Error(err))
				return nil, err
			}
			return producer, nil
		}
	}
	return nil, errors.New("kafka NewSyncProducer config not exist")
}

func NewXSyncProducer() (kafkax.Producer, error) {
	mqConf := settings.GetConfig().MQConf
	for _, connConf := range mqConf.ConnConfs {
		if connConf.MQType == common.MQ_TYPE_KAFKA {
			producer, err := kafkax.NewSyncProducer(&kafkax.ProducerConfig{
				Addr:      connConf.Addr,
				UserName:  connConf.User,
				Password:  connConf.Password,
				Mechanism: connConf.Mechanism,
			})
			if err != nil {
				log.Error("New kafka Producer err", zap.Error(err))
				return nil, err
			}
			return producer, nil
		}
	}
	return nil, errors.New("kafka NewSyncProducer config not exist")
}
