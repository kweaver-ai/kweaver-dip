package user_role_group_binding

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/repository/db/model"
)

type Repo interface {
	GetByUserId(ctx context.Context, userId string) ([]string, error)
	Get(ctx context.Context, userId, roleGroupId string) (*model.UserRoleGroupBinding, error)
}
