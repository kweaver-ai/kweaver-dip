package tc_task

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/task_center/infrastructure/repository/db/model"
)

type UserCase interface {
	Create(ctx context.Context, taskReq *TaskCreateReqModel) error
	UpdateTask(ctx context.Context, taskReq *TaskUpdateReqModel) ([]string, error)
	GetProject(ctx context.Context, pid string) (*model.TcProject, error)
	GetTask(ctx context.Context, pid, id string) (*model.TcTask, error)
	GetDetail(ctx context.Context, id string) (*TaskDetailModel, error)
	GetBriefTaskByModelID(ctx context.Context, id string) (*TaskBriefModel, error)
	ListTasks(ctx context.Context, query TaskQueryParam) (*QueryPageReapParam, error)
	GetNodes(ctx context.Context, pid string) ([]*NodeInfo, int64, error)
	GetRateInfo(ctx context.Context, pid string) ([]*RateInfo, error)
	GetTaskMember(ctx context.Context, taskReq TaskPathTaskType) ([]*model.User, error)
	GetTaskExecutors(ctx context.Context, taskReq TaskUserId) ([]*model.User, error)
	GetProjectTaskExecutors(ctx context.Context, taskReq TaskPathProjectId) ([]*model.User, error)
	DeleteTask(ctx context.Context, req BriefTaskPathModel) (string, error)
	GetTaskInfo(ctx context.Context, id string) (*TaskInfo, error)
	GetTaskBriefInfo(ctx context.Context, reqData *BriefTaskQueryModel) ([]map[string]any, error)
	HandleDeletedBusinessFormMessage(ctx context.Context, businessModelId string, formId string) error
	HandleModifyBusinessDomainMessage(ctx context.Context, subjectDomainId string, businessModelId string) error
	HandleDeleteBusinessDomainMessage(ctx context.Context, executorID string, subjectDomainId string) error
	HandleDeleteMainBusinessMessage(ctx context.Context, executorID string, businessModelId string) error
	GetComprehensionTemplateRelation(ctx context.Context, req *GetComprehensionTemplateRelationReq) (*GetComprehensionTemplateRelationRes, error)
}
