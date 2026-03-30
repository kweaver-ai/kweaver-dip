package flowchart_version

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/repository/db/model"
)

type Repo interface {
	Get(ctx context.Context, vId string) (*model.FlowchartVersion, error)
	GetUnscoped(ctx context.Context, id string) (*model.FlowchartVersion, error)
	GetByIds(ctx context.Context, ids ...string) ([]*model.FlowchartVersion, error)
	ListByIds(ctx context.Context, ids ...string) ([]*model.FlowchartVersion, error)
	SaveContent(ctx context.Context, fcV *model.FlowchartVersion, units []*model.FlowchartUnit, nodeCfgs []*model.FlowchartNodeConfig, nodeTasks []*model.FlowchartNodeTask, hasImage bool) (bool, error)
	GetMaxVersionNum(ctx context.Context, fid string) (int32, error) // 获取最大的版本num，包括已删除的
	UpdateDrawPropertiesAndImage(ctx context.Context, fcV *model.FlowchartVersion, hasImage bool) (bool, error)
	GetAll(ctx context.Context) ([]*model.FlowchartVersion, error)
	UpdateDrawProperties(ctx context.Context, fcV *model.FlowchartVersion) error
}
