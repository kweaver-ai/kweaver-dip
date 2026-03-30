package data_catalog_download_apply

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/model"
	"gorm.io/gorm"
)

type RepoOp interface {
	Insert(tx *gorm.DB, ctx context.Context, resource *model.TDataCatalogDownloadApply) error
	Update(tx *gorm.DB, ctx context.Context, resource *model.TDataCatalogDownloadApply) error
	Get(tx *gorm.DB, ctx context.Context, code, uid string, id, auditApplySN uint64, state int) ([]*model.TDataCatalogDownloadApply, error)
	UpdateAuditStateByProcDefKey(tx *gorm.DB, ctx context.Context, auditType string, procDefKeys []string) (bool, error)
	GetByCodes(tx *gorm.DB, ctx context.Context, codes []string, uid string, state int) ([]*model.TDataCatalogDownloadApply, error)

	CountByCodeAndUID(tx *gorm.DB, ctx context.Context, code, uid string, id, auditApplySN uint64, state int) (int64, error)
}
