package data_catalog_stats_info

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/model"
	"gorm.io/gorm"
)

type RepoOp interface {
	Insert(tx *gorm.DB, ctx context.Context, code string, applyAddNum, previewAddNum int) error
	Update(tx *gorm.DB, ctx context.Context, code string, applyAddNum, previewAddNum int) error
	Get(tx *gorm.DB, ctx context.Context, code string) ([]*model.TDataCatalogStatsInfo, error)
}
