package points

import (
	"context"
	"encoding/json"

	pmr "github.com/kweaver-ai/dsg/services/apps/task_center/domain/points_management"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	af_trace "github.com/kweaver-ai/idrm-go-frame/core/telemetry/trace"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/mq/kafkax"
	"go.uber.org/zap"
)

type PointsEventHandler struct {
	service pmr.PointsManagement
}

func NewPointsEventHandler(service pmr.PointsManagement) *PointsEventHandler {
	return &PointsEventHandler{
		service: service,
	}
}

// DeleteRoleHandler  a
func (m *PointsEventHandler) PointsEventPubHandler(ctx context.Context, message *kafkax.Message) error {
	var err error
	ctx, span := af_trace.StartProducerSpan(ctx)
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	msg := new(pmr.PointsEventPub)
	if err := json.Unmarshal(message.Value, msg); err != nil {
		log.WithContext(ctx).Error("consumer DeleteRoleHandler Unmarshal", zap.Error(err))
		return err
	}
	log.WithContext(ctx).Infof("consumer receive roleId:%v:%v", msg.Type, msg.PointObject)
	m.service.PointsEventCreate(ctx, msg)
	return nil
}
