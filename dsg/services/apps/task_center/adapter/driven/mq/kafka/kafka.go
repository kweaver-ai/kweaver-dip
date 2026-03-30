package kafka

import (
	"github.com/IBM/sarama"

	"github.com/kweaver-ai/dsg/services/apps/task_center/common/settings"
)

func NewSaramaClient() (sarama.Client, error) {
	return NewSaramaClientForKafkaConf(&settings.ConfigInstance.KafkaConf)
}

func NewSaramaClientForKafkaConf(conf *settings.KafkaConf) (sarama.Client, error) {
	cfg := settings.NewSaramaConfig(conf)
	return sarama.NewClient([]string{conf.URI}, cfg)
}
