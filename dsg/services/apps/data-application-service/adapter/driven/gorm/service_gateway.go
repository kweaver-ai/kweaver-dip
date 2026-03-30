package gorm

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/data-application-service/infrastructure/repository/db"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"go.uber.org/zap"
)

type ServiceGatewayRepo interface {
	Get(ctx context.Context) (gateway *model.ServiceGateway, err error)
	GetServiceAddress(ctx context.Context, serviceID string) (serviceAddress string, err error)
}

type serviceGateway struct {
	data *db.Data
}

func NewServiceGateway(data *db.Data) ServiceGatewayRepo {
	return &serviceGateway{data: data}
}

func (r *serviceGateway) Get(ctx context.Context) (gateway *model.ServiceGateway, err error) {
	tx := r.data.DB.WithContext(ctx).Model(&model.ServiceGateway{}).Find(&gateway)
	if tx.Error != nil {
		log.WithContext(ctx).Error("ServiceGet", zap.Error(tx.Error))
		return nil, err
	}

	return gateway, nil
}

func (r *serviceGateway) GetServiceAddress(ctx context.Context, serviceID string) (serviceAddress string, err error) {
	gateway := &model.ServiceGateway{}
	tx := r.data.DB.WithContext(ctx).Model(&model.ServiceGateway{}).Find(&gateway)
	if tx.Error != nil {
		log.WithContext(ctx).Error("ServiceGet", zap.Error(tx.Error))
		return "", err
	}

	var servicePath string
	r.data.DB.WithContext(ctx).Model(&model.Service{}).
		Select("service_path").
		Where(&model.Service{ServiceID: serviceID}).
		Pluck("service_path", &servicePath)

	serviceAddress = gateway.GatewayURL + servicePath

	return serviceAddress, nil
}
