package gorm

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/data-application-gateway/infrastructure/repository/db"
	"github.com/kweaver-ai/dsg/services/apps/data-application-gateway/infrastructure/repository/db/model"
)

type ServiceCallRecordRepo interface {
	Create(ctx context.Context, record *model.ServiceCallRecord) error
}

type serviceCallRecordRepo struct {
	data *db.Data
}

func NewServiceCallRecordRepo(
	data *db.Data,
) ServiceCallRecordRepo {
	return &serviceCallRecordRepo{
		data: data,
	}
}

func (r *serviceCallRecordRepo) Create(ctx context.Context, record *model.ServiceCallRecord) error {
	if record == nil {
		return nil
	}

	return r.data.DB.WithContext(ctx).Create(record).Error
}
