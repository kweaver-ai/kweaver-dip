package tc_project

import (
	"context"

	"gorm.io/gorm"

	"github.com/kweaver-ai/dsg/services/apps/task_center/domain/tc_project"
	"github.com/kweaver-ai/dsg/services/apps/task_center/infrastructure/repository/db/model"
)

type Repo interface {
	Insert(context.Context, *model.TcProject, []*model.TcMember, []*model.TcFlowInfo, *model.TcFlowView) error
	Update(context.Context, *model.TcProject, []*model.TcMember) error
	CheckRepeat(ctx context.Context, id string, name string) (bool, error)
	Get(ctx context.Context, id string) (pro *model.TcProject, err error)
	GetThirdProjectDetail(ctx context.Context, thirdId string) (pro *model.TcProject, err error)
	GetProjectNotCompletedByFlow(ctx context.Context, fid, fVersion string) (projects []*model.TcProject, err error)
	TaskRoles(ctx context.Context, id, version string) (roles []string, err error)
	CheckTaskRoles(ctx context.Context, flowId, flowVersion string) (exists bool, err error)
	QueryProjects(ctx context.Context, params *tc_project.ProjectCardQueryReq) ([]model.TcProject, int64, error)
	GetAllTasks(ctx context.Context, id string) ([]*model.TcTask, error)
	GetFlowView(ctx context.Context, fid, fVersion string) (*model.TcFlowView, error)
	DeleteProject(ctx context.Context, id string, txFunc func() error) ([]string, error)
	UpdateProjectBecauseDeleteUser(ctx context.Context, pro *model.TcProject, member *model.TcMember) error
	QueryUserProjects(ctx context.Context, userId, roleId string, status int8) (ps []*model.TcProject, err error)

	IsNodeCompleted(ctx context.Context, tx *gorm.DB, projectId, nodeId string) (bool, error)
	// NodeExecutableExecutable 判断当前节点是否可开启,获取当前节点状态
	NodeExecutable(ctx context.Context, tx *gorm.DB, projectId string, nodeInfo *model.TcFlowInfo) (int8, error)
	UpdateFollowExecutable(ctx context.Context, tx *gorm.DB, projectId, flowId, flowVersion, nodeId string) (tasks []*model.TcTask, err error)
	UpdateFollowExecutableV2(ctx context.Context, projectId, flowId, flowVersion, nodeId string) (tasks []*model.TcTask, err error)
	UpdateCurrentExecutable(ctx context.Context, tx *gorm.DB, projectId string, nodeInfo *model.TcFlowInfo) (tasks []*model.TcTask, err error)
	StartProjectExecutable(ctx context.Context, tx *gorm.DB, projectId, projectFlowId, projectFlowVersionId string) error
	GetProjectWorkitems(ctx context.Context, query *tc_project.WorkitemsQueryParam) ([]*model.ProjectWorkitems, int64, error)

	// 注册节点开启时的回调
	RegisterCallbackOnNodeStart(name string, callback CallbackOnNodeStart) error
}

// 节点开启时的回调，可能被多次调用，回调函数需要保证多次调用的结果一致。
type CallbackOnNodeStart func(ctx context.Context, tx *gorm.DB, projectID, nodeID string) error
