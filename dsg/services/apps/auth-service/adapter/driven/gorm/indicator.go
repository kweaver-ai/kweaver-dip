package gorm

import (
	"context"
	"errors"
	"github.com/kweaver-ai/dsg/services/apps/auth-service/infrastructure/repository/db"

	"gorm.io/gorm"

	"github.com/kweaver-ai/dsg/services/apps/auth-service/infrastructure/repository/db/model"
)

type IndicatorRepo interface {
	// 获取指定指标的名称和 Owner
	GetNameAndOwner(ctx context.Context, id int) (*model.TechnicalIndicatorWithNameAndOwner, error)
}

type indicatorRepo struct {
	db *gorm.DB
}

func NewIndicatorRepo(db *db.DatabaseAFDataModel) IndicatorRepo {
	return &indicatorRepo{db: (*gorm.DB)(db)}
}

// GetNameAndOwner implements IndicatorRepo.
func (r *indicatorRepo) GetNameAndOwner(ctx context.Context, id int) (*model.TechnicalIndicatorWithNameAndOwner, error) {
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
