package gorm

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/data-application-gateway/infrastructure/repository/db"
	"github.com/kweaver-ai/dsg/services/apps/data-application-gateway/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"go.uber.org/zap"
)

type ServiceApplyRepo interface {
	Get(ctx context.Context, uid, serviceID, auditStatus string) (serviceApply *model.ServiceApply, err error)
}

type serviceApplyRepo struct {
	data *db.Data
}

func NewServiceApplyRepo(data *db.Data) ServiceApplyRepo {
	return &serviceApplyRepo{data: data}
}

func (r *serviceApplyRepo) Get(ctx context.Context, uid, serviceID, auditStatus string) (serviceApply *model.ServiceApply, err error) {
	err = r.data.DB.WithContext(ctx).
		Model(&model.ServiceApply{}).
		Where(&model.ServiceApply{
			UID:         uid,
			ServiceID:   serviceID,
			AuditStatus: auditStatus,
		}).
		Find(&serviceApply).Error

	if err != nil {
		log.WithContext(ctx).Error("serviceApplyRepo Get", zap.Error(err))
		return nil, err
	}

	return serviceApply, nil
}
