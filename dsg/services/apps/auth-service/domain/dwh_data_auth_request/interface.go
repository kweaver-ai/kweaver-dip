package dwh_data_auth_request

import (
	"context"
	"github.com/kweaver-ai/dsg/services/apps/auth-service/common/dto"
	workflow_common "github.com/kweaver-ai/idrm-go-common/workflow/common"
)

type UseCase interface {
	Manager
	AuditUseCase
	ConsumeAuditHandler
}
type Manager interface {
	Create(ctx context.Context, req *dto.DataAuthRequestArg) (string, error)
	Update(ctx context.Context, req *dto.DataAuthRequestArg) (string, error)
	Delete(ctx context.Context, id string) error
	Get(ctx context.Context, id string) (*dto.DataAuthFormDetail, error)
	List(ctx context.Context, args *dto.DataAuthRequestListArgs) (*dto.PageResult[dto.DataAuthFormListItem], error)
	ListUserData(ctx context.Context, args *dto.UserDataAuthRequestListArgs) ([]*dto.UserDataAuthFormListItem, error)
	TestAuditMsg(ctx context.Context, args *dto.TestAuditMsgReq) error
}

type AuditUseCase interface {
	AuditList(ctx context.Context, req *dto.AuditListReq) (*dto.PageResult[dto.DataAuthReqFormAuditListItem], error)
	Cancel(ctx context.Context, id string) (err error)
}

type ConsumeAuditHandler interface {
	ConsumerWorkflowAuditMsg(ctx context.Context, msg *workflow_common.AuditProcessMsg) error
	ConsumerWorkflowAuditResultRequest(ctx context.Context, msg *workflow_common.AuditResultMsg) error
	ConsumerWorkflowAuditProcDeleteRequest(ctx context.Context, msg *workflow_common.AuditProcDefDelMsg) error
}
