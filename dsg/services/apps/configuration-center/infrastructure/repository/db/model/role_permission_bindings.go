package model

import (
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/util"
	"gorm.io/gorm"
)

const TableNameRolePermissionBindings = "role_permission_bindings"

// RolePermissionBinding mapped from table <role_permission_bindings>
type RolePermissionBinding struct {
	// uuid
	ID string `json:"id,omitempty"`
	// 角色 ID
	RoleID string `json:"role_id,omitempty"`
	// 权限 ID
	PermissionID string `json:"permission_id,omitempty"`
}

func (m *RolePermissionBinding) BeforeCreate(_ *gorm.DB) error {
	if m == nil {
		return nil
	}

	if len(m.ID) == 0 {
		m.ID = util.NewUUID()
	}

	return nil
}

func (RolePermissionBinding) TableName() string { return TableNameRolePermissionBindings }
