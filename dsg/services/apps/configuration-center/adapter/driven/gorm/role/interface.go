package role

import (
	"context"
	"time"

	domain "github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/role"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/repository/db/model"
	configuration_center_v1 "github.com/kweaver-ai/idrm-go-common/api/configuration-center/v1"
)

type Repo interface {
	Insert(ctx context.Context, role *model.SystemRole) error
	Update(ctx context.Context, role *model.SystemRole) error
	Discard(ctx context.Context, rid string, msg *model.MqMessage) error
	Query(ctx context.Context, param *configuration_center_v1.RoleListOptions) ([]*model.SystemRole, int64, error)
	QueryByIds(ctx context.Context, roleIds []string) ([]*model.SystemRole, error)
	Get(ctx context.Context, rid string) (*model.SystemRole, error)
	CheckRepeat(ctx context.Context, id, name string) (bool, error)
	GetByIds(ctx context.Context, rids []string) ([]*model.SystemRole, error)
	//user
	InsertUserRole(ctx context.Context, userRoles []*model.UserRole) error
	UpsertRelations(ctx context.Context, roleId string, userIds []string) error
	DeleteUserRole(ctx context.Context, uid string, rid string, msg *model.MqMessage) error
	DeleteMQMessage(ctx context.Context, mid string) error
	GetUserRole(ctx context.Context, uid string) ([]*model.UserRole, error) //所有角色，使用需过滤及加内置
	UserInRole(ctx context.Context, rid, uid string) (bool, error)
	GetRoleUsers(ctx context.Context, rid string) ([]*model.UserRole, error)
	GetRoleUsersInPage(ctx context.Context, args *domain.QueryRoleUserPageReqParam) (int64, []*GetRoleUsersInPageRes, error)
	GetRolesUsers(ctx context.Context, rid ...string) ([]*model.UserRole, error)
	GetRolesByProvider(ctx context.Context) ([]*model.SystemRole, error)
	// GetUserRoleIDs 返回指定用户所拥有的角色的 ID 列表，未指定用户时返回所有角色的 ID 列表
	GetUserRoleIDs(ctx context.Context, userID string) ([]string, error)
	// 更新指定的用户、角色关系。
	//
	//  1. 期望存在，实际不存在，创建
	//  2. 期望不存在，实际存在，删除
	//  3. 期望与实际一致，无操作
	//  4. 未指定的用户、角色关系，无操作
	ReconcileUserRoles(ctx context.Context, present, absent []model.UserRole) error
}
type GetRoleUsersInPageRes struct {
	ID        string    `gorm:"column:id" json:"id"`
	Name      string    `gorm:"column:name" json:"name"`
	CreatedAt time.Time `gorm:"column:created_at" json:"created_at"`
}
