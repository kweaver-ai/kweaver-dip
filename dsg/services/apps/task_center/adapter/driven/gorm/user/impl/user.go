package impl

import (
	"context"
	"errors"

	"github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/gorm/user"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/task_center/infrastructure/repository/db"
	"github.com/kweaver-ai/dsg/services/apps/task_center/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"gorm.io/gorm"
)

var _ user.IUserRepo = (*UserRepo)(nil)

type UserRepo struct {
	data *db.Data
}

func NewUserRepo(data *db.Data) user.IUserRepo {
	return &UserRepo{data: data}
}

func (u *UserRepo) Insert(ctx context.Context, user *model.User) (int64, error) {
	result := u.data.DB.Debug().WithContext(ctx).Create(user)
	return result.RowsAffected, result.Error
}
func (u *UserRepo) InsertBatch(ctx context.Context, user []*model.User) error {
	return u.data.DB.WithContext(ctx).Create(user).Error
}
func (u *UserRepo) GetByUserId(ctx context.Context, userId string) (user *model.User, err error) {
	result := u.data.DB.WithContext(ctx).Take(&user, "id=?", userId)
	if result.Error != nil {
		if is := errors.Is(result.Error, gorm.ErrRecordNotFound); is {
			return nil, errorcode.Desc(errorcode.UserIdNotExistError)
		}
		return nil, errorcode.Detail(errorcode.UserDataBaseError, result.Error.Error())
	}
	return
}
func (u *UserRepo) GetByUserIdSimple(ctx context.Context, userId string) (user *model.User, err error) {
	err = u.data.DB.WithContext(ctx).Take(&user, "id=?", userId).Error
	return
}
func (u *UserRepo) GetByUserIds(ctx context.Context, userIds []string) (user []*model.User, err error) {
	err = u.data.DB.WithContext(ctx).Where("id in ?", userIds).Find(&user).Error
	return
}
func (u *UserRepo) UpdateUserName(ctx context.Context, user *model.User, updateKyes []string) (int64, error) {
	result := u.data.DB.WithContext(ctx).Where("id=?", user.ID).Select(updateKyes).Updates(user)
	return result.RowsAffected, result.Error
}
func (u *UserRepo) ListUserByIDs(ctx context.Context, uIds ...string) ([]*model.User, error) {
	if len(uIds) < 1 {
		log.WithContext(ctx).Warn("user ids is empty")
		return nil, nil
	}
	res := make([]*model.User, 0)
	result := u.data.DB.WithContext(ctx).Find(&res, uIds)
	return res, result.Error
}
func (u *UserRepo) ListUserByIDsNameFilter(ctx context.Context, name string, uIds []string) ([]*model.User, error) {
	if len(uIds) < 1 {
		log.WithContext(ctx).Warn("user ids is empty")
		return nil, nil
	}
	res := make([]*model.User, 0)
	result := u.data.DB.WithContext(ctx).Where("name like ?", "%"+name+"%").Find(&res, uIds)
	return res, result.Error
}

func (u *UserRepo) GetAll(ctx context.Context) ([]*model.User, error) {
	res := make([]*model.User, 0)
	result := u.data.DB.WithContext(ctx).Find(&res)
	return res, result.Error
}

func (u *UserRepo) Update(ctx context.Context, user *model.User) error {
	return u.data.DB.WithContext(ctx).Where("id=?", user.ID).Updates(user).Error
}
