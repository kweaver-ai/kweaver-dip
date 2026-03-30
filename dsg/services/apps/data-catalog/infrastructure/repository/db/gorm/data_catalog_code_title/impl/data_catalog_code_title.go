package impl

import (
	"context"
	"errors"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/data_catalog_code_title"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/model"
	"gorm.io/gorm"
)

const (
	deleteSql = `DELETE FROM t_catalog_code_title 
	  WHERE title = ? and 
	        code = ? and 
			not exists (SELECT id 
				        FROM t_data_catalog 
						WHERE code = ? and title = ?)`
)

func NewRepo(data *db.Data) data_catalog_code_title.RepoOp {
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

func (r *repo) Insert(tx *gorm.DB, ctx context.Context, code, title string) error {
	return r.do(tx, ctx).
		Model(&model.TCatalogCodeTitle{}).
		Create(&model.TCatalogCodeTitle{
			Code:  code,
			Title: title,
		}).Error
}

func (r *repo) GetByCode(tx *gorm.DB, ctx context.Context, code string) ([]*model.TCatalogCodeTitle, error) {
	var seqs []*model.TCatalogCodeTitle
	db := r.do(tx, ctx).Model(&model.TCatalogCodeTitle{}).Where("code = ?", code).Scan(&seqs)
	return seqs, db.Error
}

func (r *repo) Get(tx *gorm.DB, ctx context.Context, code, title string) (bool, error) {
	var seq *model.TCatalogCodeTitle
	db := r.do(tx, ctx).Model(&model.TCatalogCodeTitle{}).Where("title = ?", title)
	if len(code) > 0 {
		db = db.Where("code != ?", code)
	}
	db = db.Take(&seq)
	if db.Error != nil {
		if errors.Is(db.Error, gorm.ErrRecordNotFound) {
			return false, nil
		}
		return false, db.Error
	}
	return true, nil
}

func (r *repo) Delete(tx *gorm.DB, ctx context.Context, code, title string) error {
	return r.do(tx, ctx).Exec(deleteSql, title, code, code, title).Error
}
