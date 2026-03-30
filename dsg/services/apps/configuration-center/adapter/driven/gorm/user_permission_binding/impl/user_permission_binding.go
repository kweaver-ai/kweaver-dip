package impl

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/gorm/user_permission_binding"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/repository/db/model"
	"gorm.io/gorm"
)

type repo struct {
	db *gorm.DB
}

func NewRepo(db *gorm.DB) user_permission_binding.Repo {
	return &repo{db: db}
}

func (r *repo) Update(ctx context.Context, user *model.User, adds []*model.UserPermissionBinding, deleteBindings []string) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Model(&model.User{}).Where("id = ?", user.ID).Omit("register_at").Updates(&user).Error; err != nil {
			return err
		}
		if len(adds) > 0 {
			if err := tx.Model(&model.UserPermissionBinding{}).Create(&adds).Error; err != nil {
				return err
			}
		}
		if len(deleteBindings) > 0 {
			if err := tx.Model(&model.UserPermissionBinding{}).Where("id in ?", deleteBindings).Delete(&model.UserPermissionBinding{}).Error; err != nil {
				return err
			}
		}
		return nil
	})
}

func (r *repo) GetByUserId(ctx context.Context, userId string) ([]*model.UserPermissionBinding, error) {
	var userPermissionBindings []*model.UserPermissionBinding
	err := r.db.Model(&model.UserPermissionBinding{}).WithContext(ctx).Where("user_id =?", userId).Find(&userPermissionBindings).Error
	if err != nil {
		return nil, errorcode.Detail(errorcode.UserDataBaseError, err.Error())
	}
	return userPermissionBindings, nil
}
