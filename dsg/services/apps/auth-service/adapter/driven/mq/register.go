package mq

import (
	"github.com/kweaver-ai/dsg/services/apps/auth-service/adapter/driven/mq/views"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/mq/kafkax"
)

type KafkaConsumer struct {
	kafkax.Consumer
	view *views.SubViewHandler
}

func NewKafkaConsumer(
	consumer kafkax.Consumer,
	view *views.SubViewHandler,
) *KafkaConsumer {
	kc := &KafkaConsumer{
		Consumer: consumer,
		view:     view,
	}
	kc.Register()
	return kc
}

func (k *KafkaConsumer) Register() {
	k.RegisterHandles(k.view.ConsumeSubView, "af.data-view.sub-view")
	////cdc 注册
	//k.RegisterHandles(kafkax.Wrap(k.cdc.AFConfigurationObject), "af.cdc.af_configuration.object")
	//k.RegisterHandles(kafkax.Wrap(k.cdc.AFConfigurationUser), "af.cdc.af_configuration.user")
	//k.RegisterHandles(kafkax.Wrap(k.cdc.AfMainFormView), "af.cdc.af_main.form_view")
	//k.RegisterHandles(kafkax.Wrap(k.cdc.AFMainSubjectDomain), "af.cdc.af_main.subject_domain")
	//k.RegisterHandles(kafkax.Wrap(k.cdc.DataApplicationServiceService), "af.cdc.data_application_service.service")
}
