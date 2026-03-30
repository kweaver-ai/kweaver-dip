package impl

import (
	"context"
	"errors"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/gorm/user_role_group_binding"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/repository/db/model"
	"gorm.io/gorm"
)

type repo struct {
	db *gorm.DB
}

func NewRepo(db *gorm.DB) user_role_group_binding.Repo {
	return &repo{db: db}
}

func (r *repo) GetByUserId(ctx context.Context, userId string) ([]string, error) {
	var roleGroups []string
	err := r.db.Model(&model.UserRoleGroupBinding{}).WithContext(ctx).Select("role_group_id").Where("user_id =?", userId).Find(&roleGroups).Error
	if err != nil {
		return nil, errorcode.Detail(errorcode.UserDataBaseError, err.Error())
	}
	return roleGroups, nil
}

func (r *repo) Get(ctx context.Context, userId, roleGroupId string) (*model.UserRoleGroupBinding, error) {
	var userRoleGroupBinding *model.UserRoleGroupBinding
	err := r.db.Model(&model.UserRoleGroupBinding{}).WithContext(ctx).Where("user_id = ? and role_group_id = ?", userId, roleGroupId).First(&userRoleGroupBinding).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		} else {
			return nil, err
		}
	}
	return userRoleGroupBinding, nil
}
