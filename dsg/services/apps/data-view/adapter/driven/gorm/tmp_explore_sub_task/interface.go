package tmp_explore_sub_task

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/data-view/infrastructure/db/model"
)

type TmpExploreSubTaskRepo interface {
	Create(ctx context.Context, m *model.TmpExploreSubTask) error
	BatchCreate(ctx context.Context, m []*model.TmpExploreSubTask) error
	GetByID(ctx context.Context, subTaskId uint64) (*model.TmpExploreSubTask, error)
	Get(ctx context.Context, parentTaskId string, status []int32, limit int) ([]*model.TmpExploreSubTask, error)
	GetByStatus(ctx context.Context, status []int32) ([]string, error)
	Update(ctx context.Context, m *model.TmpExploreSubTask) error
	UpdateStatusByParentTaskID(ctx context.Context, parentTaskId string, status int32) error
	Delete(ctx context.Context, parentTaskId string) error
	GetByFormIds(ctx context.Context, ids []string, status []int32) ([]string, error)
}
