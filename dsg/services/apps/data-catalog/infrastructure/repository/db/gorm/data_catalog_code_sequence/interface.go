package data_catalog_code_sequence

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/model"
	"gorm.io/gorm"
)

type RepoOp interface {
	Insert(tx *gorm.DB, ctx context.Context, catalog *model.TCatalogCodeSequence) error
	Update(tx *gorm.DB, ctx context.Context, catalog *model.TCatalogCodeSequence) (bool, error)
	Get(tx *gorm.DB, ctx context.Context, codePrefix string) (*model.TCatalogCodeSequence, error)
}
