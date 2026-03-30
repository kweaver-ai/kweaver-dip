package model

import (
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/util"
	"gorm.io/gorm"
)

const TableNameUserPermissionBindings = "user_permission_bindings"

// UserPermissionBinding mapped from table <user_permission_bindings>
type UserPermissionBinding struct {
	// uuid
	ID string `json:"id,omitempty"`
	// 用户 ID
	UserID string `json:"user_id,omitempty"`
	// 权限 ID
	PermissionID string `json:"permission_id,omitempty"`
}

func (m *UserPermissionBinding) BeforeCreate(_ *gorm.DB) error {
	if m == nil {
		return nil
	}

	if len(m.ID) == 0 {
		m.ID = util.NewUUID()
	}

	return nil
}

func (UserPermissionBinding) TableName() string { return TableNameUserPermissionBindings }
