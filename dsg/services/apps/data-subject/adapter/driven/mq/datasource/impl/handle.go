package impl

import (
	"context"

	"github.com/Shopify/sarama"
	jsoniter "github.com/json-iterator/go"
	"github.com/kweaver-ai/dsg/services/apps/data-subject/adapter/driven/mq/datasource"
	"github.com/kweaver-ai/dsg/services/apps/data-subject/common/util"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	af_trace "github.com/kweaver-ai/idrm-go-frame/core/telemetry/trace"
	"go.uber.org/zap"
)

type datasourcHandle struct {
	producer sarama.SyncProducer
}

func NewMQHandleInstance(producer sarama.SyncProducer) datasource.DataSourceHandle {
	return &datasourcHandle{producer: producer}
}
func (m datasourcHandle) CreateDataSource(ctx context.Context, payload *datasource.DatasourcePayload) (err error) {
	ctx, span := af_trace.StartProducerSpan(ctx)
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	log.Infof("【DataSourceHandle】CreateDataSource payload:%+v ", *payload)
	message := &datasource.DatasourceMessage{
		Payload: payload,
		Header: &datasource.DatasourceHeader{
			Method: "create",
		},
	}
	messageByte, err := jsoniter.Marshal(message)
	if err != nil {
		log.WithContext(ctx).Errorf("【DataSourceHandle】CreateDataSource Marshal error", zap.Error(err))
		return err
	}
	partition, offset, err := m.producer.SendMessage(&sarama.ProducerMessage{
		Topic: datasource.DataSourceTopic,
		Key:   sarama.ByteEncoder(util.StringToBytes(payload.ID)),
		Value: sarama.ByteEncoder(messageByte),
	})
	if err != nil {
		log.WithContext(ctx).Errorf("【DataSourceHandle】CreateDataSource SendMessage Error")
		return err
	}
	log.Infof("【DataSourceHandle】CreateDataSource SendMessage partition=%d, offset=%d \n", partition, offset)
	return nil
}
