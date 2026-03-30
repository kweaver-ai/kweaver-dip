package data_catalog_mount_resource

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/model"
	"gorm.io/gorm"
)

type ResourceMountedInfo struct {
	CatalogID uint64 `json:"catalog_id"` // 数据资源目录ID
	ResID     uint64 `json:"res_id"`     // 挂接资源ID
	Code      string `json:"code"`       // 目录编码
}

type RepoOp interface {
	InsertBatch(tx *gorm.DB, ctx context.Context, resources []*model.TDataCatalogResourceMount) error
	UpdateBatch(tx *gorm.DB, ctx context.Context, resources []*model.TDataCatalogResourceMount) (bool, error)
	DeleteBatch(tx *gorm.DB, ctx context.Context, code string, excludeIDs []uint64) (bool, error)
	DeleteIntoHistory(tx *gorm.DB, ctx context.Context, code string) error
	Get(tx *gorm.DB, ctx context.Context, code string, resType int8) ([]*model.TDataCatalogResourceMount, error)
	GetByCodes(tx *gorm.DB, ctx context.Context, codes []string, resType int8) ([]*model.TDataCatalogResourceMount, error)
	GetExistedResource(tx *gorm.DB, ctx context.Context, resType int8, resIDs []string) ([]*model.TDataCatalogResourceMount, error)
}
