package gorm

import (
	"context"
	"errors"
	"github.com/kweaver-ai/dsg/services/apps/auth-service/infrastructure/repository/db"

	"gorm.io/gorm"

	"github.com/kweaver-ai/dsg/services/apps/auth-service/infrastructure/repository/db/model"
)

type TTechnicalIndicatorRepo interface {
	Get(ctx context.Context, id uint64) (*model.TTechnicalIndicator, error)
	GetNameAndOwner(ctx context.Context, id int) (*model.TechnicalIndicatorWithNameAndOwner, error)
}

type tTechnicalIndicatorRepo struct {
	db *gorm.DB
}

func NewTTechnicalIndicatorRepo(db *db.DatabaseAFDataModel) TTechnicalIndicatorRepo {
	return &tTechnicalIndicatorRepo{db: (*gorm.DB)(db)}
}

// Get implements TTechnicalIndicatorRepo.
func (r *tTechnicalIndicatorRepo) Get(ctx context.Context, id uint64) (*model.TTechnicalIndicator, error) {
	result := &model.TTechnicalIndicator{ID: id}
	if err := r.db.WithContext(ctx).Take(result).Error; err != nil {
		return nil, err
	}
	return result, nil
}

func (r *tTechnicalIndicatorRepo) GetNameAndOwner(ctx context.Context, id int) (*model.TechnicalIndicatorWithNameAndOwner, error) {
	indicator := &model.TechnicalIndicatorWithNameAndOwner{ID: id}
	tx := r.db.WithContext(ctx).
		Model(&model.TechnicalIndicator{}).
		Where(&model.TechnicalIndicator{ID: id}).
		Take(indicator)

	if errors.Is(tx.Error, gorm.ErrRecordNotFound) {
		return nil, ErrNotFound
	} else if tx.Error != nil {
		return nil, newPublicDatabaseError(tx)
	}
	return indicator, nil
}
