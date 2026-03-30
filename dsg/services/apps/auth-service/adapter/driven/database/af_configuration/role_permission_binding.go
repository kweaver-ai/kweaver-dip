package af_configuration

import (
	"context"

	"gorm.io/gorm"
)

const TableNameRolePermissionBinding = "role_permission_bindings"

type RolePermissionBinding struct {
	RoleID       string `json:"role_id,omitempty"`
	PermissionID string `json:"permission_id,omitempty"`
}

func (RolePermissionBinding) TableName() string {
	return DatabaseName + "." + TableNameRolePermissionBinding
}

type RolePermissionBindingsGetter interface {
	RolePermissionBindings() RolePermissionBindingInterface
}

type RolePermissionBindingInterface interface {
	List(ctx context.Context) ([]RolePermissionBinding, error)
}

type rolePermissionBindings struct {
	db *gorm.DB
}

// List implements RolePermissionBindingInterface.
func (c *rolePermissionBindings) List(ctx context.Context) (result []RolePermissionBinding, err error) {
	if err = c.db.WithContext(ctx).Find(&result).Error; err != nil {
		return nil, err
	}
	return
}

var _ RolePermissionBindingInterface = &rolePermissionBindings{}
