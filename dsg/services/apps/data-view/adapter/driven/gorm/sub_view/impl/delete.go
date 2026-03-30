package impl

import (
	"context"

	"github.com/google/uuid"

	"github.com/kweaver-ai/dsg/services/apps/data-view/infrastructure/db/model"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/trace"
)

// Delete implements sub_view.SubViewRepo.
func (s *subViewRepo) Delete(ctx context.Context, id uuid.UUID) error {
	ctx, span := trace.StartInternalSpan(ctx)
	defer span.End()

	tx := s.db.WithContext(ctx).Debug()

	tx = tx.Where(&model.SubView{ID: id}).Delete(&model.SubView{})

	if tx.RowsAffected == 0 {
		return newErrSubViewNotFound(id)
	}

	if tx.Error != nil {
		return newErrSubViewDatabaseError(tx.Error)
	}

	return nil
}
