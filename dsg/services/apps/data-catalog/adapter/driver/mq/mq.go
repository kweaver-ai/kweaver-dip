package mq

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"sync"
	"syscall"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/driver/mq/common"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/settings"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/util"
)

const (
	TOPIC_PUB_KAFKA_ES_INDEX_ASYNC = "af.data-catalog.es-index"
	TOPIC_PUB_NSQ_AUDIT_APPLY      = "workflow.audit.apply"
	TOPIC_PUB_NSQ_AUDIT_CANCEL     = "workflow.audit.cancel"
	TOPIC_PUB_ENTITY_CHANGE        = "af.business-grooming.entity_change"       //实体变更消息
	TOPIC_DATA_PUSH_TASK_EXECUTING = "af.data-catalog.data-push-task-executing" //数据推送任务执行
)

type MQManager struct {
	mqs map[string]map[int]map[string]interface{}
}

var (
	mqManager *MQManager
	stopCh    chan os.Signal
	once      = new(sync.Once)
)

func NewMQManager() (*MQManager, error) {
	once.Do(func() {
		stopCh = make(chan os.Signal)
		signal.Notify(stopCh, syscall.SIGTERM, syscall.SIGQUIT, syscall.SIGINT)
		mqManager = new(MQManager)
		mqManager.mqs = make(map[string]map[int]map[string]interface{})
	})
	_, err := MQInitProducer()
	if err != nil {
		return nil, err
	}
	return mqManager, nil
}

func (mqm *MQManager) setProducer(mqType, topic string, producer interface{}) {
	m := mqm.mqs[mqType]
	if m == nil {
		m = map[int]map[string]interface{}{
			common.MQ_PRODUCER: {topic: producer},
		}
		mqm.mqs[mqType] = m
	} else if m[common.MQ_PRODUCER] == nil {
		m[common.MQ_PRODUCER] = map[string]interface{}{topic: producer}
	} else {
		m[common.MQ_PRODUCER][topic] = producer
	}
}

func (mqm *MQManager) setConsumer(mqType, topic string, consumer interface{}) {
	m := mqm.mqs[mqType]
	if m == nil {
		m = map[int]map[string]interface{}{
			common.MQ_CONSUMER: {topic: consumer},
		}
		mqm.mqs[mqType] = m
	} else if m[common.MQ_CONSUMER] == nil {
		m[common.MQ_CONSUMER] = map[string]interface{}{topic: consumer}
	} else {
		m[common.MQ_CONSUMER][topic] = consumer
	}
}

func (mqm *MQManager) GetProducer(mqType, topic string) common.MQProducer {
	if m := mqm.mqs[mqType]; m != nil {
		if mp := m[common.MQ_PRODUCER]; mp != nil && mp[topic] != nil {
			return mp[topic].(common.MQProducer)
		}
	}
	return nil
}

func NsqTopicCreate(httpHost string, topics []string) error {
	for i := range topics {
		reqUrl := fmt.Sprintf("http://%s/topic/create?topic=%s", httpHost, topics[i])
		_, err := util.DoHttpPost(context.Background(), reqUrl, nil, http.NoBody)
		if err != nil {
			return err
		}
	}
	return nil
}

func MQInitProducer() (*MQManager, error) {
	var err error
	var obj interface{}
	mqConf := settings.GetConfig().MQConf
	for idx := range mqConf.ConnConfs {
		conf := common.NewMQConfig(mqConf, idx)
		switch conf.MQType() {
		case common.MQ_TYPE_KAFKA:
			if obj, err = NewAsyncProducer(conf, TOPIC_PUB_KAFKA_ES_INDEX_ASYNC); err == nil {
				mqManager.setProducer(conf.MQType(), TOPIC_PUB_KAFKA_ES_INDEX_ASYNC, obj)
			}
		case common.MQ_TYPE_NSQ:

		default:
			err = fmt.Errorf("unknown mq type: %s", conf.MQType())
		}
		if err != nil {
			close(stopCh)
			mqManager.mqs = nil
			mqManager = nil
			break
		}
	}

	return mqManager, err
}
