package af_configuration

import (
	"context"

	"gorm.io/gorm"
)

const TableNameUserRoleGroupBindings = "user_role_group_bindings"

type UserRoleGroupBinding struct {
	UserID      string `json:"user_id,omitempty"`
	RoleGroupID string `json:"role_group_id,omitempty"`
}

func (UserRoleGroupBinding) TableName() string {
	return DatabaseName + "." + TableNameUserRoleGroupBindings
}

type UserRoleGroupBindingsGetter interface {
	UserRoleGroupBindings() UserRoleGroupBindingInterface
}

type UserRoleGroupBindingInterface interface {
	List(ctx context.Context) ([]UserRoleGroupBinding, error)
}

type userRoleGroupBindings struct {
	db *gorm.DB
}

// List implements UserRoleGroupBindingInterface.
func (c *userRoleGroupBindings) List(ctx context.Context) (result []UserRoleGroupBinding, err error) {
	if err = c.db.WithContext(ctx).Find(&result).Error; err != nil {
		return nil, err
	}
	return
}

var _ UserRoleGroupBindingInterface = &userRoleGroupBindings{}
