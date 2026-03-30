package impltype

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/gorm/role_permission_binding"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/repository/db/model"
	"gorm.io/gorm"
)

type repo struct {
	db *gorm.DB
}

func NewRepo(db *gorm.DB) role_permission_binding.Repo {
	return &repo{db: db}
}

func (r *repo) Update(ctx context.Context, role *model.SystemRole, adds []*model.RolePermissionBinding, deleteBindings []string) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Model(&model.SystemRole{}).Where("id = ?", role.ID).Updates(&role).Error; err != nil {
			return err
		}
		if len(adds) > 0 {
			if err := tx.Model(&model.RolePermissionBinding{}).Create(&adds).Error; err != nil {
				return err
			}
		}
		return nil
	})
}

func (r *repo) GetByRoleId(ctx context.Context, roleId string) ([]*model.RolePermissionBinding, error) {
	var rolePermissionBindings []*model.RolePermissionBinding
	err := r.db.Model(&model.RolePermissionBinding{}).WithContext(ctx).Where("role_id =?", roleId).Find(&rolePermissionBindings).Error
	if err != nil {
		return nil, errorcode.Detail(errorcode.UserDataBaseError, err.Error())
	}
	return rolePermissionBindings, nil
}
