package user

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/repository/db/model"
)

type Repo interface {
	ListUserByIDs(ctx context.Context, uIds ...string) ([]*model.User, error)
	GetUIDsByLikeName(ctx context.Context, names ...string) ([]string, error)
}
