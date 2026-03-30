package datasource

import (
	"context"

	domain "github.com/kweaver-ai/dsg/services/apps/data-view/domain/form_view"

	"github.com/kweaver-ai/dsg/services/apps/data-view/infrastructure/db/model"
)

type DatasourceRepo interface {
	CreateDataSource(ctx context.Context, ds *model.Datasource) error
	CreateDataSources(ctx context.Context, ds []*model.Datasource) error
	UpdateDataSource(ctx context.Context, ds *model.Datasource) error
	DeleteDataSource(ctx context.Context, id string) error
	GetById(ctx context.Context, id string) (datasource *model.Datasource, err error)
	GetByIdWithCode(ctx context.Context, id string) (datasource *model.Datasource, err error)
	GetByName(ctx context.Context, name string) (datasource *model.Datasource, err error)
	GetByIds(ctx context.Context, ids []string) (datasources []*model.Datasource, err error)
	GetByDataSourceIds(ctx context.Context, ids []string) (datasources []*model.Datasource, err error)
	GetDataSourcesByType(ctx context.Context, dataBaseTypes []string) (datasources []*model.Datasource, err error)
	GetDataSourcesBySourceType(ctx context.Context, sourceTypes []int32) (datasources []*model.Datasource, err error)
	GetDataSourcesByInfoSystemID(ctx context.Context, infoSystemID string) (datasources []*model.Datasource, err error)
	GetDataSourcesByInfoSystemIDISNull(ctx context.Context) (datasources []*model.Datasource, err error)
	UpdateDataSourceView(ctx context.Context, datasource *model.Datasource) error
	UpdateDataSourceStatus(ctx context.Context, datasource *model.Datasource) error
	MetadataTaskId(ctx context.Context, datasource *model.Datasource) error
	UpdateDataSourceStatusAndMetadataTaskId(ctx context.Context, datasource *model.Datasource) error
	GetAll(ctx context.Context) ([]*model.Datasource, error)
	GetDataSources(ctx context.Context, req *domain.GetDatasourceListReq) (res []*model.Datasource, err error)
	// 获取获取逻辑视图的完整名称（暂定），格式 catalog.schema.view
	GetCatalogSchemaViewName(ctx context.Context, fv *model.FormView) (string, error)
}
