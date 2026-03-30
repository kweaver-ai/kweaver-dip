package impl

import (
	"context"
	"errors"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/data_catalog_code_sequence"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/model"
	"gorm.io/gorm"
)

func NewRepo(data *db.Data) data_catalog_code_sequence.RepoOp {
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

func (r *repo) Insert(tx *gorm.DB, ctx context.Context, seq *model.TCatalogCodeSequence) error {
	return r.do(tx, ctx).Model(&model.TCatalogCodeSequence{}).Create(seq).Error
}

func (r *repo) Update(tx *gorm.DB, ctx context.Context, seq *model.TCatalogCodeSequence) (bool, error) {
	db := r.do(tx, ctx).Model(&model.TCatalogCodeSequence{}).Where("code_prefix = ? and order_code <= ?", seq.CodePrefix, seq.OrderCode).Updates(seq)
	return db.RowsAffected > 0, db.Error
}

func (r *repo) Get(tx *gorm.DB, ctx context.Context, codePrefix string) (*model.TCatalogCodeSequence, error) {
	var seq *model.TCatalogCodeSequence
	db := r.do(tx, ctx).Model(&model.TCatalogCodeSequence{}).Take(&seq, "code_prefix = ?", codePrefix)
	if errors.Is(db.Error, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	return seq, db.Error
}
