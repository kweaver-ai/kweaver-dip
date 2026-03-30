package impl

import (
	"context"
	"errors"

	"github.com/google/uuid"
	"gorm.io/gorm"

	"github.com/kweaver-ai/dsg/services/apps/data-view/infrastructure/db/model"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/trace"
)

// Get implements sub_view.SubViewRepo.
func (s *subViewRepo) Get(ctx context.Context, id uuid.UUID) (*model.SubView, error) {
	ctx, span := trace.StartInternalSpan(ctx)
	defer span.End()

	tx := s.db.WithContext(ctx).Debug()

	subView := &model.SubView{ID: id}
	if err := tx.Where(subView).Take(subView).Error; errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, newErrSubViewNotFound(id)
	} else if err != nil {
		return nil, newErrSubViewDatabaseError(err)
	}

	return subView, nil
}

// GetLogicViewID implements sub_view.SubViewRepo.
func (s *subViewRepo) GetLogicViewID(ctx context.Context, id uuid.UUID) (uuid.UUID, error) {
	ctx, span := trace.StartInternalSpan(ctx)
	defer span.End()

	subView := &model.SubView{ID: id}
	tx := s.db.WithContext(ctx).Select("logic_view_id").Where(subView).Take(subView)
	if errors.Is(tx.Error, gorm.ErrRecordNotFound) {
		return uuid.Nil, newErrSubViewNotFound(id)
	} else if tx.Error != nil {
		return uuid.Nil, newErrSubViewDatabaseError(tx.Error)
	}

	return subView.LogicViewID, nil
}
