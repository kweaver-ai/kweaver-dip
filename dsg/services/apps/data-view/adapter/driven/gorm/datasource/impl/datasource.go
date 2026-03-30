package impl

import (
	"context"
	"errors"
	"fmt"

	my_errorcode "github.com/kweaver-ai/dsg/services/apps/data-view/common/errorcode"
	domain "github.com/kweaver-ai/dsg/services/apps/data-view/domain/form_view"
	"github.com/kweaver-ai/idrm-go-common/errorcode"
	"github.com/kweaver-ai/idrm-go-frame/core/enum"

	"go.uber.org/zap"
	"gorm.io/gorm"

	"github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/gorm/datasource"
	"github.com/kweaver-ai/dsg/services/apps/data-view/common/constant"
	"github.com/kweaver-ai/dsg/services/apps/data-view/infrastructure/db/model"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
)

type datasourceRepo struct {
	db *gorm.DB
}

func NewDatasourceRepo(db *gorm.DB) datasource.DatasourceRepo {
	return &datasourceRepo{db: db}
}
func (d *datasourceRepo) CreateDataSource(ctx context.Context, ds *model.Datasource) error {
	return d.db.Debug().WithContext(ctx).Create(ds).Error
}
func (d *datasourceRepo) CreateDataSources(ctx context.Context, ds []*model.Datasource) error {
	return d.db.Debug().WithContext(ctx).Create(ds).Error
}
func (d *datasourceRepo) UpdateDataSource(ctx context.Context, ds *model.Datasource) error {
	return d.db.WithContext(ctx).Where("id=? ", ds.ID).Updates(ds).Error
}
func (d *datasourceRepo) DeleteDataSource(ctx context.Context, id string) error {
	return d.db.WithContext(ctx).Where("id=? ", id).Delete(&model.Datasource{}).Error
}
func (d *datasourceRepo) GetById(ctx context.Context, id string) (datasource *model.Datasource, err error) {
	err = d.db.WithContext(ctx).Where("id=? ", id).Take(&datasource).Error
	return
}
func (d *datasourceRepo) GetByIdWithCode(ctx context.Context, id string) (datasource *model.Datasource, err error) {
	err = d.db.WithContext(ctx).Where("id=? ", id).Take(&datasource).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errorcode.Desc(my_errorcode.DataSourceIDNotExist)
		}
		return nil, errorcode.Detail(my_errorcode.DatabaseError, err.Error())
	}
	return
}
func (d *datasourceRepo) GetByName(ctx context.Context, name string) (datasource *model.Datasource, err error) {
	err = d.db.WithContext(ctx).Where("name=? ", name).Take(&datasource).Error
	return
}
func (d *datasourceRepo) GetByIds(ctx context.Context, ids []string) (datasources []*model.Datasource, err error) {
	err = d.db.WithContext(ctx).Where("id in ?", ids).Find(&datasources).Error
	return
}
func (d *datasourceRepo) GetByDataSourceIds(ctx context.Context, ids []string) (datasources []*model.Datasource, err error) {
	err = d.db.WithContext(ctx).Where("data_source_id in ?", ids).Find(&datasources).Error
	return
}
func (d *datasourceRepo) GetDataSourcesByType(ctx context.Context, datasourceTypes []string) (datasources []*model.Datasource, err error) {
	err = d.db.WithContext(ctx).Where("type_name in ?", datasourceTypes).Find(&datasources).Error
	return
}

func (d *datasourceRepo) GetDataSourcesBySourceType(ctx context.Context, sourceTypes []int32) (datasources []*model.Datasource, err error) {
	err = d.db.WithContext(ctx).Where("source_type in ?", sourceTypes).Find(&datasources).Error
	return
}

func (d *datasourceRepo) GetDataSourcesByInfoSystemID(ctx context.Context, infoSystemID string) (datasources []*model.Datasource, err error) {
	err = d.db.WithContext(ctx).Where("info_system_id = ?", infoSystemID).Find(&datasources).Error
	return
}

func (d *datasourceRepo) GetDataSourcesByInfoSystemIDISNull(ctx context.Context) (datasources []*model.Datasource, err error) {
	err = d.db.WithContext(ctx).Where("info_system_id IS NULL OR info_system_id = ''").Find(&datasources).Error
	return
}

func (d *datasourceRepo) UpdateDataSourceView(ctx context.Context, datasource *model.Datasource) error {
	return d.db.WithContext(ctx).Table(model.TableNameDatasource).Select("data_view_source").Where("id=? ", datasource.ID).Updates(datasource).Error
}
func (d *datasourceRepo) UpdateDataSourceStatus(ctx context.Context, datasource *model.Datasource) error {
	return d.db.WithContext(ctx).Table(model.TableNameDatasource).Select("status").Where("id=? ", datasource.ID).Updates(datasource).Error
}
func (d *datasourceRepo) MetadataTaskId(ctx context.Context, datasource *model.Datasource) error {
	return d.db.WithContext(ctx).Select("metadata_task_id").Where("id=? ", datasource.ID).Updates(datasource).Error
}
func (d *datasourceRepo) UpdateDataSourceStatusAndMetadataTaskId(ctx context.Context, datasource *model.Datasource) error {
	return d.db.WithContext(ctx).Select("status", "metadata_task_id").Where("id=? ", datasource.ID).Updates(datasource).Error
}

/*
func (d *datasourceRepo) DataSourceScanRecord(ctx context.Context, datasource *model.Datasource, taskId string) error {
	if taskId == "" {
		taskId = constant.ManagementScanner
	}
	resErr := d.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Table(model.TableNameDatasource).Select("data_view_source").Where("id=? ", datasource.ID).Updates(datasource).Error; err != nil {
			log.WithContext(ctx).Error("【datasourceRepo】DataSourceScanRecord Updates error", zap.Error(err))
			return err
		}
		if err := tx.Create(&model.ScanRecord{
			DatasourceID: datasource.ID,
			Scanner:      taskId,
			ScanTime:     time.Now(),
		}).Error; err != nil {
			log.WithContext(ctx).Error("【datasourceRepo】DataSourceScanRecord Create error", zap.Error(err))
			return err
		}
		return nil
	})
	if resErr != nil {
		log.WithContext(ctx).Error("【datasourceRepo】DataSourceScanRecord Transaction error", zap.Error(resErr))
		return resErr
	}
	return nil
}
*/

func (d *datasourceRepo) GetAll(ctx context.Context) (res []*model.Datasource, err error) {
	err = d.db.WithContext(ctx).Find(&res).Error
	return
}

func (d *datasourceRepo) GetDataSources(ctx context.Context, req *domain.GetDatasourceListReq) (res []*model.Datasource, err error) {
	do := d.db.WithContext(ctx).Table("datasource d ").Order("updated_at desc")
	// 过滤掉不需要的数据源类型 Anyshare 7.0(anyshare7)、听云(tingyun)、OpenSearch(opensearch)
	do = do.Where("d.type_name not in ?", []string{"anyshare7", "tingyun", "opensearch"})
	if req.Type != "" {
		do = do.Where("d.type_name = ?", req.Type)
	}
	if req.SourceType != "" {
		do = do.Where("d.source_type = ?", enum.ToInteger[constant.SourceType](req.SourceType).Int32())
	}
	if len(req.SourceTypeList) != 0 {
		do = do.Where("d.source_type in ?", req.SourceTypeList)
	}
	err = do.Scan(&res).Error
	return
}

// GetCatalogSchemaViewName implements datasource.DatasourceRepo.
func (r *datasourceRepo) GetCatalogSchemaViewName(ctx context.Context, fv *model.FormView) (csv string, err error) {
	switch fv.Type {
	case constant.FormViewTypeDatasource.Integer.Int32():
		ds := &model.Datasource{}
		if err = r.db.WithContext(ctx).Debug().Where(&model.Datasource{ID: fv.DatasourceID}).Take(ds).Error; err != nil {
			return
		}
		csv = ds.DataViewSource + "." + fv.TechnicalName
	case constant.FormViewTypeCustom.Integer.Int32():
		csv = constant.CustomViewSource + constant.CustomAndLogicEntityViewSourceSchema + "." + fv.TechnicalName
	case constant.FormViewTypeLogicEntity.Integer.Int32():
		csv = constant.LogicEntityViewSource + constant.CustomAndLogicEntityViewSourceSchema + "." + fv.TechnicalName
	default:
		log.WithContext(ctx).Error("unsupported form view type", zap.Any("type", fv.Type))
		err = fmt.Errorf("unsupported FormViewType: %v", fv.Type)
	}
	return
}
