package user

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/data-view/infrastructure/db/model"
)

//notic user表结构不一致

type UserRepo interface {
	Insert(ctx context.Context, user *model.User) (int64, error)
	InsertBatch(ctx context.Context, user []*model.User) error
	InsertNotExist(ctx context.Context, users []*model.User) error
	GetByUserId(ctx context.Context, userId string) (user *model.User, err error)
	GetByUserMapByIds(ctx context.Context, uids []string) (map[string]string, error)
	GetByUserMapByNames(ctx context.Context, uids []string) (map[string]string, error)
	GetByUserIds(ctx context.Context, uids []string) (users []*model.User, err error)
	GetByUserIdSimple(ctx context.Context, userId string) (user *model.User, err error)
	UpdateUserName(ctx context.Context, user *model.User, updateKyes []string) (int64, error)
	ListUserByIDs(ctx context.Context, uIds ...string) ([]*model.User, error)
	GetAll(ctx context.Context) ([]*model.User, error)
}
