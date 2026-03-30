package user_permission_binding

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/repository/db/model"
)

type Repo interface {
	Update(ctx context.Context, user *model.User, adds []*model.UserPermissionBinding, deleteBindings []string) error
	GetByUserId(ctx context.Context, userId string) ([]*model.UserPermissionBinding, error)
}
