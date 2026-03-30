package role_permission_binding

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/repository/db/model"
)

type Repo interface {
	Update(ctx context.Context, role *model.SystemRole, adds []*model.RolePermissionBinding, deleteBindings []string) error
	GetByRoleId(ctx context.Context, roleId string) ([]*model.RolePermissionBinding, error)
}
