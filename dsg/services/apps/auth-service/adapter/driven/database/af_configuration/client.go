package af_configuration

import "gorm.io/gorm"

const DatabaseName = "af_configuration"

type Client struct {
	DB *gorm.DB
}

// PermissionPermissionResourceBindings implements Interface.
func (c *Client) PermissionPermissionResourceBindings() PermissionPermissionResourceBindingInterface {
	return &permissionPermissionResources{db: c.DB}
}

// PermissionResources implements Interface.
func (c *Client) PermissionResources() PermissionResourceInterface {
	return &permissionResources{db: c.DB}
}

// RoleGroupRoleBindings implements Interface.
func (c *Client) RoleGroupRoleBindings() RoleGroupRoleBindingInterface {
	return &roleGroupRoleBindings{db: c.DB}
}

// RolePermissionBindings implements Interface.
func (c *Client) RolePermissionBindings() RolePermissionBindingInterface {
	return &rolePermissionBindings{db: c.DB}
}

// SystemRoles implements Interface.
func (c *Client) SystemRoles() SystemRoleInterface {
	return &systemRoles{db: c.DB}
}

// UserPermissionBindings implements Interface.
func (c *Client) UserPermissionBindings() UserPermissionBindingInterface {
	return &userPermissionBindings{db: c.DB}
}

// UserRoleBindings implements Interface.
func (c *Client) UserRoleBindings() UserRoleBindingInterface {
	return &userRoleBindings{db: c.DB}
}

// UserRoleGroupBindings implements Interface.
func (c *Client) UserRoleGroupBindings() UserRoleGroupBindingInterface {
	return &userRoleGroupBindings{db: c.DB}
}

// Users implements Interface.
func (c *Client) Users() UserInterface {
	return &users{db: c.DB}
}

var _ Interface = &Client{}
