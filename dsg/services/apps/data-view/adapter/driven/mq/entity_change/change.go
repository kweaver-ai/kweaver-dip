package entity_change

import (
	kafka_pub "github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/mq/kafka"
	"github.com/kweaver-ai/dsg/services/apps/data-view/common/constant"
	"github.com/kweaver-ai/dsg/services/apps/data-view/infrastructure/db/model"
	"github.com/kweaver-ai/idrm-go-common/database_callback/entity_change"
)

var cognitiveSearchDataViewGraph = []entity_change.GormModel{
	new(model.FormView),      //视图
	new(model.FormViewField), //视图字段
}

var cognitiveSearchDataCatalogGraph = []entity_change.GormModel{
	new(model.FormView),      //视图
	new(model.FormViewField), //视图字段
}

var smartRecommendGraph = []entity_change.GormModel{
	new(model.FormView),      //视图
	new(model.FormViewField), //视图字段
}

type EntityChangeSender struct {
	entity_change.EntityGraphMap
	sender kafka_pub.KafkaPub
}

func NewEntityChangeSender(s kafka_pub.KafkaPub) entity_change.MessageSender {
	entityGraphMap := entity_change.NewEntityGraphMap()
	//数据资源版
	entityGraphMap.Record(entity_change.CognitiveSearchDataResourceGraph, cognitiveSearchDataViewGraph)
	//数据目录版
	entityGraphMap.Record(entity_change.CognitiveSearchDataCatalogGraph, cognitiveSearchDataCatalogGraph)
	//智能推荐图谱
	entityGraphMap.Record(entity_change.SmartRecommendationGraph, smartRecommendGraph)
	return &EntityChangeSender{sender: s, EntityGraphMap: entityGraphMap}
}

func (e *EntityChangeSender) Send(body []byte) error {
	return e.sender.SyncProduce(constant.EntityChangeTopic, nil, body)
}
