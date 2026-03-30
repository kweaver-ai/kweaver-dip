package kafka

import (
	"errors"
	"time"

	"github.com/Shopify/sarama"
	"go.uber.org/zap"

	"github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driver/mq"
	my_config "github.com/kweaver-ai/dsg/services/apps/data-view/infrastructure/config"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
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

	// 创建 Kafka ClusterAdmin 客户端，用于创建 Topic
	a, err := sarama.NewClusterAdmin(addrs, conf)
	if err != nil {
		return nil, err
	}
	defer a.Close()

	// 获取已经存在的 Kafka Topic
	topics, err := a.ListTopics()
	if err != nil {
		return nil, err
	}

	// 创建 Topic，如果存在则跳过
	for _, t := range []string{
		mq.AsyncDataExploreTopic,
	} {
		// 跳过已经存在的 Topic
		if _, ok := topics[t]; ok {
			continue
		}
		// 创建 Topic
		if err := a.CreateTopic(t, &sarama.TopicDetail{NumPartitions: 1, ReplicationFactor: 1}, false); errors.Is(err, sarama.ErrTopicAlreadyExists) {
			log.Warn("create kafka topic fail", zap.Error(err), zap.String("topic", t))
			continue
		}
	}

	producer, err := sarama.NewSyncProducer(addrs, conf)
	if err != nil {
		log.Error("New kafka Producer err", zap.Error(err))
		return nil, err
	}
	return producer, nil
}
func NewSyncProducerMock(c *my_config.Bootstrap) (sarama.SyncProducer, error) {
	return nil, nil
}
