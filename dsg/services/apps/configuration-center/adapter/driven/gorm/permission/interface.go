package permission

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/repository/db/model"
)

type Repo interface {
	GetById(ctx context.Context, id string) (*model.Permission, error)
	GetList(ctx context.Context) ([]model.Permission, int64, error)
	GetByIds(ctx context.Context, ids []string) ([]*model.Permission, error)
	Create(ctx context.Context, permissions []*model.Permission) error
	// 根据权限ID查询用户
	QueryUserListByPermissionIds(ctx context.Context, permissionType int8, ids []string, keyword string, thirdUserId string) ([]*model.User, error)
	// 查询用户所有的权限及范围列表
	GetUserPermissionScopeList(ctx context.Context, uid string) ([]*model.UserPermissionScope, error)
	// 查询用户是否有管理审核策略
	GetUserManagerAuditPermissionCount(ctx context.Context, uid string) (int64, error)
	GetUserCheckPermissionCount(ctx context.Context, permissionId, uid string) (int64, error)
}
