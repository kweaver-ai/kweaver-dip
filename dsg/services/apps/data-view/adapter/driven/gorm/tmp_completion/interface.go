package tmp_completion

import (
	"context"
	"time"

	"github.com/kweaver-ai/dsg/services/apps/data-view/infrastructure/db/model"
)

type TmpCompletionRepo interface {
	Create(ctx context.Context, m *model.TmpCompletion) error
	Get(ctx context.Context, formViewId string) (*model.TmpCompletion, error)
	GetByCompletionId(ctx context.Context, completionId string) (*model.TmpCompletion, error)
	Update(ctx context.Context, m *model.TmpCompletion) error
	Delete(ctx context.Context, formViewId string) error
	SelectOverTimeCompletion(ctx context.Context, stepTime *time.Time) ([]*model.TmpCompletion, error)
}
