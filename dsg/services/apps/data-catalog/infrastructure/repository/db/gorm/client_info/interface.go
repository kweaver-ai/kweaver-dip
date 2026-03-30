package client_info

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/model"
)

type RepoOp interface {
	Insert(ctx context.Context, info *model.TClientInfo) error
	Get(ctx context.Context) (*model.TClientInfo, error)
}
