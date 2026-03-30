package data_assets_info

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/model"
)

type RepoOp interface {
	Update(ctx context.Context, catalog *model.TDataAssetsInfo) error
	Get(ctx context.Context) (*model.TDataAssetsInfo, error)
}
