package flowchart

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/constant"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/models/request"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/repository/db/model"
)

type Repo interface {
	ListByPaging(ctx context.Context, pageInfo *request.PageInfo, keyword string, includeStatus ...constant.FlowchartEditStatus) ([]*model.Flowchart, int64, error)
	ListByPagingNew(ctx context.Context, pageInfo *request.PageInfo, keyword string, all bool, includeStatus []int32) ([]*model.Flowchart, int64, error)
	Get(ctx context.Context, fid string, includeStatus ...constant.FlowchartEditStatus) (*model.Flowchart, error)
	GetUnscoped(ctx context.Context, fid string, includeStatus ...constant.FlowchartEditStatus) (*model.Flowchart, error)
	Delete(ctx context.Context, fid string) error
	ExistByName(ctx context.Context, name string, excludeIDs ...string) (bool, error)
	Create(ctx context.Context, fc *model.Flowchart, clonedFcV *model.FlowchartVersion, uid string) error
	UpdateNameAndDesc(ctx context.Context, m *model.Flowchart) error
	Count(ctx context.Context, status ...constant.FlowchartEditStatus) (int64, error)
	// PreEdit(ctx context.Context, fc *model.Flowchart, fcV *model.FlowchartVersion) (*model.FlowchartVersion, bool, error)
	//MarkFlowchartByRoleId(ctx context.Context, rid string, status int) error // 标记下QueryFlowchartByRoleId 查询到的运营流程
}
