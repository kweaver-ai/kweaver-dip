package data_catalog_code_title

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/model"
	"gorm.io/gorm"
)

type RepoOp interface {
	Insert(tx *gorm.DB, ctx context.Context, code, title string) error
	GetByCode(tx *gorm.DB, ctx context.Context, code string) ([]*model.TCatalogCodeTitle, error)
	Get(tx *gorm.DB, ctx context.Context, code, title string) (bool, error)
	Delete(tx *gorm.DB, ctx context.Context, code, title string) error
}
