package model

import (
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/util"
	"gorm.io/gorm"
)

const TableNameRoleGroups = "role_groups"

// RoleGroup mapped from table <role_groups>
type RoleGroup struct {
	Metadata
	// 名称
	Name string `json:"name,omitempty"`
	// 描述
	Description string `json:"description,omitempty"`
}

func (m *RoleGroup) BeforeCreate(_ *gorm.DB) error {
	if m == nil {
		return nil
	}

	if len(m.ID) == 0 {
		m.ID = util.NewUUID()
	}

	return nil
}

func (RoleGroup) TableName() string { return TableNameRoleGroups }
