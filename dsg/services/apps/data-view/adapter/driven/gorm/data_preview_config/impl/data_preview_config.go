package impl

import (
	"context"
	"errors"
	"github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/gorm/data_preview_config"
	"github.com/kweaver-ai/dsg/services/apps/data-view/infrastructure/db/model"
	"github.com/kweaver-ai/idrm-go-common/errorcode"
	"gorm.io/gorm"
)

func NewDataPreviewConfigRepo(db *gorm.DB) data_preview_config.DataPreviewConfigRepo {
	return &dataPreviewConfigRepo{db: db}
}

type dataPreviewConfigRepo struct {
	db *gorm.DB
}

func (r *dataPreviewConfigRepo) SaveDataPreviewConfig(ctx context.Context, m *model.DataPreviewConfig) (err error) {
	var dataPreviewConfig model.DataPreviewConfig
	db := r.db.WithContext(ctx).Model(&model.DataPreviewConfig{})
	err = db.Where("form_view_id = ? and creator_uid = ?", m.FormViewID, m.CreatorUID).First(&dataPreviewConfig).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			if err = r.db.WithContext(ctx).Model(&model.DataPreviewConfig{}).Create(&m).Error; err != nil {
				return errorcode.Detail(errorcode.PublicDatabaseError, db.Error)
			} else {
				return nil
			}
		}
		return errorcode.Detail(errorcode.PublicDatabaseError, db.Error)
	}
	err = db.Where("form_view_id = ? and creator_uid = ?", m.FormViewID, m.CreatorUID).UpdateColumn("config", m.Config).Error
	if err != nil {
		return errorcode.Detail(errorcode.PublicDatabaseError, db.Error)
	}
	return nil
}

func (r *dataPreviewConfigRepo) Get(ctx context.Context, formViewId, userId string) (*model.DataPreviewConfig, error) {
	var m *model.DataPreviewConfig
	err := r.db.WithContext(ctx).Model(&model.DataPreviewConfig{}).Where("form_view_id = ? and creator_uid = ?", formViewId, userId).First(&m).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return &model.DataPreviewConfig{
				FormViewID: formViewId,
				Config:     "",
				CreatorUID: userId,
			}, nil
		}
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	return m, err
}
