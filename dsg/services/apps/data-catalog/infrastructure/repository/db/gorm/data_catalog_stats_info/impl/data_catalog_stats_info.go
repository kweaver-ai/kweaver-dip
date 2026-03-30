package impl

import (
	"context"
	"time"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/util"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/data_catalog_stats_info"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/model"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

func NewRepo(data *db.Data) data_catalog_stats_info.RepoOp {
	return &repo{data: data}
}

type repo struct {
	data *db.Data
}

func (r *repo) do(tx *gorm.DB, ctx context.Context) *gorm.DB {
	if tx == nil {
		return r.data.DB.WithContext(ctx)
	}
	return tx
}

func (r *repo) Insert(tx *gorm.DB, ctx context.Context, code string, applyAddNum, previewAddNum int) error {
	timeNow := &util.Time{time.Now()}
	return r.do(tx, ctx).
		Clauses(clause.OnConflict{
			Columns: []clause.Column{{Name: "code"}},
			DoUpdates: clause.Assignments(map[string]interface{}{
				"apply_num":   gorm.Expr("apply_num + ?", applyAddNum),
				"preview_num": gorm.Expr("preview_num + ?", previewAddNum),
				"updated_at":  timeNow,
			}),
		}).
		Create(&model.TDataCatalogStatsInfo{
			Code:       code,
			ApplyNum:   applyAddNum,
			PreviewNum: previewAddNum,
			CreatedAt:  timeNow,
			UpdatedAt:  timeNow,
		}).Error
}

func (r *repo) Update(tx *gorm.DB, ctx context.Context, code string, applyAddNum, previewAddNum int) error {
	return r.do(tx, ctx).
		Model(&model.TDataCatalogStatsInfo{}).
		Where("code = ?", code).
		UpdateColumns(map[string]interface{}{
			"apply_num":   gorm.Expr("apply_num + ?", applyAddNum),
			"preview_num": gorm.Expr("preview_num + ?", previewAddNum),
			"updated_at":  &util.Time{time.Now()},
		}).Error
}

func (r *repo) Get(tx *gorm.DB, ctx context.Context, code string) ([]*model.TDataCatalogStatsInfo, error) {
	var result []*model.TDataCatalogStatsInfo
	db := r.do(tx, ctx).Model(&model.TDataCatalogStatsInfo{})
	if len(code) > 0 {
		db = db.Where("code = ?", code)
	}
	db = db.Scan(&result)
	return result, db.Error
}
