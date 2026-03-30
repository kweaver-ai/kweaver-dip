package flowchart_node_config

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/repository/db/model"
)

type Repo interface {
	List(ctx context.Context, vid string) ([]*model.FlowchartNodeConfig, error)
	ListUnscoped(ctx context.Context, vid string) ([]*model.FlowchartNodeConfig, error)
}
