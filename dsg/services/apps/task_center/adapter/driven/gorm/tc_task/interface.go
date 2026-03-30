package tc_task

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/task_center/common/constant"
	relationData "github.com/kweaver-ai/dsg/services/apps/task_center/domain/relation_data"
	domain "github.com/kweaver-ai/dsg/services/apps/task_center/domain/tc_task"
	"github.com/kweaver-ai/dsg/services/apps/task_center/infrastructure/repository/db/model"
)

type Repo interface {
	InsertExecutable(ctx context.Context, task *model.TcTask, nodeInfo *model.TcFlowInfo, data []string, h relationData.UpsertRelation) error
	InsertWithRelation(ctx context.Context, task *model.TcTask, data []string, h relationData.UpsertRelation) error
	Insert(ctx context.Context, task *model.TcTask) error
	CheckRepeat(ctx context.Context, pid, id, name string) (bool, error)
	ExistProject(ctx context.Context, pid string) error
	GetProject(ctx context.Context, pid string) (project *model.TcProject, err error)
	GetTaskByTaskId(ctx context.Context, pid, tid string) (task *model.TcTask, err error)
	GetTaskByDomain(ctx context.Context, domainId string, businessModelId string) (tasks []*model.TcTask, err error)
	GetTask(ctx context.Context, tid string) (detail *model.TaskDetail, err error)
	GetTaskBriefById(ctx context.Context, tid string) (brief *model.TcTask, err error)
	GetTaskBriefByModelId(ctx context.Context, tid string) (brief *model.TcTask, err error)
	GetTaskBriefByIds(ctx context.Context, tids ...string) (briefs []*model.TcTask, err error)
	GetProjectModelTaskCount(ctx context.Context, pid string) (int64, int64, error)
	GetProjectModelTaskStatus(ctx context.Context, pid string) (briefs []*model.TcTask, err error)
	GetTaskBriefByIdSlice(ctx context.Context, fields string, tids ...string) (briefs []*model.TcTask, err error)
	GetTaskInfoById(ctx context.Context, tid string) (*model.TaskInfo, error)
	UpdateTask(ctx context.Context, task *model.TcTask) ([]string, error)
	UpdateTaskWithRelation(ctx context.Context, task *model.TcTask, data []string, h relationData.UpsertRelation) error
	GetAllTaskExecutors(ctx context.Context, uid string) (userIds []string, err error)
	GetProjectTaskExecutors(ctx context.Context, pid string) (userIds []string, err error)
	GetSupportUserIdsFromProjectByRoleId(ctx context.Context, roleId, projectId string) (members []*model.TcMember, err error)
	GetTaskByNodeId(ctx context.Context, nodeId, projectId string) (tasks []*model.TcTask, err error)
	GetProjectSupportUserIds(ctx context.Context, pid string) (roleIds []string, err error)
	GetTasks(ctx context.Context, query domain.TaskQueryParam, createdBy string) ([]*model.TaskInfo, int64, error)
	GetInvalidTasks(ctx context.Context, projectId string) (list []*model.TcTask, err error)
	GetSpecifyTypeTasks(ctx context.Context, projectId string, taskType int32) (list []*model.TcTask, err error)
	Count(ctx context.Context, userId, taskType string) (info *model.CountInfo, err error)
	// CountByWorkOrderID 返回属于指定工单的任务数量
	CountByWorkOrderID(ctx context.Context, workOrderID string) (int, error)
	// CountByWorkOrderID 返回属于指定工单，处于指定状态的任务数量
	CountByWorkOrderIDAndStatus(ctx context.Context, workOrderID string, status constant.CommonStatus) (int, error)
	GetNodeInfo(ctx context.Context, fid, flowVersion string) ([]*model.TcFlowInfo, int64, error)
	GetStatusInfo(ctx context.Context, pid string) ([]*model.TcTask, error)
	Delete(ctx context.Context, task *model.TcTask) error
	DeleteExecutorsByRoleIdUserId(ctx context.Context, roleId string, userId string, ids []string) error
	DeleteTaskMainBusiness(ctx context.Context, taskIds ...string) error
	DeleteTaskBusinessDomain(ctx context.Context, taskIds ...string) error
	DiscardTaskBecauseOfFormInvalid(ctx context.Context, taskIds ...string) error
	GetHasMemberRoleProject(ctx context.Context, roleId string, userId string) (projects []*model.TcProject, err error)
	GetProjectsByFlowInfo(ctx context.Context, flowId string, flowVersion string) (projects []*model.TcProject, err error)
	QueryStandardSubTaskStatus(ctx context.Context, taskId string, statuses []int8) (int, error)
	UpdateMultiTasks(ctx context.Context, tasks ...*model.TcTask) error
	UpdateFollowExecutable(ctx context.Context, task *model.TcTask, executorID string, txFunc func() error) ([]string, error)
	StartProjectExecutable(ctx context.Context, project *model.TcProject) error
	GetSupportUserIdsFromProjectByRoleIds(ctx context.Context, roleIds []string, projectId string) (members []*model.TcMember, err error)
	GetSupportUserIdsFromProjectById(ctx context.Context, projectId string) (members []*model.TcMember, err error)
	GetTaskByWorkOrderId(ctx context.Context, wid string) (tasks []*model.TcTask, err error)
	GetComprehensionTemplateRelation(ctx context.Context, req *domain.GetComprehensionTemplateRelationReq) (tasks []*model.TcTask, err error)
	GetLatestComprehensionTask(ctx context.Context, catalogId string) (task *model.TcTask, err error)
}
