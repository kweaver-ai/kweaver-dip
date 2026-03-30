package impl

import (
	"errors"
	"time"

	"github.com/Shopify/sarama"
	"go.uber.org/zap"

	"github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/mq/datasource"
	kafka_pub "github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/mq/kafka"
	"github.com/kweaver-ai/dsg/services/apps/data-view/common/constant"
	config "github.com/kweaver-ai/dsg/services/apps/data-view/infrastructure/config"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
)

var (
	p *KafkaProducer
)

type KafkaProducer struct {
	// 同步方式的生产者，用于消息可靠推送
	syncProducer sarama.SyncProducer
}

func NewKafkaProducer(bootstrap *config.Bootstrap) (kafka_pub.KafkaPub, error) {
	// 创建 Kafka ClusterAdmin 客户端，用于创建 Topic
	a, err := sarama.NewClusterAdmin([]string{bootstrap.DepServices.KafkaMQ.Host}, getProducerConfig(bootstrap))
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
		// 数据源
		datasource.DataSourceTopic,
		// 逻辑视图
		constant.FormViewPublicTopic,
		// 子视图（行列规则）
		constant.TopicSubView,
		constant.EntityChangeTopic,
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

	producer, err := sarama.NewSyncProducer([]string{bootstrap.DepServices.KafkaMQ.Host}, getProducerConfig(bootstrap))
	if err == nil {
		p = &KafkaProducer{
			syncProducer: producer,
		}
	}
	return p, err
}

func getProducerConfig(bootstrap *config.Bootstrap) *sarama.Config {
	conf := sarama.NewConfig()
	conf.Producer.Timeout = 100 * time.Millisecond
	conf.Net.SASL.Enable = bootstrap.DepServices.KafkaMQ.Sasl.Enabled
	conf.Net.SASL.Mechanism = sarama.SASLTypePlaintext
	conf.Net.SASL.User = bootstrap.DepServices.KafkaMQ.Sasl.Username
	conf.Net.SASL.Password = bootstrap.DepServices.KafkaMQ.Sasl.Password
	conf.Net.SASL.Handshake = true
	conf.Producer.Return.Successes = true
	conf.Producer.Return.Errors = true
	conf.Producer.RequiredAcks = sarama.WaitForAll
	conf.Producer.Partitioner = sarama.NewRandomPartitioner
	return conf
}

func (p *KafkaProducer) SyncProduce(topic string, key []byte, value []byte) error {
	msg := &sarama.ProducerMessage{
		Topic: topic,
		Key:   sarama.ByteEncoder(key),
		Value: sarama.ByteEncoder(value),
	}
	_, _, err := p.syncProducer.SendMessage(msg)
	return err
}

func (p *KafkaProducer) SyncProduceClose() error {
	return p.syncProducer.Close()
}
