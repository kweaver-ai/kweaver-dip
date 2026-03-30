package callbacks

import (
	"context"
	"encoding/json"

	"github.com/Shopify/sarama"
	"github.com/kweaver-ai/dsg/services/apps/data-subject/adapter/driven/mq"
	"github.com/kweaver-ai/idrm-go-common/database_callback/callback"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
)

type EntityChangeTransport struct {
	sender sarama.SyncProducer
}

func NewEntityChangeTransport(sender sarama.SyncProducer) *EntityChangeTransport {
	return &EntityChangeTransport{
		sender: sender,
	}
}

func (e *EntityChangeTransport) Send(ctx context.Context, body any) error {
	bts, _ := json.Marshal(body)
	msg := &sarama.ProducerMessage{
		Topic: mq.BusinessEntityChangeTopic,
		Key:   nil,
		Value: sarama.ByteEncoder(bts),
	}
	partition, offset, err := e.sender.SendMessage(msg)
	if err != nil {
		log.Errorf("【EntityChangeSender】Send SendMessage Error")
		return err
	}
	log.Infof("【EntityChangeSender】 SendMessage partition=%d, offset=%d \n", partition, offset)
	return nil
}

func (e *EntityChangeTransport) Process(ctx context.Context, model callback.DataModel, tableName, operation string) (any, error) {
	return model, nil
}
