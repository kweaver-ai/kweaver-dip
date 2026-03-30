package model

import (
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/util"
	"gorm.io/gorm"
)

const TableNameUserRoleBindings = "user_role_bindings"

// UserRoleBinding mapped from table <user_role_bindings>
type UserRoleBinding struct {
	// uuid
	ID string `json:"id,omitempty"`
	// 用户 ID
	UserID string `json:"user_id,omitempty"`
	// 角色 ID
	RoleID string `json:"role_id,omitempty"`
}

func (m *UserRoleBinding) BeforeCreate(_ *gorm.DB) error {
	if m == nil {
		return nil
	}

	if len(m.ID) == 0 {
		m.ID = util.NewUUID()
	}

	return nil
}

func (UserRoleBinding) TableName() string { return TableNameUserRoleBindings }
