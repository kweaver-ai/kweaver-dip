package impl

import (
	"context"

	"github.com/google/uuid"

	"github.com/kweaver-ai/dsg/services/apps/data-view/domain/sub_view"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/trace"
)

// Get implements sub_view.SubViewUseCase.
func (s *subViewUseCase) Get(ctx context.Context, id uuid.UUID) (*sub_view.SubView, error) {
	ctx, span := trace.StartInternalSpan(ctx)
	defer span.End()

	m, err := s.subViewRepo.Get(ctx, id)
	if err != nil {
		return nil, err
	}

	result := &sub_view.SubView{}
	sub_view.UpdateSubViewByModel(result, m)

	return result, nil
}

// GetLogicViewID implements sub_view.SubViewUseCase.
func (s *subViewUseCase) GetLogicViewID(ctx context.Context, id uuid.UUID) (uuid.UUID, error) {
	ctx, span := trace.StartInternalSpan(ctx)
	defer span.End()

	return s.subViewRepo.GetLogicViewID(ctx, id)
}
