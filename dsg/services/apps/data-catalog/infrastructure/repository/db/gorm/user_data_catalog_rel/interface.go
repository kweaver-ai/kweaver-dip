package user_data_catalog_rel

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/model"
	"gorm.io/gorm"
)

type RepoOp interface {
	Insert(tx *gorm.DB, ctx context.Context, resource *model.TUserDataCatalogRel) error
	BatchUpdateExpiredFlag(tx *gorm.DB, ctx context.Context) error
	Get(tx *gorm.DB, ctx context.Context, code, uid string) ([]*model.TUserDataCatalogRel, error)
	GetByCodes(tx *gorm.DB, ctx context.Context, codes []string, uid string) ([]*model.TUserDataCatalogRel, error)
}
