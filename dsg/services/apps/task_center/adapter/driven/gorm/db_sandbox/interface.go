package db_sandbox

import (
	"context"

	domain "github.com/kweaver-ai/dsg/services/apps/task_center/domain/db_sandbox"
	"github.com/kweaver-ai/dsg/services/apps/task_center/infrastructure/repository/db/model"
)

type Repo interface {
	SandboxApply
	SandboxExecution
	SandboxSpace
	Audit
}

type SandboxApply interface {
	CreateApplyWithSpace(ctx context.Context, apply *model.DBSandboxApply, space *model.DBSandbox) error
	CreateExtend(ctx context.Context, apply *model.DBSandboxApply) error
	GetSandboxApplyRecords(ctx context.Context, id string) ([]*domain.ApplyRecord, error)
	GetSandboxDetail(ctx context.Context, id string) (data *domain.SandboxSpaceDetail, err error)
	GetSandboxApply(ctx context.Context, id string) (data *model.DBSandboxApply, err error)
	UpdateSandboxApplyAudit(ctx context.Context, data *model.DBSandboxApply) (err error)
	GetApplyingCountByProject(ctx context.Context, id string) (count int, err error)
	ListApply(ctx context.Context, req *domain.SandboxApplyListArg) ([]*domain.SandboxApplyListItem, int64, error)
}

type Audit interface {
	AuditResultUpdate(ctx context.Context, applyID string, alterInfo map[string]interface{}) error
	UpdateAuditStateWhileDelProc(ctx context.Context, procDefKeys []string) (bool, error)
	FlowUpdateApply(ctx context.Context, data *model.DBSandboxApply) error
}

type SandboxExecution interface {
	Executing(ctx context.Context, data *model.DBSandboxExecution) error
	Executed(ctx context.Context, data *model.DBSandboxExecution) error
	GetExecution(ctx context.Context, id string) (*model.DBSandboxExecution, error)
	ListExecution(ctx context.Context, req *domain.SandboxExecutionListArg) ([]*domain.SandboxExecutionListItem, int64, error)
	GetExecutionDetail(ctx context.Context, id string) (data *domain.SandboxExecutionDetail, err error)
	GetApplyLogList(ctx context.Context, applyID string) (data []*domain.SandboxExecutionLogListItem, err error)
	InsertExecution(ctx context.Context, executionData *model.DBSandboxExecution, applyData *model.DBSandboxApply) (err error)
}

type SandboxSpace interface {
	AddSandboxSpace(ctx context.Context, spaceID string, space int32) (err error)
	GetSpaceByProjectID(ctx context.Context, projectID string) (*model.DBSandbox, error)
	UpdateSpaceDataSet(ctx context.Context, data *domain.SandboxDataSetInfo) (err error)
	GetSandboxSpace(ctx context.Context, id string) (data *model.DBSandbox, err error)
	SpaceList(ctx context.Context, req *domain.SandboxSpaceListReq) (data []*domain.SandboxSpaceListItem, total int64, err error)
}
