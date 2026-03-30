package impl

import (
	"context"
	"errors"
	"time"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/gorm/user_role_binding"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/repository/db/model"
	"gorm.io/gorm"
)

type repo struct {
	db *gorm.DB
}

func NewRepo(db *gorm.DB) user_role_binding.Repo {
	return &repo{db: db}
}

func (r *repo) Update(ctx context.Context, userIds []string, updatedBy string, addRoleBindings []*model.UserRoleBinding, addRoleGroupBindings []*model.UserRoleGroupBinding, deleteRoleBindings, deleteRoleGroupBindings []string) (err error) {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		// 更新用户更新人、更新时间
		if err := tx.Model(&model.User{}).Where("id in ?", userIds).UpdateColumns(map[string]interface{}{
			"updated_at": time.Now(),
			"updated_by": updatedBy,
		}).Error; err != nil {
			return err
		}
		// 更新用户角色绑定关系
		if len(addRoleBindings) > 0 {
			err = tx.Model(&model.UserRoleBinding{}).Create(&addRoleBindings).Error
			if err != nil {
				return err
			}
		}
		if len(deleteRoleBindings) > 0 {
			if err != nil {
				return err
			}
		}
		// 更新用户角色组绑定关系
		if len(addRoleGroupBindings) > 0 {
			err = tx.Model(&model.UserRoleGroupBinding{}).Create(&addRoleGroupBindings).Error
			if err != nil {
				return err
			}
		}
		if len(deleteRoleGroupBindings) > 0 {
			err = tx.Model(&model.UserRoleGroupBinding{}).Where("id in ?", deleteRoleGroupBindings).Delete(&model.UserRoleGroupBinding{}).Error
			if err != nil {
				return err
			}
		}
		return nil
	})
}

func (r *repo) GetByUserId(ctx context.Context, userId string) ([]string, error) {
	var roles []string
	err := r.db.Model(&model.UserRoleBinding{}).WithContext(ctx).Select("role_id").Where("user_id =?", userId).Find(&roles).Error
	if err != nil {
		return nil, errorcode.Detail(errorcode.UserDataBaseError, err.Error())
	}
	return roles, nil
}

func (r *repo) Get(ctx context.Context, userId, roleId string) (*model.UserRoleBinding, error) {
	var userRoleBinding *model.UserRoleBinding
	err := r.db.Model(&model.UserRoleBinding{}).WithContext(ctx).Where("user_id = ? and role_id = ?", userId, roleId).First(&userRoleBinding).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		} else {
			return nil, err
		}
	}
	return userRoleBinding, nil
}
