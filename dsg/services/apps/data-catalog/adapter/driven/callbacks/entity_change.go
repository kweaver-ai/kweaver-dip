package callbacks

import (
	"context"
	"encoding/json"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/driver/mq"
	"github.com/kweaver-ai/idrm-go-common/database_callback/callback"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/mq/kafkax"
)

type EntityChangeTransport struct {
	sender kafkax.Producer
}

func NewEntityChangeTransport(sender kafkax.Producer) *EntityChangeTransport {
	return &EntityChangeTransport{
		sender: sender,
	}
}

func (e *EntityChangeTransport) Send(ctx context.Context, body any) error {
	bts, _ := json.Marshal(body)
	return e.sender.Send(mq.TOPIC_PUB_ENTITY_CHANGE, bts)
}

func (e *EntityChangeTransport) Process(ctx context.Context, model callback.DataModel, tableName, operation string) (any, error) {
	return model, nil
}
