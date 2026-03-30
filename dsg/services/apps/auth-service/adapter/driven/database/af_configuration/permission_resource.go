package af_configuration

import (
	"context"
	"fmt"
	"github.com/kweaver-ai/dsg/services/apps/auth-service/common/util"
	"gorm.io/gorm"
)

const TableNamePermissionResources = "menu_resources"

type PermissionResource struct {
	ID          string `json:"id"`
	ServiceName string `json:"service_name"`
	Path        string `json:"path"`
	Method      string `json:"method"`
	Action      string `json:"action"`
	Resource    string `json:"resource"`
}

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
	return nil
}

func (PermissionResource) TableName() string {
	return DatabaseName + "." + TableNamePermissionResources
}

type PermissionResourcesGetter interface {
	PermissionResources() PermissionResourceInterface
}

type PermissionResourceInterface interface {
	Update(rs []*PermissionResource) error
	GetByAPIKey(ctx context.Context, path, method string) ([]*PermissionResource, error)
	List(ctx context.Context) ([]PermissionResource, error)
}

type permissionResources struct {
	db *gorm.DB
}

func (c *permissionResources) Update(rs []*PermissionResource) error {
	if len(rs) <= 0 {
		return nil
	}
	permissionResourceTableName := PermissionResource{}.TableName()
	serviceName := rs[0].ServiceName

	err := c.db.Transaction(func(tx *gorm.DB) error {
		//先删除该服务的所有资源
		if err := tx.Exec(fmt.Sprintf("delete from %s where service_name = ?", permissionResourceTableName), serviceName).Error; err != nil {
			return err
		}
		//插入新的资源
		return tx.Create(rs).Error
	})
	return err
}

// GetByAPIKey implements PermissionResourceInterface.
func (c *permissionResources) GetByAPIKey(ctx context.Context, path, method string) (result []*PermissionResource, err error) {
	condition := &PermissionResource{
		Path:   path,
		Method: method,
	}
	if err = c.db.WithContext(ctx).Where(condition).Find(&result).Error; err != nil {
		return nil, err
	}
	return result, nil
}

// List implements PermissionResourceInterface.
func (c *permissionResources) List(ctx context.Context) (result []PermissionResource, err error) {
	if err = c.db.WithContext(ctx).Find(&result).Error; err != nil {
		return nil, err
	}
	return
}

var _ PermissionResourceInterface = &permissionResources{}
