package data_resource

import (
	"context"

	domain "github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/data_resource"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/data_resource_catalog"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/model"
)

type DataResourceRepo interface {
	Create(ctx context.Context, dataResource *model.TDataResource) error
	Update(ctx context.Context, dataResource *model.TDataResource) error
	SyncViewSelect(ctx context.Context, dataResource *model.TDataResource) error
	Save(ctx context.Context, dataResource *model.TDataResource) error
	UpdateInterfaceCount(ctx context.Context, resourceId string, increment int) error
	Delete(ctx context.Context, dataResource *model.TDataResource) error
	CreateInBatches(ctx context.Context, dataResource []*model.TDataResource) error
	DeleteByResourceId(ctx context.Context, resourceId []string) error
	DeleteTransaction(ctx context.Context, resourceId string) (err error)
	GetCount(ctx context.Context, req *domain.GetCountReq) (res *domain.GetCountRes, err error)
	GetDataResourceList(ctx context.Context, req *domain.DataResourceInfoReq) (total int64, res []*model.TDataResource, err error)
	GetViewInterface(ctx context.Context, viewId string, catalogIdNotExist bool) (res []*model.TDataResource, err error)
	QueryDataCatalogResourceList(ctx context.Context, req *domain.DataCatalogResourceListReq) (total int64, dataResource []*model.TDataCatalogResourceWithName, err error)
	GetByCatalogId(ctx context.Context, catalogId uint64) (dataResource []*model.TDataResource, err error)
	GetByDraftCatalogId(ctx context.Context, draftCatalogId uint64) (dataResource []*model.TDataResource, err error)
	GetByCatalogIds(ctx context.Context, catalogId ...uint64) (dataResource []*model.TDataResource, err error)
	GetByResourceId(ctx context.Context, resourceId string) (dataResource *model.TDataResource, err error)
	GetByResourceIds(ctx context.Context, resourceId []string, resourceType int8, viewIdNotExist *bool) (dataResource []*model.TDataResource, err error)
	GetByName(ctx context.Context, resourceName string, resourceType int8) (dataResource []*model.TDataResource, err error)
	GetResourceAndCatalog(ctx context.Context, resourceIds []string) (res []*data_resource_catalog.DataCatalogWithMount, err error)
	GetApiBody(ctx context.Context, catalogId uint64) (res []*model.TApi, err error)
	Count(ctx context.Context) (res *CountRes, err error)
	GetByResourceType(ctx context.Context, resourceType int8) (res []*model.TDataResource, err error)
}

type CountRes struct {
	ViewCount       int64
	ApiCount        int64
	FileCount       int64 //文件数量
	ManualFormCount int64 //手工表数量

	ViewMount       int64
	ApiMount        int64
	FileMount       int64 //文件挂载数量
	ManualFormMount int64 //手工表挂载数量

}
