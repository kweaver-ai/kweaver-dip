package callbacks

import (
	"context"
	"encoding/json"

	"github.com/kweaver-ai/dsg/services/apps/data-application-service/adapter/driven/mq"
	"github.com/kweaver-ai/idrm-go-common/database_callback/callback"
)

type EntityChangeTransport struct {
	sender *mq.MQ
}

func NewEntityChangeTransport(sender *mq.MQ) *EntityChangeTransport {
	return &EntityChangeTransport{
		sender: sender,
	}
}

func (e *EntityChangeTransport) Send(ctx context.Context, body any) error {
	bts, _ := json.Marshal(body)
	return e.sender.KafkaClient.Pub(mq.TopicGraphEntityChange, bts)
}

func (e *EntityChangeTransport) Process(ctx context.Context, model callback.DataModel, tableName, operation string) (any, error) {
	return model, nil
}
