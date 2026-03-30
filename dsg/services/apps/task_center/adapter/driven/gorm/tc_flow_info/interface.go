package tc_flow_info

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/task_center/infrastructure/repository/db/model"
)

type Repo interface {
	GetById(ctx context.Context, fid, flowVersion, nid string) (flowInfo *model.TcFlowInfo, err error)
	GetByIds(ctx context.Context, fId, flowVersion string, nids []string) (flowInfos []*model.TcFlowInfo, err error)
	GetByNodeId(ctx context.Context, fid, flowVersion, nid string) (flowInfos *model.TcFlowInfo, err error)
	GetNodes(ctx context.Context, fid, flowVersion string) (flowInfos []*model.TcFlowInfo, err error)
	GetByRoleId(ctx context.Context, rid string) (flowInfos []*model.TcFlowInfo, err error)
	GetFollowNodes(ctx context.Context, nid string) (flowInfos []*model.TcFlowInfo, err error)
}
