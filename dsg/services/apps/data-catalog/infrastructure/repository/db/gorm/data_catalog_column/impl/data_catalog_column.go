package impl

import (
	"context"
	"errors"
	"fmt"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/data_resource_catalog"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/models/request"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/util"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/data_catalog_column"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/model"
	"gorm.io/gorm"
)

const (
	historyInsetSql = `INSERT INTO t_data_catalog_column_history (
		id, catalog_id, column_name, name_cn, data_format, 
		data_length, datameta_id, datameta_name, ranges, codeset_id, 
		codeset_name, shared_type, open_type, timestamp_flag, primary_flag, 
		null_flag, classified_flag, sensitive_flag, shared_condition, open_condition, 
        description, ai_description, data_precision)
	  SELECT 
		id, catalog_id, column_name, name_cn, data_format, 
		data_length, datameta_id, datameta_name, ranges, codeset_id, 
		codeset_name, shared_type, open_type, timestamp_flag, primary_flag, 
		null_flag, classified_flag, sensitive_flag, shared_condition, open_condition, 
		description, ai_description, data_precision   
	  FROM t_data_catalog_column 
	  WHERE catalog_id = ?;`
)

func NewRepo(data *db.Data) data_catalog_column.RepoOp {
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

func (r *repo) InsertBatch(tx *gorm.DB, ctx context.Context, columns []*model.TDataCatalogColumn) error {
	return r.do(tx, ctx).Model(&model.TDataCatalogColumn{}).CreateInBatches(&columns, len(columns)).Error
}

func (r *repo) UpdateBatch(tx *gorm.DB, ctx context.Context, columns []*model.TDataCatalogColumn) (bool, error) {
	var d *gorm.DB
	for i := range columns {
		d = r.do(tx, ctx).Model(&model.TDataCatalogColumn{}).Where("id = ?", columns[i].ID).Save(columns[i])
		if d.Error != nil {
			return false, d.Error
		}
	}
	return true, nil
}

func (r *repo) DeleteBatch(tx *gorm.DB, ctx context.Context, catalogID uint64, excludeIDs []uint64) (bool, error) {
	db := r.do(tx, ctx).Model(&model.TDataCatalogColumn{}).Where("catalog_id = ?", catalogID)
	if len(excludeIDs) > 0 {
		db = db.Where("id not in ?", excludeIDs)
	}
	db = db.Delete(&model.TDataCatalogColumn{})
	return db.RowsAffected > 0, db.Error
}

func (r *repo) DeleteIntoHistory(tx *gorm.DB, ctx context.Context, catalogID uint64) (bool, error) {
	db := r.do(tx, ctx).Exec(historyInsetSql, catalogID)
	if db.Error == nil && db.RowsAffected > 0 {
		column := &model.TDataCatalogColumn{}
		db = db.Model(column).Where("catalog_id = ?", catalogID).Delete(column)
	}
	return db.RowsAffected > 0, db.Error
}

func (r *repo) Get(tx *gorm.DB, ctx context.Context, catalogID uint64) ([]*model.TDataCatalogColumn, error) {
	var result []*model.TDataCatalogColumn
	db := r.do(tx, ctx).Model(&model.TDataCatalogColumn{}).Order("id ASC").Find(&result, "catalog_id = ?", catalogID)
	return result, db.Error
}
func (r *repo) GetByPage(ctx context.Context, req data_resource_catalog.CatalogColumnPageInfo) (total int64, result []*model.TDataCatalogColumn, err error) {
	tx := r.data.DB.WithContext(ctx).Model(&model.TDataCatalogColumn{}).Where("catalog_id = ?", req.ID)
	keyword := req.Keyword
	if keyword != "" {
		kw := "%" + util.KeywordEscape(keyword) + "%"
		tx = tx.Where("technical_name like ? or business_name like ? ", kw, kw)
		// if strings.Contains(keyword, "_") {
		// 	keyword = strings.Replace(keyword, "_", "\\_", -1)
		// }
		// keyword = "%" + keyword + "%"
		// tx = tx.Where("technical_name like ? or business_name like ? ", keyword, keyword)
	}
	if req.SharedType != 0 {
		tx = tx.Where("shared_type = ?", req.SharedType)
	}
	err = tx.Count(&total).Error
	if err != nil {
		return
	}
	limit := *req.Limit
	offset := limit * (*req.Offset - 1)
	if limit > 0 {
		tx = tx.Limit(limit).Offset(offset)
	}
	if *req.Sort == "index" {
		tx = tx.Order(fmt.Sprintf("`index` %s", *req.Direction))
	} else {
		tx = tx.Order(fmt.Sprintf("%s %s", *req.Sort, *req.Direction))
	}
	err = tx.Find(&result).Error
	return
}
func (r *repo) GetList(tx *gorm.DB, ctx context.Context, catalogID uint64,
	keyword string, page *request.PageBaseInfo) ([]*model.TDataCatalogColumn, int64, error) {
	var columns []*model.TDataCatalogColumn
	var totalCount int64
	db := r.do(tx, ctx).Model(&model.TDataCatalogColumn{}).Where("catalog_id = ?", catalogID)
	if len(keyword) > 0 {
		db = db.Where("name_cn like concat('%',?,'%')", util.KeywordEscape(keyword))
	}

	db = db.Count(&totalCount)
	if db.Error == nil {
		db = db.Order("id ASC")
		if *page.Limit > 0 {
			db = db.Offset((*(page.Offset) - 1) * *(page.Limit)).Limit(*(page.Limit))
		}
		db = db.Scan(&columns)
	}

	return columns, totalCount, db.Error
}

func (r *repo) ListByOpenType(tx *gorm.DB, ctx context.Context, catalogId uint64, openTypes []int, ids []uint64) ([]*model.TDataCatalogColumn, error) {
	do := r.do(tx, ctx).Where("`catalog_id`=?", catalogId)
	if len(openTypes) > 0 {
		do = do.Where("`open_type` in ?", openTypes)
	}

	if len(ids) > 0 {
		do = do.Where("`id` in ?", ids)
	}

	var columns []*model.TDataCatalogColumn
	if err := do.Order("`id` ASC").Find(&columns).Error; err != nil {
		return nil, err
	}

	return columns, nil
}

func (r *repo) UpdateAIDescBatch(tx *gorm.DB, ctx context.Context, columns []*model.TDataCatalogColumn) (bool, error) {
	return r.updateFieldsBatch(tx, ctx, columns, "ai_description")
}

func (r *repo) updateFieldsBatch(tx *gorm.DB, ctx context.Context, columns []*model.TDataCatalogColumn, fields ...string) (bool, error) {
	if len(fields) < 1 {
		return false, errors.New("fields is empty")
	}

	d := r.do(tx, ctx)
	for i := range columns {
		if d.Model(&model.TDataCatalogColumn{}).Select(fields).Where("id = ?", columns[i].ID).Updates(columns[i]).Error != nil {
			return false, d.Error
		}
	}

	return true, nil
}

func (r *repo) GetByCatalogIDs(tx *gorm.DB, ctx context.Context, ids []uint64) ([]*model.TDataCatalogColumn, error) {

	var result []*model.TDataCatalogColumn

	tx = r.do(tx, ctx).WithContext(ctx).
		Raw(
			`Select catalog_id,column_name,name_cn From t_data_catalog_column Where catalog_id In (?);`, ids,
		).
		Scan(&result)

	return result, tx.Error
}

func (r *repo) GetByIDs(ctx context.Context, columnIDs []uint64) (result []*model.TDataCatalogColumn, err error) {
	err = r.data.DB.WithContext(ctx).
		Model(&model.TDataCatalogColumn{}).
		Where("id in ?", columnIDs).
		Find(&result).Error
	return
}

func (r *repo) GetByResourceID(ctx context.Context, id string) (result []*model.TDataCatalogColumn, err error) {
	rawSQL := "select tdcc.* from t_data_resource tdr   join t_data_catalog_column tdcc on tdr.catalog_id=tdcc.catalog_id " + "" +
		" join t_data_catalog tdc on tdc.id=tdr.catalog_id  " +
		" where tdr.resource_id = ? and tdc.publish_status='published' "
	err = r.do(nil, ctx).WithContext(ctx).Raw(rawSQL, id).Scan(&result).Error
	return result, err
}
