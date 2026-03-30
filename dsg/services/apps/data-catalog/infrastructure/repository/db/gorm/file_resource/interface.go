package file_resource

import (
	"context"

	domain "github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/file_resource"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/model"
	"gorm.io/gorm"
)

type FileResourceRepo interface {
	Db() *gorm.DB
	Create(ctx context.Context, fileResource *model.TFileResource) error
	GetFileResourceList(ctx context.Context, req *domain.GetFileResourceListReq) (totalCount int64, fileResources []*model.TFileResource, err error)
	GetById(ctx context.Context, Id uint64, tx ...*gorm.DB) (fileResource *model.TFileResource, err error)
	Save(ctx context.Context, fileResource *model.TFileResource) error
	Delete(ctx context.Context, fileResource *model.TFileResource, tx ...*gorm.DB) error
	AuditProcessMsgProc(ctx context.Context, fileResourceId, auditApplySN uint64, alterInfo map[string]interface{}, tx ...*gorm.DB) (bool, error)
	AuditResultUpdate(ctx context.Context, fileResourceId, auditApplySN uint64, alterInfo map[string]interface{}, tx ...*gorm.DB) (bool, error)
	UpdateAuditStateByProcDefKey(ctx context.Context, procDefKeys []string, tx ...*gorm.DB) (bool, error)
}
