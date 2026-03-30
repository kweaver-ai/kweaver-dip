package impl

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/common"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/gorm/flowchart_node_task"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/repository/db/model"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/repository/db/model/query"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"go.uber.org/zap"
	"gorm.io/gorm"
)

type flowchartNodeTask struct {
	q *query.Query
}

func NewFlowchartNodeTask(q *query.Query) flowchart_node_task.Repo {
	return &flowchartNodeTask{q: q}
}
func NewFlowchartNodeTaskNative(DB *gorm.DB) flowchart_node_task.Repo {
	return &flowchartNodeTask{q: common.GetQuery(DB)}
}

func (f *flowchartNodeTask) List(ctx context.Context, vid string) ([]*model.FlowchartNodeTask, error) {
	return f.list(ctx, vid, false)
}

func (f *flowchartNodeTask) ListUnscoped(ctx context.Context, vid string) ([]*model.FlowchartNodeTask, error) {
	return f.list(ctx, vid, true)
}

func (f *flowchartNodeTask) list(ctx context.Context, vid string, unscoped bool) ([]*model.FlowchartNodeTask, error) {
	do := f.q.FlowchartNodeTask
	_do := do.WithContext(ctx)

	if unscoped {
		_do = _do.Unscoped()
	}

	models, err := _do.Where(do.FlowchartVersionID.Eq(vid)).Find()
	if err != nil {
		log.WithContext(ctx).Errorf("failed to get flowchart node tasks from db, flowchart vid: %v, err: %v", vid, err)
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}

	return models, err
}

func (f *flowchartNodeTask) ListALL(ctx context.Context) ([]*model.FlowchartNodeTask, error) {
	return f.listALL(ctx, false)
}

func (f *flowchartNodeTask) ListALLUnscoped(ctx context.Context) ([]*model.FlowchartNodeTask, error) {
	return f.listALL(ctx, true)
}
func (f *flowchartNodeTask) listALL(ctx context.Context, unscoped bool) ([]*model.FlowchartNodeTask, error) {
	do := f.q.FlowchartNodeTask
	_do := do.WithContext(ctx)

	if unscoped {
		_do = _do.Unscoped()
	}

	models, err := _do.Find()
	if err != nil {
		log.WithContext(ctx).Errorf("failed to get flowchart node tasks from db, flowchart, err: %v", err)
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}

	return models, err
}
func (f *flowchartNodeTask) UpdateTaskType(ctx context.Context, m *model.FlowchartNodeTask) error {
	if m == nil {
		log.Warn("model is nil in update FlowchartNodeTask")
		return nil
	}

	fcDo := f.q.FlowchartNodeTask
	_, err := fcDo.WithContext(ctx).Where(fcDo.ID.Eq(m.ID)).Select(fcDo.TaskType).Updates(m)
	if err != nil {
		log.WithContext(ctx).Error("failed to update FlowchartNodeTask to db", zap.String("flowchart id", m.ID), zap.Int32("flowchart TaskType", m.TaskType), zap.Error(err))
		return errorcode.Detail(errorcode.PublicDatabaseError, err)
	}

	return nil
}
