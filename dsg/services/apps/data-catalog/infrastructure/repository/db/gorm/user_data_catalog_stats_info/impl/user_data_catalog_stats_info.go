package impl

import (
	"context"
	"errors"
	"time"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/util"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/user_data_catalog_stats_info"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/model"
	"gorm.io/gorm"
)

var _ user_data_catalog_stats_info.RepoOp = (*repo)(nil)

func NewRepo(data *db.Data) user_data_catalog_stats_info.RepoOp {
	return &repo{data: data}
}

type repo struct {
	data *db.Data
}

func (r *repo) Insert(tx *gorm.DB, ctx context.Context, code, userID string) error {
	time := &util.Time{Time: time.Now()}
	return r.do(tx, ctx).
		Create(&model.TUserDataCatalogStatsInfo{
			Code:       code,
			UserID:     userID,
			PreviewNum: 1,
			CreatedAt:  time,
			UpdatedAt:  time,
		}).Error
}

func (r *repo) GetOneByCodeAndUserID(tx *gorm.DB, ctx context.Context, code, userID string) (statsModel *model.TUserDataCatalogStatsInfo, err error) {
	db := r.do(tx, ctx).Model(&model.TUserDataCatalogStatsInfo{}).Where("code = ? and user_id = ?", code, userID).First(&statsModel)
	if db.Error != nil {
		if errors.Is(db.Error, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, db.Error
	}
	return statsModel, nil
}

func (r *repo) UpdatePreViewNum(tx *gorm.DB, ctx context.Context, id uint64, previewNum int) (bool, error) {
	statsModel := &model.TUserDataCatalogStatsInfo{PreviewNum: previewNum, UpdatedAt: &util.Time{Time: time.Now()}}
	db := r.do(tx, ctx).Where("id = ?", id).Updates(statsModel)
	return db.RowsAffected > 0, db.Error
}

//func (r *repo) GetUvOfCode(tx *gorm.DB, ctx context.Context, code string) (count int64, err error) {
//	db := r.do(tx, ctx).Where("code = ?", code).Count(&count)
//	return count, db.Error
//}

func (r *repo) do(tx *gorm.DB, ctx context.Context) *gorm.DB {
	if tx == nil {
		return r.data.DB.WithContext(ctx)
	}
	return tx
}
