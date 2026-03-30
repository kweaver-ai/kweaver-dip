package custom

import (
	"github.com/kweaver-ai/dsg/services/apps/auth-service/adapter/driven/gorm"
	"github.com/kweaver-ai/dsg/services/apps/auth-service/common/constant"
	"github.com/kweaver-ai/dsg/services/apps/auth-service/domain/dwh_data_auth_request"
	"github.com/kweaver-ai/idrm-go-common/workflow"
)

type WFConsumerRegister struct {
	wf                        workflow.WorkflowInterface
	authRequestRepo           gorm.ConsumeAuthRequestRepo
	dwhDataApplicationUseCase dwh_data_auth_request.UseCase
}

func NewWFConsumerRegister(
	wf workflow.WorkflowInterface,
	authRequestRepo gorm.ConsumeAuthRequestRepo,
	dwhDataApplicationUseCase dwh_data_auth_request.UseCase,
) (*WFConsumerRegister, error) {
	r := &WFConsumerRegister{
		wf:                        wf,
		authRequestRepo:           authRequestRepo,
		dwhDataApplicationUseCase: dwhDataApplicationUseCase,
	}
	err := r.registerConsumeHandlers()
	if err != nil {
		return nil, err
	}
	return r, nil
}

func (r *WFConsumerRegister) registerConsumeHandlers() error {
	// 数据权限申请结果消费
	r.wf.RegistConusmeHandlers(
		constant.DataPermissionRequest,
		r.authRequestRepo.ConsumerWorkflowAuditMsg,
		r.authRequestRepo.ConsumerWorkflowAuditResultRequest,
		r.authRequestRepo.ConsumerWorkflowAuditProcDeleteRequest,
	)
	r.wf.RegistConusmeHandlers(
		constant.DWHDataAuthRequestForm,
		r.dwhDataApplicationUseCase.ConsumerWorkflowAuditMsg,
		r.dwhDataApplicationUseCase.ConsumerWorkflowAuditResultRequest,
		r.dwhDataApplicationUseCase.ConsumerWorkflowAuditProcDeleteRequest,
	)
	return r.wf.Start()
}
