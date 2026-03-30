package data_catalog_audit_flow_bind

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/model"
	"gorm.io/gorm"
)

type RepoOp interface {
	Insert(tx *gorm.DB, ctx context.Context, resource *model.TDataCatalogAuditFlowBind) error
	Update(tx *gorm.DB, ctx context.Context, resource *model.TDataCatalogAuditFlowBind) (bool, error)
	Delete(tx *gorm.DB, ctx context.Context, id uint64) (bool, error)
	Get(tx *gorm.DB, ctx context.Context, id uint64, auditType string) ([]*model.TDataCatalogAuditFlowBind, error)
}
