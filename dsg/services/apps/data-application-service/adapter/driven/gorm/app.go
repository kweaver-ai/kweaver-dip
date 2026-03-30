package gorm

import (
	"context"
	"strings"

	"github.com/google/uuid"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/common/util"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/infrastructure/repository/db"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"go.uber.org/zap"
)

type AppRepo interface {
	Create(ctx context.Context, uid string) (err error)
	Get(ctx context.Context, appId string) (app *model.App, err error)
	GetByUid(ctx context.Context, uid string) (app *model.App, err error)
	Count(ctx context.Context, uid string) (count int64, err error)
}

type appRepo struct {
	data *db.Data
}

func NewAppRepo(data *db.Data) AppRepo {
	return &appRepo{data: data}
}

func (r *appRepo) Create(ctx context.Context, uid string) (err error) {
	count, err := r.Count(ctx, uid)
	if err != nil {
		return err
	}

	if count > 0 {
		return nil
	}

	appId := util.GetUniqueString()
	appSecret := strings.ReplaceAll(uuid.NewString(), "-", "")

	app := &model.App{
		UID:       uid,
		AppID:     appId,
		AppSecret: appSecret,
	}

	tx := r.data.DB.WithContext(ctx).Model(&model.App{}).Create(app)

	if tx.Error != nil {
		log.WithContext(ctx).Error("appRepo Create", zap.Error(tx.Error))
	}

	return nil
}

func (r *appRepo) Get(ctx context.Context, appId string) (app *model.App, err error) {
	//TODO implement me
	panic("implement me")
}

func (r *appRepo) GetByUid(ctx context.Context, uid string) (app *model.App, err error) {
	tx := r.data.DB.WithContext(ctx).
		Model(&model.App{}).
		Where(&model.App{UID: uid}).
		Find(&app)

	if tx.Error != nil {
		log.WithContext(ctx).Error("appRepo GetByUid", zap.Error(tx.Error))
		return nil, err
	}

	return app, nil
}

func (r *appRepo) Count(ctx context.Context, uid string) (count int64, err error) {
	tx := r.data.DB.WithContext(ctx).Model(&model.App{}).
		Where(&model.App{UID: uid}).
		Count(&count)

	if tx.Error != nil {
		log.WithContext(ctx).Error("appRepo Count", zap.Error(tx.Error))
		return 0, tx.Error
	}

	return count, nil
}
