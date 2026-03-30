package data_aggregation_plan

import (
	"context"

	data_aggregation_plan "github.com/kweaver-ai/dsg/services/apps/task_center/domain/data_aggregation_plan"
	"github.com/kweaver-ai/dsg/services/apps/task_center/infrastructure/repository/db/model"
)

type DataAggregatioPlanRepo interface {
	Create(ctx context.Context, plan *model.DataAggregationPlan) error
	Delete(ctx context.Context, id string) error
	GetById(ctx context.Context, id string) (*model.DataAggregationPlan, error)
	GetByUniqueIDs(ctx context.Context, ids []uint64) ([]*model.DataAggregationPlan, error)
	List(ctx context.Context, params data_aggregation_plan.AggregationPlanQueryParam) (int64, []*model.DataAggregationPlan, error)
	Update(ctx context.Context, plan *model.DataAggregationPlan) error
	CheckNameRepeat(ctx context.Context, id, name string) (bool, error)
}
