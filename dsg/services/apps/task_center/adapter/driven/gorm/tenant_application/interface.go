package tenant_application

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/task_center/infrastructure/repository/db/model"
	"gorm.io/gorm"
)

type TenantApplicationRepo interface {
	Create(tx *gorm.DB, ctx context.Context, plan *model.TcTenantApp) error
	Delete(ctx context.Context, id string) error
	GetById(ctx context.Context, id string) (*model.TcTenantApp, error)
	GetByUniqueIDs(ctx context.Context, ids []uint64) ([]*model.TcTenantApp, error)
	List(ctx context.Context, pMap map[string]any, userId string) (int64, []*model.TcTenantApp, error)
	Update(tx *gorm.DB, ctx context.Context, plan *model.TcTenantApp) error
	CheckNameRepeat(ctx context.Context, id, name string) (bool, error)

	CreateDatabaseAccount(ctx context.Context, entity *model.TcTenantAppDbAccount) error
	DeleteDatabaseAccount(ctx context.Context, id string) error
	DeleteDatabaseAccountByTenantApplyId(tx *gorm.DB, ctx context.Context, tenantAppId string) error
	GetDatabaseAccountById(ctx context.Context, id string) (*model.TcTenantAppDbAccount, error)
	GetDatabaseAccountList(ctx context.Context, tenantAppId string) ([]*model.TcTenantAppDbAccount, error)
	UpdateDatabaseAccount(ctx context.Context, entity *model.TcTenantAppDbAccount) error
	BatchCreateDatabaseAccount(tx *gorm.DB, ctx context.Context, ms []*model.TcTenantAppDbAccount) error

	CreateDataResource(ctx context.Context, entity *model.TcTenantAppDbDataResource) error
	DeleteDataResource(ctx context.Context, id string) error
	DeleteDataResourceByTenantApplyId(tx *gorm.DB, ctx context.Context, tenantAppId string) error
	GetDataResourceById(ctx context.Context, id string) (*model.TcTenantAppDbDataResource, error)
	GetDataResourceList(ctx context.Context, databaseAccountId string) ([]*model.TcTenantAppDbDataResource, error)
	UpdateDataResource(ctx context.Context, entity *model.TcTenantAppDbDataResource) error
	BatchCreateDataResource(tx *gorm.DB, ctx context.Context, ms []*model.TcTenantAppDbDataResource) error
}
