package kafka

import (
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/driver/mq/apply_num"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/driver/mq/entity_change"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/driver/mq/interface_catalog"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/mq/kafka"
)

type MqHandler struct {
	consumer                *kafka.Consumer
	entityChangeHandler     *entity_change.EntityChangeHandler
	interfaceCatalogHandler *interface_catalog.InterfaceCatalogHandler
	ApplyNumHandler         *apply_num.ApplyNumHandler
}

func NewMqHandler(consumer *kafka.Consumer,
	entityChangeHandler *entity_change.EntityChangeHandler,
	interfaceCatalogHandler *interface_catalog.InterfaceCatalogHandler,
	ApplyNumHandler *apply_num.ApplyNumHandler,
) *MqHandler {
	return &MqHandler{
		consumer:                consumer,
		entityChangeHandler:     entityChangeHandler,
		interfaceCatalogHandler: interfaceCatalogHandler,
		ApplyNumHandler:         ApplyNumHandler,
	}
}

func (m *MqHandler) MQRegister() {
	topicFuncMap := make(map[string]func(message []byte) error)

	topicFuncMap["af.business-grooming.entity_change"] = m.entityChangeHandler.EntityChange
	topicFuncMap["af.interface-svc.catalog"] = m.interfaceCatalogHandler.InterfaceCatalog
	topicFuncMap["af.es-index.apply-num.update"] = m.ApplyNumHandler.UpdateApplyNumComplete

	for topic, f := range topicFuncMap {
		m.consumer.Subscribe(topic, f)
	}
}
