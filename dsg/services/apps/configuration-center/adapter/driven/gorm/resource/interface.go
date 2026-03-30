package resource

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/repository/db/model"
)

type Repo interface {
	Truncate(ctx context.Context) error
	GetScope(ctx context.Context, rids []string) ([]*model.Resource, error)
	GetResource(ctx context.Context, rids []string) ([]*model.Resource, error)
	InsertResource(ctx context.Context, resources []*model.Resource) error
	GetResourceByType(ctx context.Context, rids []string, resourceType, resourceSubType int32) ([]*model.Resource, error)
}
