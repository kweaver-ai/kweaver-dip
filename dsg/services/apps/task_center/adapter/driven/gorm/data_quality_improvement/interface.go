package data_quality_improvement

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/task_center/infrastructure/repository/db/model"
)

type Repo interface {
	BatchCreate(ctx context.Context, improvements []*model.DataQualityImprovement) error
	Update(ctx context.Context, workOrderId string, improvements []*model.DataQualityImprovement) error
	GetByWorkOrderId(ctx context.Context, workOrderId string) ([]*model.DataQualityImprovement, error)
}
