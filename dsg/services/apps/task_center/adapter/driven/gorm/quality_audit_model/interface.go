package quality_audit_model

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/task_center/infrastructure/repository/db/model"
)

type QualityAuditModelRepo interface {
	CreateInBatches(ctx context.Context, relations []*model.TQualityAuditFormViewRelation) error
	DeleteByIds(ctx context.Context, ids []uint64, uid string) error
	List(ctx context.Context, workOrderId string) (relations []*model.TQualityAuditFormViewRelation, err error)
	GetViewIds(ctx context.Context, workOrderId string) (viewIds []string, err error)
	DeleteByWorkOrderId(ctx context.Context, workOrderId, uid string) error
	GetByViewIds(ctx context.Context, viewIds []string) (relations []*model.TQualityAuditFormViewRelation, err error)
	GetDatasourceIds(ctx context.Context, workOrderId string) (datasourceIds []string, err error)
	GetByDatasourceId(ctx context.Context, workOrderId, datasourceId string, formViewIds []string, limit, offset int) (total int64, viewIds []string, err error)
	GetUnSyncViewIds(ctx context.Context, workOrderId string) (viewIds []string, err error)
	UpdateStatusInBatches(ctx context.Context, workOrderId string, viewIds []string) error
}
