package user2

import (
	"context"
	"net/url"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/user"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/repository/db/model"
)

type IUserRepo interface {
	Insert(ctx context.Context, user *model.User) (int64, error)
	InsertBatch(ctx context.Context, user []*model.User) error
	InsertNotExist(ctx context.Context, users []*model.User) error
	GetByUserId(ctx context.Context, userId string) (user *model.User, err error)
	GetByUserIds(ctx context.Context, uids []string) (users []*model.User, err error)
	GetByUserIdSimple(ctx context.Context, userId string) (user *model.User, err error)
	UpdateUserName(ctx context.Context, user *model.User, updateKyes []string) (int64, error)
	UpdateUserMobileMail(ctx context.Context, user *model.User, updateKyes []string) (int64, error)
	ListUserByIDs(ctx context.Context, uIds ...string) ([]*model.User, error)
	GetAll(ctx context.Context) ([]*model.User, error)
	GetUserRoles(ctx context.Context, uid string) ([]*model.SystemRole, error)
	GetRoleExistUserByIds(ctx context.Context, uid []string) ([]*model.User, error)
	GetDepartAndUsersPage(ctx context.Context, req *user.DepartAndUserReq) ([]*user.DepartAndUserRes, error)
	GetUsersPageTemp(ctx context.Context, req *user.DepartAndUserReq) (res []*user.DepartAndUserRes, err error)
	GetUsersRoleName(ctx context.Context, uid string) (res []*user.Role, err error)
	Update(ctx context.Context, user *model.User) error
	GetUserList(ctx context.Context, req *user.GetUserListReq, departUserIds []string, excludeUserIds []string) (int64, []*model.User, error)
	ListUserNames(ctx context.Context) ([]model.UserWithName, error)
	QueryList(ctx context.Context, params url.Values, userIds []string, register int32) ([]*model.User, int64, error)
}
