package data_catalog_column

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/models/request"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/data_resource_catalog"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/model"
	"gorm.io/gorm"
)

type RepoOp interface {
	InsertBatch(tx *gorm.DB, ctx context.Context, columns []*model.TDataCatalogColumn) error
	UpdateBatch(tx *gorm.DB, ctx context.Context, columns []*model.TDataCatalogColumn) (bool, error)
	DeleteBatch(tx *gorm.DB, ctx context.Context, catalogID uint64, excludeIDs []uint64) (bool, error)
	DeleteIntoHistory(tx *gorm.DB, ctx context.Context, catalogID uint64) (bool, error)
	Get(tx *gorm.DB, ctx context.Context, catalogID uint64) ([]*model.TDataCatalogColumn, error)
	GetByPage(ctx context.Context, req data_resource_catalog.CatalogColumnPageInfo) (total int64, result []*model.TDataCatalogColumn, err error)
	GetList(tx *gorm.DB, ctx context.Context, catalogID uint64,
		keyword string, page *request.PageBaseInfo) ([]*model.TDataCatalogColumn, int64, error)
	GetByCatalogIDs(tx *gorm.DB, ctx context.Context, ids []uint64) ([]*model.TDataCatalogColumn, error)
	ListByOpenType(tx *gorm.DB, ctx context.Context, catalogId uint64, openTypes []int, ids []uint64) ([]*model.TDataCatalogColumn, error)
	UpdateAIDescBatch(tx *gorm.DB, ctx context.Context, columns []*model.TDataCatalogColumn) (bool, error)
	GetByIDs(ctx context.Context, columnIDs []uint64) (result []*model.TDataCatalogColumn, err error)
	GetByResourceID(ctx context.Context, id string) (result []*model.TDataCatalogColumn, err error)
}
