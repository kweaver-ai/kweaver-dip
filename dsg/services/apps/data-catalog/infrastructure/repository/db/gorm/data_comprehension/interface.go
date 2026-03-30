package data_comprehension

import (
	"context"

	domain "github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/data_comprehension"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-common/rest/configuration_center"
	"gorm.io/gorm"
)

type RepoOp interface {
	Upsert(ctx context.Context, content *model.DataComprehensionDetail) error
	Audit(ctx context.Context, comprehensionDetail *model.DataComprehensionDetail, bind *configuration_center.GetProcessBindByAuditTypeRes, catalogName string) error
	TransactionUpsert(ctx context.Context, tx *gorm.DB, content *model.DataComprehensionDetail) error
	//Get(ctx context.Context, catalogId uint64) (*model.DataComprehensionDetail, error)
	//GetByIds(ctx context.Context, catalogIds []uint64) (details []*model.DataComprehensionDetail, err error)
	GetCatalogId(ctx context.Context, catalogId uint64) (detail *model.DataComprehensionDetail, err error)
	Get(ctx context.Context, catalogId uint64, taskId string) (detail *model.DataComprehensionDetail, err error)
	GetByCatalogIds(ctx context.Context, catalogIds []uint64) (details []*model.DataComprehensionDetail, err error)
	GetByTaskId(ctx context.Context, taskId string) (details []*model.DataComprehensionDetail, err error)
	GetStatus(ctx context.Context, catalogId uint64) (detail *model.DataComprehensionDetail, err error)
	Delete(ctx context.Context, catalogId uint64) error
	List(ctx context.Context, catalogId ...uint64) ([]*model.DataComprehensionDetail, error)
	ListByPage(ctx context.Context, req *domain.GetReportListReq) (total int64, list []*ListByPageRes, err error)
	ListByCodes(ctx context.Context, catalogCodes ...string) (details []*model.DataComprehensionDetail, err error)
	Update(ctx context.Context, detail *model.DataComprehensionDetail) error
	UpdateByAuditType(ctx context.Context, procDefKeys []string, detail *model.DataComprehensionDetail) error
	GetBrief(ctx context.Context, catalogId uint64) (data *model.DataComprehensionDetail, err error)
	GetByAppId(ctx context.Context, appId uint64) (data *model.DataComprehensionDetail, err error)
	GetCatalog(ctx context.Context, req *domain.GetCatalogListReq) (total int64, res []*domain.Catalog, err error)
}

type ListByPageRes struct {
	model.DataComprehensionDetail
	DepartmentID string `gorm:"column:department_id" json:"department_id"` // 部门id
}
