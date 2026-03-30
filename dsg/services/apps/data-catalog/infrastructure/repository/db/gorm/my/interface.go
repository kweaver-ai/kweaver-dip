package my

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/model"
	"gorm.io/gorm"
)

type RepoOp interface {
	GetMyApplyList(tx *gorm.DB, ctx context.Context, req *AssetApplyListReqParam) ([]*AssetApplyListRespItem, int64, error)
	GetDownloadApplyModel(tx *gorm.DB, ctx context.Context, applyID uint64) (*model.TDataCatalogDownloadApply, error)
	GetDataCatalogModelWithCode(tx *gorm.DB, ctx context.Context, code string) (*model.TDataCatalog, error)
	//GetDataCatalogModelWithID(tx *gorm.DB, ctx context.Context, catalogID uint64) (*model.TDataCatalog, error)
	//GetAvailableAssetList(tx *gorm.DB, ctx context.Context, req *AvailableAssetListReqParam, catalogIDs []uint64) ([]*AvailableAssetListRespItem, int64, error)
	//GetAvailableAssetList(tx *gorm.DB, ctx context.Context, req *AvailableAssetListReqParam) ([]*AvailableAssetListRespItem, int64, error)
	//GetAvailableAssetDetail(tx *gorm.DB, ctx context.Context, assetID uint64) (dModel *model.TDataCatalog, err error)
}
