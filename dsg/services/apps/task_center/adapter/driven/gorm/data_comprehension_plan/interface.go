package data_comprehension_plan

import (
	"context"

	domain_comprehension_plan "github.com/kweaver-ai/dsg/services/apps/task_center/domain/data_comprehension_plan"
	"github.com/kweaver-ai/dsg/services/apps/task_center/infrastructure/repository/db/model"
)

type DataComprehensionPlanRepo interface {
	Create(ctx context.Context, plan *model.DataComprehensionPlan) error
	Delete(ctx context.Context, id string) error
	GetById(ctx context.Context, id string) (*model.DataComprehensionPlan, error)
	List(ctx context.Context, params domain_comprehension_plan.ComprehensionPlanQueryParam) (int64, []*model.DataComprehensionPlan, error)
	Update(ctx context.Context, plan *model.DataComprehensionPlan) error
	CheckNameRepeat(ctx context.Context, id, name string) (bool, error)
	GetByUniqueIDs(ctx context.Context, ids []uint64) ([]*model.DataComprehensionPlan, error)
}
