package impl

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/data_catalog_info"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/model"
	"gorm.io/gorm"
)

const (
	historyInsetSql = `INSERT INTO t_data_catalog_info_history (
		id, catalog_id, info_type, info_key, info_value)
	  SELECT 
		id, catalog_id, info_type, info_key, info_value 
	  FROM t_data_catalog_info 
	  WHERE catalog_id = ?;`
)

func NewRepo(data *db.Data) data_catalog_info.RepoOp {
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

func (r *repo) InsertBatch(tx *gorm.DB, ctx context.Context, infos []*model.TDataCatalogInfo) error {
	return r.do(tx, ctx).Model(&model.TDataCatalogInfo{}).CreateInBatches(&infos, len(infos)).Error
}

func (r *repo) UpdateBatch(tx *gorm.DB, ctx context.Context, infos []*model.TDataCatalogInfo) (bool, error) {
	var d *gorm.DB
	for i := range infos {
		d = r.do(tx, ctx).Model(&model.TDataCatalogInfo{}).Where("id = ?", infos[i].ID).Save(infos[i])
		if d.Error != nil {
			return false, d.Error
		}
	}
	return true, nil
}

func (r *repo) DeleteBatch(tx *gorm.DB, ctx context.Context, catalogID uint64, excludeIDs []uint64) (bool, error) {
	db := r.do(tx, ctx).Model(&model.TDataCatalogInfo{}).Where("catalog_id = ?", catalogID)
	if len(excludeIDs) > 0 {
		db = db.Where("id not in ?", excludeIDs)
	}
	db = db.Delete(&model.TDataCatalogInfo{})
	return db.RowsAffected > 0, db.Error
}

func (r *repo) DeleteIntoHistory(tx *gorm.DB, ctx context.Context, catalogID uint64) (bool, error) {
	db := r.do(tx, ctx).Exec(historyInsetSql, catalogID)
	if db.Error == nil && db.RowsAffected > 0 {
		info := &model.TDataCatalogInfo{}
		db = db.Model(info).Where("catalog_id = ?", catalogID).Delete(info)
	}
	return db.RowsAffected > 0, db.Error
}

func (r *repo) Get(tx *gorm.DB, ctx context.Context, infoTypes []int8, catalogIDS []uint64) ([]*model.TDataCatalogInfo, error) {
	var result []*model.TDataCatalogInfo
	db := r.do(tx, ctx).Model(&model.TDataCatalogInfo{})
	if len(catalogIDS) > 0 {
		db = db.Where("catalog_id in ?", catalogIDS)
	}
	if len(infoTypes) > 0 {
		db = db.Where("info_type in ?", infoTypes)
	}
	db = db.Order("catalog_id ASC, info_type ASC, id ASC").Scan(&result)
	return result, db.Error
}
