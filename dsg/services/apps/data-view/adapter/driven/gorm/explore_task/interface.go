package explore_task

import (
	"context"

	domain "github.com/kweaver-ai/dsg/services/apps/data-view/domain/explore_task"
	"github.com/kweaver-ai/dsg/services/apps/data-view/infrastructure/db/model"
)

type ExploreTaskRepo interface {
	Create(ctx context.Context, m *model.ExploreTask) (string, error)
	GetV1(ctx context.Context, taskId string, status []int32, types []int32, limit int, offset int) ([]*model.ExploreTask, error)
	UpdateV1(ctx context.Context, m *model.ExploreTask, status []int32) error
	Get(ctx context.Context, taskId string) (*model.ExploreTask, error)
	GetByTaskId(ctx context.Context, taskId string) (*model.ExploreTask, error)
	Update(ctx context.Context, m *model.ExploreTask) error
	Delete(ctx context.Context, taskId string) error
	GetExploreTime(ctx context.Context, datasourceId string) (int64, error)
	GetStatus(ctx context.Context, formViewId, datasourceId string) ([]*model.ExploreTask, error)
	CheckTaskRepeat(ctx context.Context, formViewId, datasourceId string, exploreType int32) (*model.ExploreTask, error)
	GetConfigByFormViewId(ctx context.Context, formViewId string) (*model.ExploreTask, error)
	GetConfigByDatasourceId(ctx context.Context, datasourceId string) (*model.ExploreTask, error)
	GetConfigsByDatasourceId(ctx context.Context, datasourceId string) ([]*model.ExploreTask, error)
	GetList(ctx context.Context, req *domain.ListExploreTaskReq, userId string) (total int64, tasks []*domain.TaskInfo, err error)
	GetDetail(ctx context.Context, taskId string) (exploreTask *domain.TaskInfo, err error)

	GetListByWorkOrderIDs(ctx context.Context, workOrderIDs []string) ([]*model.ExploreTask, error)
}
