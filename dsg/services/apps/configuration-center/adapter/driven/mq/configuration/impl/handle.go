package impl

import (
	"context"

	jsoniter "github.com/json-iterator/go"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/mq/configuration"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	af_trace "github.com/kweaver-ai/idrm-go-frame/core/telemetry/trace"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/mq/kafkax"
	"go.uber.org/zap"
)

type configurationHandle struct {
	producer kafkax.Producer
}

func NewMQHandleInstance(producer kafkax.Producer) configuration.ConfigurationHandle {
	return &configurationHandle{producer: producer}
}
func (m configurationHandle) SetBusinessDomainLevel(ctx context.Context, message *configuration.BusinessDomainLevelMessage) (err error) {
	ctx, span := af_trace.StartProducerSpan(ctx)
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	log.Infof("【ConfigurationHandle】SetBusinessDomainLevel message:%+v ", message)

	messageByte, err := jsoniter.Marshal(message)
	if err != nil {
		log.WithContext(ctx).Errorf("【ConfigurationHandle】SetBusinessDomainLevel Marshal error", zap.Error(err))
		return err
	}
	if err := m.producer.Send(configuration.BusinessDomainTopic, messageByte); err != nil {
		log.WithContext(ctx).Errorf("【ConfigurationHandle】SetBusinessDomainLevel SendMessage Error")
		return err
	}
	log.Infof("【ConfigurationHandle】SetBusinessDomainLevel SendMessage successs: %s \n", string(messageByte))
	return nil
}
