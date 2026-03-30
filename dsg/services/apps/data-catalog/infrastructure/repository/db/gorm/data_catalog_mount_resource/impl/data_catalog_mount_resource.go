package impl

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/data_catalog_mount_resource"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/model"
	"gorm.io/gorm"
)

const (
	historyInsetSql = `INSERT INTO t_data_catalog_resource_mount_history (
		id, catalog_id, res_type, res_id, res_name, code) 
	  SELECT 
	    id, catalog_id, res_type, res_id, res_name, code  
	  FROM t_data_catalog_resource_mount 
	  WHERE code = ? and 
	  		not exists (select code from t_data_catalog where code = ?);`
)

func NewRepo(data *db.Data) data_catalog_mount_resource.RepoOp {
	return &repo{data: data}
}

type repo struct {
	data *db.Data
}

func (r *repo) do(tx *gorm.DB, ctx context.Context) *gorm.DB {
	if tx == nil {
		return r.data.DB.WithContext(ctx)
	}
	return tx
}

func (r *repo) InsertBatch(tx *gorm.DB, ctx context.Context, resources []*model.TDataCatalogResourceMount) error {
	return r.do(tx, ctx).Model(&model.TDataCatalogResourceMount{}).CreateInBatches(&resources, len(resources)).Error
}

func (r *repo) UpdateBatch(tx *gorm.DB, ctx context.Context, resources []*model.TDataCatalogResourceMount) (bool, error) {
	var d *gorm.DB
	for i := range resources {
		d = r.do(tx, ctx).Model(&model.TDataCatalogResourceMount{}).Where("id = ?", resources[i].ID).Save(resources[i])
		if d.Error != nil {
			return false, d.Error
		}
	}
	return true, nil
}

func (r *repo) DeleteBatch(tx *gorm.DB, ctx context.Context, code string, excludeIDs []uint64) (bool, error) {
	db := r.do(tx, ctx).Model(&model.TDataCatalogResourceMount{}).Where("code = ?", code)
	if len(excludeIDs) > 0 {
		db = db.Where("id not in ?", excludeIDs)
	}
	db = db.Delete(&model.TDataCatalogInfo{})
	return db.RowsAffected > 0, db.Error
}

func (r *repo) DeleteIntoHistory(tx *gorm.DB, ctx context.Context, code string) error {
	db := r.do(tx, ctx).Exec(historyInsetSql, code, code)
	if db.Error == nil && db.RowsAffected > 0 {
		res := &model.TDataCatalogResourceMount{}
		db = db.Model(res).Where("code = ?", code).Delete(res)
	}
	return db.Error
}

func (r *repo) Get(tx *gorm.DB, ctx context.Context, code string, resType int8) ([]*model.TDataCatalogResourceMount, error) {
	var result []*model.TDataCatalogResourceMount
	db := r.do(tx, ctx).Model(&model.TDataCatalogResourceMount{}).Where("code = ?", code)
	if resType > 0 {
		db = db.Where("res_type = ?", resType)
	}
	db = db.Scan(&result)
	return result, db.Error
}

func (r *repo) GetByCodes(tx *gorm.DB, ctx context.Context, codes []string, resType int8) ([]*model.TDataCatalogResourceMount, error) {
	var result []*model.TDataCatalogResourceMount
	db := r.do(tx, ctx).Model(&model.TDataCatalogResourceMount{}).Where("code in ?", codes)
	if resType > 0 {
		db = db.Where("res_type = ?", resType)
	}
	db = db.Scan(&result)
	return result, db.Error
}

func (r *repo) GetExistedResource(tx *gorm.DB, ctx context.Context, resType int8, resIDs []string) ([]*model.TDataCatalogResourceMount, error) {
	var result []*model.TDataCatalogResourceMount
	db := r.do(tx, ctx).Model(&model.TDataCatalogResourceMount{}).Distinct("res_id, code")
	if resType > 0 {
		db = db.Where("res_type = ?", resType)
	}
	if len(resIDs) > 0 {
		db = db.Where("res_id in ?", resIDs)
	}
	db = db.Scan(&result)
	return result, db.Error
}

func (r *repo) GetByCatalogIDs(tx *gorm.DB, ctx context.Context, codes []string, resType int8) ([]*model.TDataCatalogResourceMount, error) {
	var result []*model.TDataCatalogResourceMount
	db := r.do(tx, ctx).Model(&model.TDataCatalogResourceMount{}).Where("code in ?", codes)
	if resType > 0 {
		db = db.Where("res_type = ?", resType)
	}
	db = db.Scan(&result)
	return result, db.Error
}
