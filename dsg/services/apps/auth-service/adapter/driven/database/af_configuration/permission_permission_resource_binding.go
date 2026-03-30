package af_configuration

import (
	"context"

	"gorm.io/gorm"
)

const TableNamePermissionPermissionResourceBindings = "permission_permission_resource_bindings"

type PermissionPermissionResourceBinding struct {
	PermissionID         string `json:"permission_id,omitempty"`
	Scope                string `json:"scope,omitempty"`
	PermissionResourceID string `json:"permission_resource_id,omitempty"`
	Action               string `json:"action,omitempty"`
	Condition            string `json:"condition,omitempty"`
}

func (PermissionPermissionResourceBinding) TableName() string {
	return DatabaseName + "." + TableNamePermissionPermissionResourceBindings
}

type PermissionPermissionResourceBindingsGetter interface {
	PermissionPermissionResourceBindings() PermissionPermissionResourceBindingInterface
}

type PermissionPermissionResourceBindingInterface interface {
	List(ctx context.Context) ([]PermissionPermissionResourceBinding, error)
}

type permissionPermissionResources struct {
	db *gorm.DB
}

// List implements PermissionPermissionResourceBindingInterface.
func (c *permissionPermissionResources) List(ctx context.Context) (result []PermissionPermissionResourceBinding, err error) {
	if err = c.db.WithContext(ctx).Find(&result).Error; err != nil {
		return nil, err
	}
	return
}

var _ PermissionPermissionResourceBindingInterface = &permissionPermissionResources{}
