package tree

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/models"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/model"
)

type Repo interface {
	Create(ctx context.Context, m *model.TreeInfo) error
	ExistByName(ctx context.Context, name string, excludedIds ...models.ModelID) (bool, error)
	Delete(ctx context.Context, id models.ModelID) (bool, error)
	ExistById(ctx context.Context, id models.ModelID) (bool, error)
	UpdateByEdit(ctx context.Context, m *model.TreeInfo) error
	Get(ctx context.Context, id models.ModelID) (*model.TreeInfo, error)
	ListByPage(ctx context.Context, offset, limit int, sort, direction, keyword string) ([]*model.TreeInfo, int64, error)
	GetRootNodeId(ctx context.Context, id models.ModelID) (models.ModelID, error)
}
