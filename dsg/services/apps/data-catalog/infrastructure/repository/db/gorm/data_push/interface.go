package data_push

import (
	"context"

	domain "github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/data_push"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/model"
	"gorm.io/gorm"
)

type Repo interface {
	Insert(ctx context.Context, data *model.TDataPushModel, fields []*model.TDataPushField) error
	Get(ctx context.Context, id uint64) (*model.TDataPushModel, error)
	GetFields(ctx context.Context, modelID uint64) ([]*model.TDataPushField, error)
	Query(ctx context.Context, req *domain.ListPageReq) (int64, []*model.TDataPushModel, error)
	QuerySandboxCount(ctx context.Context, req *domain.QuerySandboxPushReq) (objs []string, err error)
	Update(ctx context.Context, data *model.TDataPushModel, fields []*model.TDataPushField) error
	UpdateStatus(ctx context.Context, data *model.TDataPushModel) error
	UpdateSchedule(ctx context.Context, data *model.TDataPushModel) error
	Delete(ctx context.Context, tx *gorm.DB, id uint64) error
	AnnualStatistics(ctx context.Context) (data []*domain.AnnualStatisticItem, err error)
	Overview(ctx context.Context, req *domain.OverviewReq) (data *domain.OverviewResp, err error)
	QueryUnFinished(ctx context.Context) (objs []*model.TDataPushModel, err error)
	AuditRepo
}

type AuditRepo interface {
	AuditResultUpdate(ctx context.Context, dataPushModelID uint64, alterInfo map[string]interface{}) (bool, error)
	UpdateAuditStateWhileDelProc(ctx context.Context, procDefKeys []string) (bool, error)
}
