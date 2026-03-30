package flowchart_node_task

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/repository/db/model"
)

type Repo interface {
	List(ctx context.Context, vid string) ([]*model.FlowchartNodeTask, error)
	ListUnscoped(ctx context.Context, vid string) ([]*model.FlowchartNodeTask, error)
	ListALL(ctx context.Context) ([]*model.FlowchartNodeTask, error)
	ListALLUnscoped(ctx context.Context) ([]*model.FlowchartNodeTask, error)
	UpdateTaskType(ctx context.Context, m *model.FlowchartNodeTask) error
}
