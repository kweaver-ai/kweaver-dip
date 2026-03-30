package role_group

import (
	"context"
	"net/url"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/repository/db/model"
)

type Repo interface {
	Create(ctx context.Context, roleGroup *model.RoleGroup) error
	Update(ctx context.Context, roleGroup *model.RoleGroup) error
	Delete(ctx context.Context, id string) error
	GetById(ctx context.Context, id string) (*model.RoleGroup, error)
	QueryList(ctx context.Context, params url.Values) ([]model.RoleGroup, int64, error)
	CheckName(ctx context.Context, id, name string) (bool, error)
	GetByIds(ctx context.Context, ids []string) ([]*model.RoleGroup, error)
}
