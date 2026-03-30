package impl

import (
	"context"
	"time"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/util"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/user_data_catalog_rel"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/model"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

func NewRepo(data *db.Data) user_data_catalog_rel.RepoOp {
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

func (r *repo) Insert(tx *gorm.DB, ctx context.Context, resource *model.TUserDataCatalogRel) error {
	return r.do(tx, ctx).
		Clauses(clause.OnConflict{
			Columns:   []clause.Column{{Name: "code"}, {Name: "uid"}, {Name: "apply_id"}},
			DoNothing: true,
		}).
		Create(resource).Error
}

func (r *repo) BatchUpdateExpiredFlag(tx *gorm.DB, ctx context.Context) error {
	db := r.do(tx, ctx).
		Model(&model.TUserDataCatalogRel{}).
		Where("expired_flag = 1 and expired_at <= now()").
		UpdateColumns(map[string]interface{}{
			"expired_flag": 2,
			"updated_at":   &util.Time{time.Now()},
		})
	return db.Error
}

func (r *repo) Get(tx *gorm.DB, ctx context.Context, code, uid string) ([]*model.TUserDataCatalogRel, error) {
	var result []*model.TUserDataCatalogRel
	db := r.do(tx, ctx).Model(&model.TUserDataCatalogRel{})
	if len(code) > 0 {
		db = db.Where("code = ?", code)
	}
	if len(uid) > 0 {
		db = db.Where("uid = ?", uid)
	}
	db = db.Where("expired_flag = 1 and expired_at > now()").Scan(&result)
	return result, db.Error
}

func (r *repo) GetByCodes(tx *gorm.DB, ctx context.Context, codes []string, uid string) ([]*model.TUserDataCatalogRel, error) {
	var result []*model.TUserDataCatalogRel
	db := r.do(tx, ctx).Model(&model.TUserDataCatalogRel{})
	db.Raw(`
		Select 
			id, code, expired_at 
		From 
			af_data_catalog.t_user_data_catalog_rel 
		Where
			code in (?)
		And
			uid = ?
		And
			expired_flag = 1
		And 
			expired_at > now();
	`, codes, uid).Scan(&result)
	return result, db.Error
}
