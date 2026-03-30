package kafka

import (
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/settings"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/mq/kafkax"
	"go.uber.org/zap"
)

func NewSyncProducer() (kafkax.Producer, error) {
	producer, err := kafkax.NewSyncProducer(&kafkax.ProducerConfig{
		Addr:      settings.ConfigInstance.KafkaConf.URI,
		UserName:  settings.ConfigInstance.KafkaConf.Username,
		Password:  settings.ConfigInstance.KafkaConf.Password,
		Mechanism: settings.ConfigInstance.KafkaConf.Mechanism,
	})
	if err != nil {
		log.Error("NewSyncProducer ", zap.Error(err))
	}
	return producer, err
}
