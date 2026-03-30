package af_configuration

import (
	"context"

	"gorm.io/gorm"
)

const TableNameSystemRole = "system_role"

type SystemRole struct {
	ID    string `json:"id,omitempty" gorm:"primaryKey"`
	Type  string `json:"type,omitempty"`
	Scope string `json:"scope,omitempty"`
}

func (SystemRole) TableName() string {
	return DatabaseName + "." + TableNameSystemRole
}

type SystemRolesGetter interface {
	SystemRoles() SystemRoleInterface
}

type SystemRoleInterface interface {
	Get(ctx context.Context, id string) (*SystemRole, error)
	List(ctx context.Context) ([]SystemRole, error)
}

type systemRoles struct {
	db *gorm.DB
}

// Get implements SystemRoleInterface.
func (c *systemRoles) Get(ctx context.Context, id string) (result *SystemRole, err error) {
	result = &SystemRole{ID: id}
	if err = c.db.WithContext(ctx).Take(result).Error; err != nil {
		return nil, err
	}
	return
}

// List implements SystemRoleInterface.
func (c *systemRoles) List(ctx context.Context) (result []SystemRole, err error) {
	if err = c.db.WithContext(ctx).Find(&result).Error; err != nil {
		return nil, err
	}
	return
}

var _ SystemRoleInterface = &systemRoles{}
