package impl

import (
	"context"

	"github.com/google/uuid"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/domain/sub_service"

	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/trace"
)

// Get implements sub_service.SubServiceUseCase.
func (s *subServiceUseCase) Get(ctx context.Context, id uuid.UUID) (*sub_service.SubService, error) {
	ctx, span := trace.StartInternalSpan(ctx)
	defer span.End()

	m, err := s.subServiceRepo.Get(ctx, id)
	if err != nil {
		return nil, err
	}

	return sub_service.GenSubServiceByModel(m), nil
}

// GetServiceID implements sub_service.SubServiceUseCase.
func (s *subServiceUseCase) GetServiceID(ctx context.Context, id uuid.UUID) (uuid.UUID, error) {
	ctx, span := trace.StartInternalSpan(ctx)
	defer span.End()

	return s.subServiceRepo.GetServiceID(ctx, id)
}
