package model

type UserPermissionScope struct {
	ID string `json:"id,omitempty"` // 用户id

	Name string `json:"name,omitempty"` // 用户名

	PermissionID string `json:"permission_id,omitempty"` // 权限 ID

	Scope string `json:"scope,omitempty"` // 权限范围
}
