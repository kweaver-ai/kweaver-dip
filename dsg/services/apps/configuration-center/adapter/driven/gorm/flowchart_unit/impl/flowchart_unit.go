package impl

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/gorm/flowchart_unit"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/repository/db/model"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/repository/db/model/query"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
)

type flowchartUnit struct {
	q *query.Query
}

func NewFlowchartUnit(q *query.Query) flowchart_unit.Repo {
	return &flowchartUnit{q: q}
}

func (f *flowchartUnit) List(ctx context.Context, vid string) ([]*model.FlowchartUnit, error) {
	return f.list(ctx, vid, false)
}

func (f *flowchartUnit) ListUnscoped(ctx context.Context, vid string) ([]*model.FlowchartUnit, error) {
	return f.list(ctx, vid, true)
}

func (f *flowchartUnit) list(ctx context.Context, vid string, unscoped bool) ([]*model.FlowchartUnit, error) {
	do := f.q.FlowchartUnit
	_do := do.WithContext(ctx)

	if unscoped {
		_do = _do.Unscoped()
	}

	models, err := _do.Where(do.FlowchartVersionID.Eq(vid)).Find()
	if err != nil {
		log.WithContext(ctx).Errorf("failed to get flowchart units from db, flowchart vid: %v, err: %v", vid, err)
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}

	return models, err
}
