package open_catalog

import (
	"context"

	domain "github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/open_catalog"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/model"
	"gorm.io/gorm"
)

type OpenCatalogRepo interface {
	Db() *gorm.DB
	GetOpenableCatalogList(ctx context.Context, req *domain.GetOpenableCatalogListReq) (totalCount int64, catalogs []*model.TDataCatalog, err error)
	Create(ctx context.Context, catalog *model.TOpenCatalog) error
	GetOpenCatalogList(ctx context.Context, req *domain.GetOpenCatalogListReq) (totalCount int64, catalogs []*domain.OpenCatalogVo, err error)
	GetByCatalogId(ctx context.Context, catalogId uint64, tx ...*gorm.DB) (catalog *model.TOpenCatalog, err error)
	GetById(ctx context.Context, Id uint64, tx ...*gorm.DB) (catalog *model.TOpenCatalog, err error)
	Save(ctx context.Context, catalog *model.TOpenCatalog) error
	Delete(ctx context.Context, catalog *model.TOpenCatalog, tx ...*gorm.DB) error
	GetTotalOpenCatalogCount(ctx context.Context, tx ...*gorm.DB) (count int64, err error)
	GetAuditingOpenCatalogCount(ctx context.Context, tx ...*gorm.DB) (count int64, err error)
	GetResourceTypeCount(ctx context.Context, tx ...*gorm.DB) (resourceTypeCount []*domain.TypeCatalogCount, err error)
	GetMonthlyNewOpenCatalogCount(ctx context.Context, tx ...*gorm.DB) (monthlyNewOpenCatalogCount []*domain.NewOpenCatalogCount, err error)
	GetDepartmentCatalogCount(ctx context.Context, tx ...*gorm.DB) (departmentCatalogCountVo []*domain.DepartmentCatalogCount, err error)
	AuditProcessMsgProc(ctx context.Context, catalogID, auditApplySN uint64, alterInfo map[string]interface{}, tx ...*gorm.DB) (bool, error)
	AuditResultUpdate(ctx context.Context, catalogID, auditApplySN uint64, alterInfo map[string]interface{}, tx ...*gorm.DB) (bool, error)
	UpdateAuditStateByProcDefKey(ctx context.Context, procDefKeys []string, tx ...*gorm.DB) (bool, error)
	GetAllCatalogIds(ctx context.Context, tx ...*gorm.DB) (catalogIds []uint64, err error)
}
