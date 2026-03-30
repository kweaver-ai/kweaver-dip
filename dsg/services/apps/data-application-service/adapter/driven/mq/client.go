package mq

import (
	"fmt"
	"strconv"

	"github.com/IBM/sarama"

	"github.com/kweaver-ai/dsg/services/apps/data-application-service/common/settings"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
)

type MQ struct {
	KafkaClient ProtonMQClient
	NSQClient   ProtonMQClient
	// 用于记录审计日志
	SaramaSyncProducer sarama.SyncProducer
}

func NewMQClient() (*MQ, error) {
	kafkaClient, err := mqClient(settings.Instance.MQ.Kafka)
	if err != nil {
		return nil, err
	}

	NSQClient, err := mqClient(settings.Instance.MQ.NSQ)
	if err != nil {
		return nil, err
	}

	mq := &MQ{
		KafkaClient: kafkaClient,
		NSQClient:   NSQClient,
	}

	addresses, saramaConfig, err := settings.Instance.MQ.Kafka.SaramaConfig()
	if err != nil {
		return nil, err
	}

	if mq.SaramaSyncProducer, err = sarama.NewSyncProducer(addresses, saramaConfig); err != nil {
		return nil, err
	}

	return mq, nil
}

func mqClient(config settings.MQConfig) (ProtonMQClient, error) {
	var (
		mqHost string
		mqPort int
	)

	switch config.Type {
	case "nsq":
		mqHost = config.HttpHost
		mqPort, _ = strconv.Atoi(config.HttpPort)
	case "kafka":
		mqHost = config.Host
		mqPort, _ = strconv.Atoi(config.Port)
	default:
		return nil, fmt.Errorf("unknown msq type %v", config.Type)
	}

	mqLookupdPort, _ := strconv.Atoi(config.LookupdPort)
	client, err := NewProtonMQClient(
		mqHost,
		mqPort,
		config.LookupdHost,
		mqLookupdPort,
		config.Type,
		UserInfo(config.Username, config.Password),
		AuthMechanism(config.Mechanism),
	)
	if err != nil {
		log.Errorf("failed to init kafka client, err info: %v", err.Error())
		return nil, err
	}

	return client, nil
}
