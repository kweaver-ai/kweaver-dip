package model

const TableNamePermissionPermissionResourceBindings = "permission_permission_resource_bindings"

// PermissionPermissionResourceBinding mapped from table <role_group_role_bindings>
type PermissionPermissionResourceBinding struct {
	// 权限 ID
	PermissionID string `json:"permission_id,omitempty"`
	// 权限资源 ID
	PermissionResourceID string `json:"permission_resource_id,omitempty"`
	// 操作
	Action string `json:"action,omitempty"`
}

func (PermissionPermissionResourceBinding) TableName() string {
	return TableNamePermissionPermissionResourceBindings
}
