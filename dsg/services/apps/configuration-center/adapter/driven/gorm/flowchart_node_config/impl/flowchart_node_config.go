package impl

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/gorm/flowchart_node_config"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/repository/db/model"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/repository/db/model/query"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
)

type flowchartNodeConfigRepo struct {
	q *query.Query
}

func NewFlowchartNodeConfigRepo(q *query.Query) flowchart_node_config.Repo {
	return &flowchartNodeConfigRepo{q: q}
}

func (f *flowchartNodeConfigRepo) List(ctx context.Context, vid string) ([]*model.FlowchartNodeConfig, error) {
	return f.list(ctx, vid, false)
}

func (f *flowchartNodeConfigRepo) ListUnscoped(ctx context.Context, vid string) ([]*model.FlowchartNodeConfig, error) {
	return f.list(ctx, vid, true)
}

func (f *flowchartNodeConfigRepo) list(ctx context.Context, vid string, unscoped bool) ([]*model.FlowchartNodeConfig, error) {
	do := f.q.FlowchartNodeConfig
	_do := do.WithContext(ctx)

	if unscoped {
		_do = _do.Unscoped()
	}

	models, err := _do.Where(do.FlowchartVersionID.Eq(vid)).Find()
	if err != nil {
		log.WithContext(ctx).Errorf("failed to get flowchart node configs from db, flowchart vid: %v, err: %v", vid, err)
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}

	return models, err
}
