package callbacks

import (
	"context"
	"encoding/json"

	"github.com/kweaver-ai/dsg/services/apps/data-exploration-service/adapter/driven/mq"
	"github.com/kweaver-ai/dsg/services/apps/data-exploration-service/adapter/driven/mq/kafka"
	"github.com/kweaver-ai/idrm-go-common/database_callback/callback"
)

type EntityChangeTransport struct {
	sender *kafka.KafkaProducer
}

func NewEntityChangeTransport(sender *kafka.KafkaProducer) *EntityChangeTransport {
	return &EntityChangeTransport{
		sender: sender,
	}
}

func (e *EntityChangeTransport) Send(ctx context.Context, body any) error {
	bts, _ := json.Marshal(body)
	return e.sender.SyncProduce(mq.BusinessEntityChangeTopic, nil, bts)
}

func (e *EntityChangeTransport) Process(ctx context.Context, model callback.DataModel, tableName, operation string) (any, error) {
	return model, nil
}
