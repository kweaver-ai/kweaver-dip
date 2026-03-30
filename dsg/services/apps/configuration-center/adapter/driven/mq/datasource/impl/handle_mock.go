package impl

import (
	"context"

	"github.com/Shopify/sarama"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/mq/datasource"
)

type datasourcHandleMock struct {
	producer sarama.SyncProducer
}

func NewMQHandleInstanceMock(producer sarama.SyncProducer) datasource.DataSourceHandle {
	return &datasourcHandleMock{producer: producer}
}
func (m datasourcHandleMock) CreateDataSource(ctx context.Context, payload *datasource.DatasourcePayload) error {
	return nil
}

func (m datasourcHandleMock) UpdateDataSource(ctx context.Context, payload *datasource.DatasourcePayload) error {
	return nil
}

func (m datasourcHandleMock) DeleteDataSource(ctx context.Context, payload *datasource.DatasourcePayload) error {
	return nil
}
