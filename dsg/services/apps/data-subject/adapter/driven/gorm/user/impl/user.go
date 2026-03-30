package impl

import (
	"context"
	"errors"

	"github.com/kweaver-ai/dsg/services/apps/data-subject/adapter/driven/gorm/user"
	my_errorcode "github.com/kweaver-ai/dsg/services/apps/data-subject/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-subject/domain/model"
	"github.com/kweaver-ai/idrm-go-common/errorcode"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"gorm.io/gorm"
)

var _ user.UserRepo = (*userRepo)(nil)

type userRepo struct {
	DB *gorm.DB
}

func NewUserRepo(db *gorm.DB) user.UserRepo {
	return &userRepo{DB: db}
}

func (u *userRepo) Insert(ctx context.Context, user *model.User) (int64, error) {
	result := u.DB.WithContext(ctx).Create(user)
	return result.RowsAffected, result.Error
}
func (u *userRepo) InsertBatch(ctx context.Context, user []*model.User) error {
	return u.DB.WithContext(ctx).Create(user).Error
}
func (u *userRepo) InsertNotExist(ctx context.Context, users []*model.User) error {
	return u.DB.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		for _, user := range users {
			errIn := tx.Take(&user, "id=?", user.ID).Error
			if is := errors.Is(errIn, gorm.ErrRecordNotFound); is {
				if err := tx.Create(user).Error; err != nil {
					return err
				}
			}
		}
		return nil
	})
}
func (u *userRepo) GetByUserId(ctx context.Context, userId string) (user *model.User, err error) {
	result := u.DB.WithContext(ctx).Take(&user, "id=?", userId)
	if result.Error != nil {
		if is := errors.Is(result.Error, gorm.ErrRecordNotFound); is {
			return nil, errorcode.Desc(my_errorcode.UserIdNotExistError)
		}
		return nil, errorcode.Detail(my_errorcode.UserDataBaseError, result.Error.Error())
	}
	return
}
func (u *userRepo) GetByUserIds(ctx context.Context, uids []string) (users []*model.User, err error) {
	err = u.DB.WithContext(ctx).Where("id in ?", uids).Find(&users).Error
	return
}

func (u *userRepo) GetByUserIdSimple(ctx context.Context, userId string) (user *model.User, err error) {
	err = u.DB.WithContext(ctx).Take(&user, "id=?", userId).Error
	return
}
func (u *userRepo) UpdateUserName(ctx context.Context, user *model.User, updateKyes []string) (int64, error) {
	result := u.DB.WithContext(ctx).Where("id=?", user.ID).Select(updateKyes).Updates(user)
	return result.RowsAffected, result.Error
}
func (u *userRepo) ListUserByIDs(ctx context.Context, uIds ...string) ([]*model.User, error) {
	if len(uIds) < 1 {
		log.Warn("user ids is empty")
		return nil, nil
	}
	res := make([]*model.User, 0)
	result := u.DB.WithContext(ctx).Find(&res, uIds)
	return res, result.Error
}

func (u *userRepo) GetAll(ctx context.Context) ([]*model.User, error) {
	res := make([]*model.User, 0)
	result := u.DB.WithContext(ctx).Find(&res)
	return res, result.Error
}

func (u *userRepo) GetByUserName(ctx context.Context, name string) (user *model.User, err error) {
	result := u.DB.WithContext(ctx).Take(&user, "name=?", name)
	if result.Error != nil {
		if is := errors.Is(result.Error, gorm.ErrRecordNotFound); is {
			return nil, errorcode.Desc(my_errorcode.UserIdNotExistError)
		}
		return nil, errorcode.Detail(my_errorcode.UserDataBaseError, result.Error.Error())
	}
	return
}
