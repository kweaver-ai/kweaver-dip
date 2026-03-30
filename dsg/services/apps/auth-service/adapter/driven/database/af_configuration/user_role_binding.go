package af_configuration

import (
	"context"

	"gorm.io/gorm"
)

const TableNameUserRoleBindings = "user_role_bindings"

type UserRoleBinding struct {
	UserID string `json:"user_id,omitempty"`
	RoleID string `json:"role_id,omitempty"`
}

func (UserRoleBinding) TableName() string {
	return DatabaseName + "." + TableNameUserRoleBindings
}

type UserRoleBindingsGetter interface {
	UserRoleBindings() UserRoleBindingInterface
}

type UserRoleBindingInterface interface {
	List(ctx context.Context) ([]UserRoleBinding, error)
}

type userRoleBindings struct {
	db *gorm.DB
}

// List implements UserRoleBindingInterface.
func (c *userRoleBindings) List(ctx context.Context) (result []UserRoleBinding, err error) {
	if err = c.db.WithContext(ctx).Find(&result).Error; err != nil {
		return nil, err
	}
	return
}

var _ UserRoleBindingInterface = &userRoleBindings{}
