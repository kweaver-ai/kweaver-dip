package fusion_model

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/task_center/infrastructure/repository/db/model"
)

type FusionModelRepo interface {
	CreateInBatches(ctx context.Context, fields []*model.TFusionField) error
	DeleteInBatches(ctx context.Context, ids []uint64, uid string) error
	List(ctx context.Context, workOrderId string) (fields []*model.TFusionField, err error)
	Update(ctx context.Context, field *model.TFusionField) error
	DeleteByWorkOrderId(ctx context.Context, workOrderId, uid string) error
}
