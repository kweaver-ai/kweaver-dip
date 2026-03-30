package impl

import (
	"context"
	"time"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/util"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/data_catalog_download_apply"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/model"
	"gorm.io/gorm"
)

func NewRepo(data *db.Data) data_catalog_download_apply.RepoOp {
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

func (r *repo) Insert(tx *gorm.DB, ctx context.Context, resource *model.TDataCatalogDownloadApply) error {
	return r.do(tx, ctx).Model(&model.TDataCatalogDownloadApply{}).Create(resource).Error
}

func (r *repo) Update(tx *gorm.DB, ctx context.Context, resource *model.TDataCatalogDownloadApply) error {
	return r.do(tx, ctx).
		Model(&model.TDataCatalogDownloadApply{}).
		Where("id = ? and audit_apply_sn = ?", resource.ID, resource.AuditApplySN).
		Updates(resource).Error
}

func (r *repo) Get(tx *gorm.DB, ctx context.Context, code, uid string, id, auditApplySN uint64, state int) ([]*model.TDataCatalogDownloadApply, error) {
	var result []*model.TDataCatalogDownloadApply
	db := r.do(tx, ctx).Model(&model.TDataCatalogDownloadApply{})
	if id > 0 {
		db = db.Where("id = ?", id)
	}
	if len(code) > 0 {
		db = db.Where("code = ?", code)
	}
	if len(uid) > 0 {
		db = db.Where("uid = ?", uid)
	}
	if auditApplySN > 0 {
		db = db.Where("audit_apply_sn = ?", auditApplySN)
	}
	if state > 0 {
		db = db.Where("state = ?", state)
	}
	db = db.Scan(&result)
	return result, db.Error
}

func (r *repo) UpdateAuditStateByProcDefKey(tx *gorm.DB, ctx context.Context, auditType string, procDefKeys []string) (bool, error) {
	db := r.do(tx, ctx).Model(&model.TDataCatalogDownloadApply{}).
		Where("audit_type = ? and proc_def_key in ? and state = 1", auditType, procDefKeys).
		UpdateColumns(map[string]interface{}{
			"state":      3,
			"updated_at": &util.Time{Time: time.Now()},
		})
	return db.RowsAffected > 0, db.Error
}

func (r *repo) GetByCodes(tx *gorm.DB, ctx context.Context, codes []string, uid string, state int) ([]*model.TDataCatalogDownloadApply, error) {
	// t_data_catalog_download_apply
	var result []*model.TDataCatalogDownloadApply
	db := r.do(tx, ctx).Model(&model.TDataCatalogDownloadApply{})
	db.Raw(`
		Select 
			code
		From
			af_data_catalog.t_data_catalog_download_apply
		Where
			code in (?)
		And
			state = ?
		And
			uid = ?;
	`, codes, state, uid).Scan(&result)
	return result, db.Error
}

func (r *repo) CountByCodeAndUID(tx *gorm.DB, ctx context.Context, code, uid string, id, auditApplySN uint64, state int) (int64, error) {
	var count int64
	db := r.do(tx, ctx).Raw(`
		Select 
			count(*) 
		From 
			af_data_catalog.t_data_catalog_download_apply 
		Where
			code = ?
		And
			uid = ?;
	`, code, uid).Scan(&count)
	return count, db.Error
}
