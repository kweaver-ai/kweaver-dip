package impl

import (
	"context"

	jsoniter "github.com/json-iterator/go"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/mq/datasource"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/util"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	af_trace "github.com/kweaver-ai/idrm-go-frame/core/telemetry/trace"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/mq/kafkax"
	"go.uber.org/zap"
)

type datasourceHandle struct {
	producer kafkax.Producer
}

func NewMQHandleInstance(producer kafkax.Producer) datasource.DataSourceHandle {
	return &datasourceHandle{producer: producer}
}
func (m datasourceHandle) CreateDataSource(ctx context.Context, payload *datasource.DatasourcePayload) (err error) {
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
	err = m.producer.SendWithKey(datasource.DataSourceTopic, util.StringToBytes(payload.ID), messageByte)
	if err != nil {
		log.WithContext(ctx).Errorf("【DataSourceHandle】CreateDataSource SendMessage Error")
		return err
	}
	log.Infof("【DataSourceHandle】CreateDataSource SendMessage successs: %s \n", string(messageByte))
	return nil
}

func (m datasourceHandle) UpdateDataSource(ctx context.Context, payload *datasource.DatasourcePayload) (err error) {
	ctx, span := af_trace.StartProducerSpan(ctx)
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	log.Infof("【DataSourceHandle】UpdateDataSource payload:%+v ", *payload)
	message := &datasource.DatasourceMessage{
		Payload: payload,
		Header: &datasource.DatasourceHeader{
			Method: "update",
		},
	}
	messageByte, err := jsoniter.Marshal(message)
	if err != nil {
		log.WithContext(ctx).Errorf("【DataSourceHandle】UpdateDataSource Marshal error", zap.Error(err))
		return err
	}
	err = m.producer.SendWithKey(datasource.DataSourceTopic, util.StringToBytes(payload.ID), messageByte)
	if err != nil {
		log.WithContext(ctx).Errorf("【DataSourceHandle】UpdateDataSource SendMessage Error")
		return err
	}
	log.Infof("【DataSourceHandle】UpdateDataSource SendMessage success: %v \n", string(messageByte))
	return nil
}

func (m datasourceHandle) DeleteDataSource(ctx context.Context, payload *datasource.DatasourcePayload) (err error) {
	ctx, span := af_trace.StartProducerSpan(ctx)
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	log.Infof("【DataSourceHandle】DeleteDataSource payload:%+v ", *payload)
	message := &datasource.DatasourceMessage{
		Payload: payload,
		Header: &datasource.DatasourceHeader{
			Method: "delete",
		},
	}
	messageByte, err := jsoniter.Marshal(message)
	if err != nil {
		log.WithContext(ctx).Errorf("【DataSourceHandle】DeleteDataSource Marshal error", zap.Error(err))
		return err
	}
	err = m.producer.SendWithKey(datasource.DataSourceTopic, util.StringToBytes(payload.ID), messageByte)
	if err != nil {
		log.WithContext(ctx).Errorf("【DataSourceHandle】DeleteDataSource SendMessage Error")
		return err
	}
	log.Infof("【DataSourceHandle】DeleteDataSource SendMessage success %s \n", string(messageByte))
	return nil
}
