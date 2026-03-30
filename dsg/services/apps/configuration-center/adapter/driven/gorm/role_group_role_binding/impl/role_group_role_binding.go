package impl

import (
	"context"
	"errors"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/gorm/role_group_role_binding"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/repository/db/model"
	"gorm.io/gorm"
)

type repo struct {
	db *gorm.DB
}

func NewRepo(db *gorm.DB) role_group_role_binding.Repo {
	return &repo{
		db: db,
	}
}

func (r *repo) Update(ctx context.Context, adds []*model.RoleGroupRoleBinding, deleteBindings []string) (err error) {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if len(adds) > 0 {
			err = tx.Model(&model.RoleGroupRoleBinding{}).Create(&adds).Error
			if err != nil {
				return err
			}
		}
		if len(deleteBindings) > 0 {
			err = tx.Model(&model.RoleGroupRoleBinding{}).Where("id in ?", deleteBindings).Delete(&model.RoleGroupRoleBinding{}).Error
			if err != nil {
				return err
			}
		}
		return nil
	})
}

func (r *repo) GetByRoleGroupId(ctx context.Context, roleGroupId string) ([]*model.RoleGroupRoleBinding, error) {
	var roleGroupBindings []*model.RoleGroupRoleBinding
	err := r.db.Model(&model.RoleGroupRoleBinding{}).WithContext(ctx).Where("role_group_id =?", roleGroupId).Find(&roleGroupBindings).Error
	if err != nil {
		return nil, errorcode.Detail(errorcode.UserDataBaseError, err.Error())
	}
	return roleGroupBindings, nil
}

func (r *repo) Get(ctx context.Context, roleGroupId, roleId string) (*model.RoleGroupRoleBinding, error) {
	var roleGroupBinding *model.RoleGroupRoleBinding
	err := r.db.Model(&model.RoleGroupRoleBinding{}).WithContext(ctx).Where("role_group_id = ? and role_id = ?", roleGroupId, roleId).First(&roleGroupBinding).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		} else {
			return nil, err
		}
	}
	return roleGroupBinding, nil
}
