package role_group_role_binding

import (
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/repository/db/model"
	"golang.org/x/net/context"
)

type Repo interface {
	Update(ctx context.Context, adds []*model.RoleGroupRoleBinding, deleteBindings []string) error
	GetByRoleGroupId(ctx context.Context, roleGroupId string) ([]*model.RoleGroupRoleBinding, error)
	Get(ctx context.Context, roleGroupId, roleId string) (*model.RoleGroupRoleBinding, error)
}
