package model

import (
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/util"
	"gorm.io/gorm"
)

const TableNameUserRoleGroupBindings = "user_role_group_bindings"

// UserRoleGroupBinding mapped from table <user_role_group_bindings>
type UserRoleGroupBinding struct {
	// uuid
	ID string `json:"id,omitempty"`
	// 用户 ID
	UserID string `json:"user_id,omitempty"`
	// 角色组 ID
	RoleGroupID string `json:"role_group_id,omitempty"`
}

func (m *UserRoleGroupBinding) BeforeCreate(_ *gorm.DB) error {
	if m == nil {
		return nil
	}

	if len(m.ID) == 0 {
		m.ID = util.NewUUID()
	}

	return nil
}

func (UserRoleGroupBinding) TableName() string { return TableNameUserRoleGroupBindings }
