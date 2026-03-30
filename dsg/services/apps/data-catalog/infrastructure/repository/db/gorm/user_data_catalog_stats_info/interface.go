package user_data_catalog_stats_info

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/model"
	"gorm.io/gorm"
)

type RepoOp interface {
	GetOneByCodeAndUserID(tx *gorm.DB, ctx context.Context, code, userID string) (statsModel *model.TUserDataCatalogStatsInfo, err error)
	Insert(tx *gorm.DB, ctx context.Context, code, userID string) error
	UpdatePreViewNum(tx *gorm.DB, ctx context.Context, id uint64, previewNum int) (bool, error)
}
