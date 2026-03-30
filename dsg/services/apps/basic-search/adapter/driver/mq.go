package driver

import (
	"context"

	"github.com/kweaver-ai/TelemetrySDK-Go/exporter/v2/ar_trace"
	"github.com/kweaver-ai/dsg/services/apps/basic-search/adapter/driver/data_catalog"
	"github.com/kweaver-ai/dsg/services/apps/basic-search/adapter/driver/data_view"
	"github.com/kweaver-ai/dsg/services/apps/basic-search/adapter/driver/elec_license"
	"github.com/kweaver-ai/dsg/services/apps/basic-search/adapter/driver/indicator"
	"github.com/kweaver-ai/dsg/services/apps/basic-search/adapter/driver/info_catalog"
	"github.com/kweaver-ai/dsg/services/apps/basic-search/adapter/driver/interface_svc"
	"github.com/kweaver-ai/dsg/services/apps/basic-search/common/settings"
	"github.com/kweaver-ai/dsg/services/apps/basic-search/domain/info_system"
	"github.com/kweaver-ai/idrm-go-common/reconcile"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/mq/kafkax"
)

const (
	topicDataCatalogIndex          = "af.data-catalog.es-index"
	topicMetadataManageIndexUpdate = "af.metadata-manage.es-index.update"
	// 接口服务 Topic的名称
	topicInterfaceSvcIndex = "af.interface-svc.es-index"
	// 数据视图 topic的名称
	topicDataViewIndex = "af.data-view.es-index"
	// 数据视图 topic的名称
	topicIndicatorIndex = "af.indicator.es-index"
	// 信息资源目录 topic的名称
	topicInfoCatalogIndex = "af.info-catalog.es-index"
	// 电子证照目录 topic的名称
	topicElecLicenseIndex = "af.elec-license.es-index"
	// topic 格式 af.{服务}.{版本}.{资源}
	topicAFConfigurationCenterV1InfoSystems = "af.configuration-center.v1.info-systems"
)

type MQConsumerService struct {
	kafkax.Consumer

	dataCatalogConsumer  data_catalog.Consumer
	interfaceSvcConsumer interface_svc.Consumer
	dataViewConsumer     data_view.Consumer
	indicatorConsumer    indicator.Consumer
	infoCatalogConsumer  info_catalog.Consumer
	elecLicenseConsumer  elec_license.Consumer
	// 信息系统
	infoSystem info_system.Interface
}

func NewMQConsumeService(
	cfg *settings.Config,
	interfaceSvcConsumer interface_svc.Consumer,
	dataCatalogConsumer data_catalog.Consumer,
	dataViewConsumer data_view.Consumer,
	indicatorConsumer indicator.Consumer,
	infoCatalogConsumer info_catalog.Consumer,
	elecLicenseConsumer elec_license.Consumer,
	infoSystem info_system.Interface,
) *MQConsumerService {
	m := &MQConsumerService{
		Consumer: kafkax.NewConsumerService(&kafkax.ConsumerConfig{
			Version:   cfg.KafkaConf.Version,
			Addr:      cfg.KafkaConf.URI,
			ClientID:  cfg.KafkaConf.ClientId,
			UserName:  cfg.KafkaConf.Username,
			Password:  cfg.KafkaConf.Password,
			GroupID:   cfg.KafkaConf.GroupId,
			Mechanism: "PLAIN",
			Trace:     ar_trace.Tracer,
		}),
		dataCatalogConsumer:  dataCatalogConsumer,
		interfaceSvcConsumer: interfaceSvcConsumer,
		dataViewConsumer:     dataViewConsumer,
		indicatorConsumer:    indicatorConsumer,
		infoCatalogConsumer:  infoCatalogConsumer,
		elecLicenseConsumer:  elecLicenseConsumer,
		infoSystem:           infoSystem,
	}
	m.RegisterHandles()
	return m
}

func (h *MQConsumerService) Start(ctx context.Context) error {
	return h.Consumer.Start(ctx)
}

func (h *MQConsumerService) Stop(ctx context.Context) error {
	return h.Consumer.Stop(ctx)
}

func (h *MQConsumerService) RegisterHandles() {
	h.Consumer.RegisterHandles(h.dataCatalogConsumer.Index, topicDataCatalogIndex)
	h.Consumer.RegisterHandles(h.dataCatalogConsumer.UpdateTableRows, topicMetadataManageIndexUpdate)
	h.Consumer.RegisterHandles(h.interfaceSvcConsumer.Index, topicInterfaceSvcIndex)
	h.Consumer.RegisterHandles(h.dataViewConsumer.Index, topicDataViewIndex)
	h.Consumer.RegisterHandles(h.indicatorConsumer.Index, topicIndicatorIndex)
	h.Consumer.RegisterHandles(h.infoCatalogConsumer.Index, topicInfoCatalogIndex)
	h.Consumer.RegisterHandles(h.elecLicenseConsumer.Index, topicElecLicenseIndex)
	// topic 格式 af.{服务}.{版本}.{资源}
	h.Consumer.RegisterHandles(reconcile.NewKafkaMsgHandleFunc(h.infoSystem), topicAFConfigurationCenterV1InfoSystems)
}
