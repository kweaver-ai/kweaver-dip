package af_configuration

import (
	"context"

	"gorm.io/gorm"
)

const TableNameUserPermissionBindings = "user_permission_bindings"

type UserPermissionBinding struct {
	UserID       string `json:"user_id,omitempty"`
	PermissionID string `json:"permission_id,omitempty"`
}

func (UserPermissionBinding) TableName() string {
	return DatabaseName + "." + TableNameUserPermissionBindings
}

type UserPermissionBindingsGetter interface {
	UserPermissionBindings() UserPermissionBindingInterface
}

type UserPermissionBindingInterface interface {
	List(ctx context.Context) ([]UserPermissionBinding, error)
}

type userPermissionBindings struct {
	db *gorm.DB
}

// List implements UserPermissionBindingInterface.
func (c *userPermissionBindings) List(ctx context.Context) (result []UserPermissionBinding, err error) {
	if err = c.db.WithContext(ctx).Find(&result).Error; err != nil {
		return nil, err
	}
	return
}

var _ UserPermissionBindingInterface = &userPermissionBindings{}
