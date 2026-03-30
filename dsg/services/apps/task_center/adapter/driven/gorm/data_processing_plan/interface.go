package data_processing_plan

import (
	"context"

	data_processing_plan "github.com/kweaver-ai/dsg/services/apps/task_center/domain/data_processing_plan"
	"github.com/kweaver-ai/dsg/services/apps/task_center/infrastructure/repository/db/model"
)

type DataProcessingPlanRepo interface {
	Create(ctx context.Context, plan *model.DataProcessingPlan) error
	Delete(ctx context.Context, id string) error
	GetById(ctx context.Context, id string) (*model.DataProcessingPlan, error)
	GetByUniqueIDs(ctx context.Context, ids []uint64) ([]*model.DataProcessingPlan, error)
	List(ctx context.Context, params data_processing_plan.ProcessingPlanQueryParam) (int64, []*model.DataProcessingPlan, error)
	Update(ctx context.Context, plan *model.DataProcessingPlan) error
	CheckNameRepeat(ctx context.Context, id, name string) (bool, error)
}
