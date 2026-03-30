package gorm

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/data-application-gateway/infrastructure/repository/db"
	"github.com/kweaver-ai/dsg/services/apps/data-application-gateway/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"go.uber.org/zap"
)

type AppRepo interface {
	Get(ctx context.Context, appId string) (app *model.App, err error)
}

type appRepo struct {
	data *db.Data
}

func NewAppRepo(data *db.Data) AppRepo {
	return &appRepo{data: data}
}

func (r *appRepo) Get(ctx context.Context, appId string) (app *model.App, err error) {
	err = r.data.DB.WithContext(ctx).
		Model(&model.App{}).
		Where(&model.App{AppID: appId}).
		Find(&app).Error

	if err != nil {
		log.WithContext(ctx).Error("appRepo Get", zap.Error(err))
		return nil, err
	}

	return app, nil
}
