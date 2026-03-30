package impl

import (
	"context"
	"github.com/kweaver-ai/idrm-go-common/rest/user_management"
	"errors"
	"go.uber.org/zap"

	"github.com/kweaver-ai/idrm-go-common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/gorm/user"
	my_errorcode "github.com/kweaver-ai/dsg/services/apps/data-view/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-view/infrastructure/db/model"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"gorm.io/gorm"
)

var _ user.UserRepo = (*userRepo)(nil)

type userRepo struct {
	userMgm user_management.DrivenUserMgnt
	DB      *gorm.DB
}

func NewUserRepo(
	db *gorm.DB,
	userMgm user_management.DrivenUserMgnt) user.UserRepo {
	return &userRepo{
		DB:      db,
		userMgm: userMgm,
	}
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
			user, err = u.getUserDriver(ctx, userId)
			if err != nil {
				return nil, err
			}
			return user, nil
		}
		return nil, errorcode.Detail(my_errorcode.UserDataBaseError, result.Error.Error())
	}
	return
}
func (u *userRepo) getUserDriver(ctx context.Context, userId string) (m *model.User, err error) {
	name, _, _, err := u.userMgm.GetUserNameByUserID(ctx, userId)
	if err != nil {
		log.WithContext(ctx).Error("userMgm GetUserNameByUserID err", zap.Error(err))
		return nil, errorcode.Detail(my_errorcode.UserMgmCallError, err.Error())
	}
	m = &model.User{
		ID:     userId,
		Name:   name,
		Status: 1,
	}
	_, err = u.Insert(ctx, m)
	if err != nil {
		log.WithContext(ctx).Error("GetByUserId Insert err", zap.Error(err))
		return nil, errorcode.Detail(my_errorcode.UserDataBaseError, err.Error())
	}
	return m, nil
}
func (u *userRepo) GetByUserIds(ctx context.Context, uids []string) (users []*model.User, err error) {
	err = u.DB.WithContext(ctx).Where("id in ?", uids).Find(&users).Error
	return
}
func (u *userRepo) GetByUserMapByIds(ctx context.Context, uids []string) (map[string]string, error) {
	var users []*model.User
	if err := u.DB.WithContext(ctx).Where("id in ?", uids).Find(&users).Error; err != nil {
		return nil, err
	}
	usersMap := make(map[string]string)
	for _, user := range users {
		usersMap[user.ID] = user.Name
	}
	return usersMap, nil
}
func (u *userRepo) GetByUserMapByNames(ctx context.Context, names []string) (map[string]string, error) {
	var users []*model.User
	if err := u.DB.WithContext(ctx).Where("name in ?", names).Find(&users).Error; err != nil {
		return nil, err
	}
	userNameMap := make(map[string]string)
	for _, user := range users {
		userNameMap[user.Name] = user.ID
	}
	return userNameMap, nil
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
