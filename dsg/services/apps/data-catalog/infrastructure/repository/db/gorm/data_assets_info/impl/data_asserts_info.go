package impl

import (
	"context"
	"errors"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/data_assets_info"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/model"
	"gorm.io/gorm"
)

func NewRepo(data *db.Data) data_assets_info.RepoOp {
	return &repo{data: data}
}

type repo struct {
	data *db.Data
}

func (r *repo) do(ctx context.Context) *gorm.DB {
	return r.data.DB.WithContext(ctx)
}

func (r *repo) Update(ctx context.Context, info *model.TDataAssetsInfo) error {
	var model *model.TDataAssetsInfo
	tx := r.data.DB.WithContext(ctx).Begin()
	err := tx.Where("id > 0").Delete(&model).Error
	if err != nil {
		tx.Rollback()
		return err
	}
	err = tx.Create(info).Error
	if err != nil {
		tx.Rollback()
		return err
	}
	return tx.Commit().Error
}

func (r *repo) Get(ctx context.Context) (model *model.TDataAssetsInfo, err error) {
	db := r.data.DB.WithContext(ctx).Table("t_data_assets_info").Scan(&model)
	if errors.Is(db.Error, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	return model, db.Error
}
