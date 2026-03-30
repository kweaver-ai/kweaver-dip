package callbacks

import (
	"context"

	jsoniter "github.com/json-iterator/go"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/mq/kafka"
	"github.com/kweaver-ai/idrm-go-common/database_callback/callback"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/mq/kafkax"
)

type EntityChangeTransport struct {
	producer kafkax.Producer
}

func NewEntityChangeTransport(producer kafkax.Producer) *EntityChangeTransport {
	return &EntityChangeTransport{
		producer: producer,
	}
}

func (e *EntityChangeTransport) Send(ctx context.Context, body any) error {
	messageByte, err := jsoniter.Marshal(body)
	if err != nil {
		return err
	}
	err = e.producer.Send(kafka.EntityChangeTopic, messageByte)
	if err != nil {
		return err
	}
	log.Infof("【EntityChangeTransport】 SendMessage success %v \n", string(messageByte))
	return nil
}

func (e *EntityChangeTransport) Process(ctx context.Context, model callback.DataModel, tableName, operation string) (any, error) {
	return model, nil
}
