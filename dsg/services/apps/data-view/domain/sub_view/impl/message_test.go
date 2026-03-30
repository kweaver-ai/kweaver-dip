package impl

import (
	"context"
	"fmt"

	datasourceRepo "github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/gorm/datasource"
	kafka_pub "github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/mq/kafka"
	"github.com/kweaver-ai/dsg/services/apps/data-view/infrastructure/db/model"
)

type fakeDatasourceRepo struct{}

// GetByName implements datasource.DatasourceRepo.
func (f *fakeDatasourceRepo) GetByName(ctx context.Context, name string) (datasource *model.Datasource, err error) {
	panic("unimplemented")
}

// CreateDataSource implements datasource.DatasourceRepo.
func (f *fakeDatasourceRepo) CreateDataSource(ctx context.Context, ds *model.Datasource) error {
	panic("unimplemented")
}

// CreateDataSources implements datasource.DatasourceRepo.
func (f *fakeDatasourceRepo) CreateDataSources(ctx context.Context, ds []*model.Datasource) error {
	panic("unimplemented")
}

// DeleteDataSource implements datasource.DatasourceRepo.
func (f *fakeDatasourceRepo) DeleteDataSource(ctx context.Context, id string) error {
	panic("unimplemented")
}

// GetAll implements datasource.DatasourceRepo.
func (f *fakeDatasourceRepo) GetAll(ctx context.Context) ([]*model.Datasource, error) {
	panic("unimplemented")
}

// GetByDataSourceIds implements datasource.DatasourceRepo.
func (f *fakeDatasourceRepo) GetByDataSourceIds(ctx context.Context, ids []string) (datasources []*model.Datasource, err error) {
	panic("unimplemented")
}

// GetById implements datasource.DatasourceRepo.
func (f *fakeDatasourceRepo) GetById(ctx context.Context, id string) (datasource *model.Datasource, err error) {
	panic("unimplemented")
}

func (f *fakeDatasourceRepo) GetByIdWithCode(ctx context.Context, id string) (*model.Datasource, error) {
	panic("unimplemented")
}

// GetByIds implements datasource.DatasourceRepo.
func (f *fakeDatasourceRepo) GetByIds(ctx context.Context, ids []string) (datasources []*model.Datasource, err error) {
	panic("unimplemented")
}

// GetCatalogSchemaViewName implements datasource.DatasourceRepo.
func (f *fakeDatasourceRepo) GetCatalogSchemaViewName(ctx context.Context, fv *model.FormView) (string, error) {
	return fmt.Sprintf("fake_catalog.fake_schema.%s", fv.TechnicalName), nil
}

// GetDataSourcesByType implements datasource.DatasourceRepo.
func (f *fakeDatasourceRepo) GetDataSourcesByType(ctx context.Context, dataBaseTypes []string) (datasources []*model.Datasource, err error) {
	panic("unimplemented")
}

// GetScannedDataSources implements datasource.DatasourceRepo.
func (f *fakeDatasourceRepo) GetScannedDataSources(ctx context.Context, scanner string, datasourceTypes string) (res []*datasourceRepo.GetScannedDataSourcesRes, err error) {
	panic("unimplemented")
}

// MetadataTaskId implements datasource.DatasourceRepo.
func (f *fakeDatasourceRepo) MetadataTaskId(ctx context.Context, datasource *model.Datasource) error {
	panic("unimplemented")
}

// UpdateDataSource implements datasource.DatasourceRepo.
func (f *fakeDatasourceRepo) UpdateDataSource(ctx context.Context, ds *model.Datasource) error {
	panic("unimplemented")
}

// UpdateDataSourceStatus implements datasource.DatasourceRepo.
func (f *fakeDatasourceRepo) UpdateDataSourceStatus(ctx context.Context, datasource *model.Datasource) error {
	panic("unimplemented")
}

// UpdateDataSourceStatusAndMetadataTaskId implements datasource.DatasourceRepo.
func (f *fakeDatasourceRepo) UpdateDataSourceStatusAndMetadataTaskId(ctx context.Context, datasource *model.Datasource) error {
	panic("unimplemented")
}

// UpdateDataSourceView implements datasource.DatasourceRepo.
func (f *fakeDatasourceRepo) UpdateDataSourceView(ctx context.Context, datasource *model.Datasource) error {
	panic("unimplemented")
}

var _ datasourceRepo.DatasourceRepo = &fakeDatasourceRepo{}

type fakeKafkaPub struct {
}

// SyncProduce implements kafka_pub.KafkaPub.
func (f *fakeKafkaPub) SyncProduce(topic string, key, value []byte) error {
	fmt.Printf("produce message:\n  topic: %s\n  key: %s\n  value: %s\n", topic, key, value)
	return nil
}

var _ kafka_pub.KafkaPub = &fakeKafkaPub{}
