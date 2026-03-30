package tc_project

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/task_center/common/models/response"
	"github.com/kweaver-ai/dsg/services/apps/task_center/infrastructure/repository/db/model"
)

type UserCase interface {
	Create(ctx context.Context, projectReq *ProjectReqModel) error
	Update(ctx context.Context, projectReq *ProjectEditModel) error
	GetDetail(ctx context.Context, id string) (*ProjectDetailModel, error)
	GetThirdProjectDetail(ctx context.Context, thirdId string) (*ProjectDetailModel, error)
	CheckRepeat(ctx context.Context, req ProjectNameRepeatReq) error
	GetProjectCandidate(ctx context.Context, reqData *FlowIdModel) (*ProjectCandidates, error)
	GetProjectCandidateByTaskType(ctx context.Context, reqData *ProjectID) ([]TaskTypeGroup, error)
	QueryProjects(ctx context.Context, params *ProjectCardQueryReq) (response.PageResult, error)
	CheckStatus(ctx context.Context, newProject *model.TcProject, old *model.TcProject) error
	GetFlowView(ctx context.Context, pid string) (*FlowchartView, error)
	CheckImageExistence(ctx context.Context, id string) error
	DeleteMemberByUsedRoleUserProject(ctx context.Context, roleId string, userId string) error
	DeleteProject(ctx context.Context, projectId string) (string, error)
	QueryDomainCreatedByProject(ctx context.Context, projectId string) (*ProjectDomainInfo, error)
	GetProjectWorkitems(ctx context.Context, query *WorkitemsQueryParam) (*WorkitemsQueryResp, error)
}
