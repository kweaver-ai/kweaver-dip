package model

import (
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/util"
	"gorm.io/gorm"
)

const TableNamePermissions = "permissions"

// Permission mapped from table <permissions>
type Permission struct {
	Metadata
	// 名称
	Name string `json:"name,omitempty"`
	// 分类
	Category string `json:"category,omitempty"`
	// 描述
	Description string `json:"description,omitempty"`
}

func (m *Permission) BeforeCreate(_ *gorm.DB) error {
	if m == nil {
		return nil
	}

	if len(m.ID) == 0 {
		m.ID = util.NewUUID()
	}

	return nil
}

func (Permission) TableName() string { return TableNamePermissions }
