package data_catalog_info

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/model"
	"gorm.io/gorm"
)

type RepoOp interface {
	InsertBatch(tx *gorm.DB, ctx context.Context, infos []*model.TDataCatalogInfo) error
	UpdateBatch(tx *gorm.DB, ctx context.Context, infos []*model.TDataCatalogInfo) (bool, error)
	DeleteBatch(tx *gorm.DB, ctx context.Context, catalogID uint64, excludeIDs []uint64) (bool, error)
	DeleteIntoHistory(tx *gorm.DB, ctx context.Context, catalogID uint64) (bool, error)
	Get(tx *gorm.DB, ctx context.Context, infoTypes []int8, catalogIDS []uint64) ([]*model.TDataCatalogInfo, error)
}
