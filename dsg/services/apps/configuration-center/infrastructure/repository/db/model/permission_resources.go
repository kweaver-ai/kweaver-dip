package model

import (
	"fmt"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/util"
	"gorm.io/gorm"
)

const TableNamePermissionResources = "permission_resources"

type PermissionResource struct {
	ID          string `json:"id"`
	ServiceName string `json:"service_name"`
	ActionID    string `json:"action_id"`
	Path        string `json:"path"`
	Method      string `json:"method"`
	Action      string `json:"action"`
	MenuKey     string `json:"menu_key"`
	MenuTitle   string `json:"menu_title"`
}

func (PermissionResource) TableName() string { return TableNamePermissionResources }

func (p PermissionResource) ActionKey() string {
	return fmt.Sprintf("%s.%s.%s", p.Path, p.Method, p.Action)
}

func (p *PermissionResource) BeforeCreate(_ *gorm.DB) error {
	if p == nil {
		return nil
	}

	if p.ID == "" {
		p.ID = util.NewUUID()
	}

	if p.ActionID == "" {
		p.ActionID = p.ActionKey()
	}

	return nil
}
