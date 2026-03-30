package user

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/task_center/infrastructure/repository/db/model"
)

type IUserRepo interface {
	Insert(ctx context.Context, user *model.User) (int64, error)
	InsertBatch(ctx context.Context, user []*model.User) error
	GetByUserId(ctx context.Context, userId string) (user *model.User, err error)
	GetByUserIdSimple(ctx context.Context, userId string) (user *model.User, err error)
	GetByUserIds(ctx context.Context, userIds []string) (user []*model.User, err error)
	UpdateUserName(ctx context.Context, user *model.User, updateKyes []string) (int64, error)
	ListUserByIDs(ctx context.Context, uIds ...string) ([]*model.User, error)
	ListUserByIDsNameFilter(ctx context.Context, name string, uIds []string) ([]*model.User, error)
	GetAll(ctx context.Context) ([]*model.User, error)
	Update(ctx context.Context, user *model.User) error
}
