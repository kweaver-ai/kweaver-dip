package mq

import (
	"github.com/kweaver-ai/dsg/services/apps/data-exploration-service/adapter/driven/mq/data_exploration_handler"
)

// MQHandler 消息队列处理接口
type MQHandler interface {
	//MQRegister  注册处理器处理mq消息
	MQRegister()
}

// MQClient MQ客户端接口
type MQClient interface {
	Subscribe(topic string, cmd func(message []byte) error)
}

// NewMQHandler 创建MQHandler
func NewMQHandler(mqc MQClient, dh *data_exploration_handler.DataExplorationHandler) MQHandler {
	handler := mqHandler{
		mqClient: mqc,
		dh:       dh,
	}
	return &handler
}

type mqHandler struct {
	mqClient MQClient
	dh       *data_exploration_handler.DataExplorationHandler
}

// MQRegister 注册处理器
func (m *mqHandler) MQRegister() {
	topicFuncMap := make(map[string]func(message []byte) error)

	// 发布-订阅消息
	//topicFuncMap[AsyncDataExplorationTopic] = m.dh.AsyncExplorationHandler
	//topicFuncMap[VirtualEngineExploreDataTopic] = m.dh.ExplorationResultHandler
	topicFuncMap[VirtualEngineAsyncQueryResultTopic] = m.dh.AsyncExplorationDataResultHandler
	topicFuncMap[DeleteExploreTaskTopic] = m.dh.DeleteExploreTaskHandler
	topicFuncMap[QualityReportTopic] = m.dh.ThirdPartyExplorationDataResultHandler
	for topic, f := range topicFuncMap {
		m.mqClient.Subscribe(topic, f)
	}
}
