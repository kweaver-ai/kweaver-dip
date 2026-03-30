package callbacks

import (
	"context"
	"encoding/json"
	kafka_pub "github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/mq/kafka"
	"github.com/kweaver-ai/dsg/services/apps/data-view/common/constant"
	"github.com/kweaver-ai/idrm-go-common/database_callback/callback"
)

type EntityChangeTransport struct {
	sender kafka_pub.KafkaPub
}

func NewEntityChangeTransport(sender kafka_pub.KafkaPub) *EntityChangeTransport {
	return &EntityChangeTransport{
		sender: sender,
	}
}

func (e *EntityChangeTransport) Send(ctx context.Context, body any) error {
	bts, _ := json.Marshal(body)
	return e.sender.SyncProduce(constant.EntityChangeTopic, nil, bts)
}

func (e *EntityChangeTransport) Process(ctx context.Context, model callback.DataModel, tableName, operation string) (any, error) {
	return model, nil
}
