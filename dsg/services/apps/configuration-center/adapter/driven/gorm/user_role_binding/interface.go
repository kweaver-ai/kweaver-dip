package user_role_binding

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/repository/db/model"
)

type Repo interface {
	Update(ctx context.Context, userIds []string, updatedBy string, addRoleBindings []*model.UserRoleBinding, addRoleGroupBindings []*model.UserRoleGroupBinding, deleteRoleBindings, deleteRoleGroupBindings []string) error
	GetByUserId(ctx context.Context, userId string) ([]string, error)
	Get(ctx context.Context, userId, roleId string) (*model.UserRoleBinding, error)
}
