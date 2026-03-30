package af_configuration

import (
	"context"

	"gorm.io/gorm"
)

const TableNameRoleGroupRoleBindings = "role_group_role_bindings"

type RoleGroupRoleBinding struct {
	RoleGroupID string `json:"role_group_id"`
	RoleID      string `json:"role_id"`
}

func (RoleGroupRoleBinding) TableName() string {
	return DatabaseName + "." + TableNameRoleGroupRoleBindings
}

type RoleGroupRoleBindingsGetter interface {
	RoleGroupRoleBindings() RoleGroupRoleBindingInterface
}

type RoleGroupRoleBindingInterface interface {
	List(ctx context.Context) ([]RoleGroupRoleBinding, error)
}

type roleGroupRoleBindings struct {
	db *gorm.DB
}

// List implements RoleGroupRoleBindingInterface.
func (c *roleGroupRoleBindings) List(ctx context.Context) (result []RoleGroupRoleBinding, err error) {
	if err = c.db.WithContext(ctx).Find(&result).Error; err != nil {
		return nil, err
	}
	return
}

var _ RoleGroupRoleBindingInterface = &roleGroupRoleBindings{}
