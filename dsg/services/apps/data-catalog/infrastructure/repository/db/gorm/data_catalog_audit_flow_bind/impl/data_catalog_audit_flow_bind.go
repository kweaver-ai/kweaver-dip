package impl

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/data_catalog_audit_flow_bind"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/model"
	"gorm.io/gorm"
)

func NewRepo(data *db.Data) data_catalog_audit_flow_bind.RepoOp {
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

func (r *repo) Insert(tx *gorm.DB, ctx context.Context, resource *model.TDataCatalogAuditFlowBind) error {
	return r.do(tx, ctx).Model(&model.TDataCatalogAuditFlowBind{}).Create(resource).Error
}

func (r *repo) Update(tx *gorm.DB, ctx context.Context, resource *model.TDataCatalogAuditFlowBind) (bool, error) {
	d := r.do(tx, ctx).Model(&model.TDataCatalogAuditFlowBind{}).Where("id = ? and audit_type = ?", resource.ID, resource.AuditType).Updates(resource)
	if d.Error != nil {
		return false, d.Error
	}
	return true, nil
}

func (r *repo) Delete(tx *gorm.DB, ctx context.Context, id uint64) (bool, error) {
	db := r.do(tx, ctx).Model(&model.TDataCatalogAuditFlowBind{}).Where("id = ?", id).Delete(&model.TDataCatalogAuditFlowBind{})
	return db.RowsAffected > 0, db.Error
}

func (r *repo) Get(tx *gorm.DB, ctx context.Context, id uint64, auditType string) ([]*model.TDataCatalogAuditFlowBind, error) {
	var result []*model.TDataCatalogAuditFlowBind
	db := r.do(tx, ctx).Model(&model.TDataCatalogAuditFlowBind{})
	if id > 0 {
		db = db.Where("id = ?", id)
	}
	if len(auditType) > 0 {
		db = db.Where("audit_type = ?", auditType)
	}
	db = db.Scan(&result)
	return result, db.Error
}
