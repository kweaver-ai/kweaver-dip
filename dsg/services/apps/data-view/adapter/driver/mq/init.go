package mq

import (
	"github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driver/mq/datasource"
	data_explore "github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driver/mq/explore"
	"github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driver/mq/explore_task"
	"github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driver/mq/form_view"
	"github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driver/mq/standardization"
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
func NewMQHandler(mqc MQClient,
	datasource *datasource.DataSourceConsumer,
	de *data_explore.DataExplorationHandler,
	et *explore_task.ExploreTaskHandler,
	f *form_view.FormViewHandler,
	standardization *standardization.Handler,
) MQHandler {
	handler := mqHandler{
		mqClient:        mqc,
		datasource:      datasource,
		de:              de,
		et:              et,
		f:               f,
		standardization: standardization,
	}
	return &handler
}

type mqHandler struct {
	mqClient        MQClient
	datasource      *datasource.DataSourceConsumer
	de              *data_explore.DataExplorationHandler
	et              *explore_task.ExploreTaskHandler
	f               *form_view.FormViewHandler
	standardization *standardization.Handler
}

// MQRegister 注册处理器
func (m *mqHandler) MQRegister() {
	topicFuncMap := make(map[string]func(message []byte) error)

	// 发布-订阅消息
	topicFuncMap["af.configuration-center.datasource"] = m.datasource.ConsumeDatasource
	topicFuncMap[ExploreFinishedTopic] = m.de.ExploreFinishedHandler
	topicFuncMap[AsyncDataExploreTopic] = m.et.AsyncDataExplore
	topicFuncMap[CompletionTopic] = m.f.Completion
	topicFuncMap["af.business-grooming.entity_change"] = m.standardization.StandardChange
	topicFuncMap["af.standardization.dictStatus"] = m.standardization.DictChange
	topicFuncMap[ExploreDataFinishedTopic] = m.de.ExploreDataFinishedHandler
	topicFuncMap[FormViewAuthUpdate] = m.f.UpdateAuthedUsers
	for topic, f := range topicFuncMap {
		m.mqClient.Subscribe(topic, f)
	}
}
