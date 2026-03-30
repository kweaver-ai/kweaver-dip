package views

import (
	"context"
	"encoding/json"
	"github.com/kweaver-ai/dsg/services/apps/auth-service/adapter/driven/gorm"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/mq/kafkax"

	"go.uber.org/zap"

	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/trace"
)

type SubViewHandler struct {
	authSubView gorm.AuthSubViewRepo
}

func NewSubViewHandler(authSubView gorm.AuthSubViewRepo) *SubViewHandler {
	return &SubViewHandler{
		authSubView: authSubView,
	}
}

func (kc *SubViewHandler) ConsumeSubView(ctx context.Context, msg *kafkax.Message) bool {
	ctx, span := trace.StartConsumerSpan(ctx)
	defer span.End()

	log := log.WithContext(ctx)

	var value KafkaMessageSubView
	if err := json.Unmarshal(msg.Value, &value); err != nil {
		log.Error("unmarshal kafka message's value fail", zap.Error(err), zap.String("topic", msg.Topic), zap.String("key", msg.Key))
		return true
	}

	switch value.Type {
	case ObjectTypeAdded:
		if err := kc.authSubView.Create(ctx, &value.Object); err != nil {
			return false
		}
	case ObjectTypeModified:
		if err := kc.authSubView.Update(ctx, &value.Object); err != nil {
			return false
		}
	case ObjectTypeDeleted:
		if err := kc.authSubView.Delete(ctx, msg.Key); err != nil {
			return false
		}
	default:
		log.Error("unsupported object type", zap.Any("type", value.Type))
	}

	return true
}
