package model

import (
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/util"
	"gorm.io/gorm"
)

const TableNameRoleGroupRoleBindings = "role_group_role_bindings"

// RoleGroupRoleBinding mapped from table <role_group_role_bindings>
type RoleGroupRoleBinding struct {
	// uuid
	ID string `json:"id,omitempty"`
	// 角色组 ID
	RoleGroupID string `json:"role_group_id,omitempty"`
	// 角色 ID
	RoleID string `json:"role_id,omitempty"`
}

func (m *RoleGroupRoleBinding) BeforeCreate(_ *gorm.DB) error {
	if m == nil {
		return nil
	}

	if len(m.ID) == 0 {
		m.ID = util.NewUUID()
	}

	return nil
}

func (RoleGroupRoleBinding) TableName() string { return TableNameRoleGroupRoleBindings }
