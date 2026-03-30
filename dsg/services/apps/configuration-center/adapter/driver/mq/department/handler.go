package department

import (
	"context"
	"encoding/json"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/business_structure"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	af_trace "github.com/kweaver-ai/idrm-go-frame/core/telemetry/trace"
	"go.uber.org/zap"
)

type Handler struct {
	businessStructureUserCase business_structure.UseCase
}

func NewHandler(
	businessStructureUserCase business_structure.UseCase,
) *Handler {
	return &Handler{
		businessStructureUserCase: businessStructureUserCase,
	}
}

// CreateDepartmentMessage implements the Handler interface.
func (d *Handler) CreateDepartmentMessage(m []byte) (err error) {
	ctx, span := af_trace.StartProducerSpan(context.Background())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	if len(m) == 0 {
		// Returning nil will automatically send a FIN command to NSQ to mark the message as processed.
		// In this case, a message with an empty body is simply ignored/discarded.
		return nil
	}
	msg := &CreateDepartmentMessage{}
	err = json.Unmarshal(m, msg)
	if err != nil {
		log.WithContext(ctx).Error("unmarshal message body error", zap.Error(err))
		return nil
	}
	// Returning a non-nil error will automatically send a REQ command to NSQ to re-queue the message.
	return d.businessStructureUserCase.HandleDepartmentCreate(ctx, msg.ID, msg.Name)
}

// DeleteDepartmentMessage implements the Handler interface.
func (d *Handler) DeleteDepartmentMessage(m []byte) (err error) {
	ctx, span := af_trace.StartProducerSpan(context.Background())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	if len(m) == 0 {
		// Returning nil will automatically send a FIN command to NSQ to mark the message as processed.
		// In this case, a message with an empty body is simply ignored/discarded.
		return nil
	}
	msg := &DeleteDepartmentMessage{}
	err = json.Unmarshal(m, msg)
	if err != nil {
		log.WithContext(ctx).Error("unmarshal message body error", zap.Error(err))
		return nil
	}
	// Returning a non-nil error will automatically send a REQ command to NSQ to re-queue the message.
	return d.businessStructureUserCase.HandleDepartmentDelete(ctx, msg.ID)
}

// MoveDepartmentMessage implements the Handler interface.
func (d *Handler) MoveDepartmentMessage(m []byte) (err error) {
	ctx, span := af_trace.StartProducerSpan(context.Background())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	if len(m) == 0 {
		// Returning nil will automatically send a FIN command to NSQ to mark the message as processed.
		// In this case, a message with an empty body is simply ignored/discarded.
		return nil
	}
	msg := &MoveDepartmentMessage{}
	err = json.Unmarshal(m, msg)
	if err != nil {
		log.WithContext(ctx).Error("unmarshal message body error", zap.Error(err))
		return nil
	}
	// Returning a non-nil error will automatically send a REQ command to NSQ to re-queue the message.
	return d.businessStructureUserCase.HandleDepartmentMove(ctx, msg.ID, msg.NewPathId)
}
