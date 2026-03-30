package front_end_processor

import (
	"context"
	"fmt"

	"github.com/google/uuid"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driver/middleware"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/constant"
	configuration_center_v1 "github.com/kweaver-ai/idrm-go-common/api/configuration-center/v1"
	meta_v1 "github.com/kweaver-ai/idrm-go-common/api/meta/v1"
	"github.com/kweaver-ai/idrm-go-common/workflow"
	"github.com/kweaver-ai/idrm-go-common/workflow/common"
)

func (uc *useCase) RegisterConsumeHandlers(wf workflow.WorkflowInterface) {
	wf.RegistConusmeHandlers(
		constant.FrontEndProcessorRequest,
		nil,
		uc.consumeAuditResultMsg,
		uc.consumeAuditProcDefDelMsg,
	)
}

func (uc *useCase) consumeAuditResultMsg(ctx context.Context, msg *common.AuditResultMsg) error {
	p, err := uc.frontEndProcessor.GetByApplyID(ctx, msg.ApplyID)
	if err != nil {
		// TODO: 区分 apply id 不存在
		return err
	}
	// TODO: 检查 Request 的状态是否可以执行 pass、reject、undone 的动作
	switch msg.Result {
	case "pass":
		p.Status.Phase = configuration_center_v1.FrontEndProcessorAllocating
		p.UpdateTimestamp = meta_v1.Now().Format("2006-01-02 15:04:05.000")
	case "reject", "undone":
		p.Status.Phase = configuration_center_v1.FrontEndProcessorPending
		p.UpdateTimestamp = meta_v1.Now().Format("2006-01-02 15:04:05.000")
	default:
		return fmt.Errorf("unsupported result: %v", msg.Result)
	}
	return uc.frontEndProcessor.Update(ctx, p)
}

func (uc *useCase) consumeAuditProcDefDelMsg(ctx context.Context, msg *common.AuditProcDefDelMsg) error {
	return uc.frontEndProcessor.ResetPhase(ctx)
}

// 更新 FrontEndProcessor 并发起 workflow 审核。如果不存在对应的审核流程绑定则不
// 需要审核直接通过。
func (uc *useCase) auditApply(ctx context.Context, p *configuration_center_v1.FrontEndProcessor) error {
	// 申请者
	requester := middleware.UserFromContextOrEmpty(ctx)
	// 更新前置机
	p.RequesterID = requester.ID
	p.RequestTimestamp = meta_v1.Now().Format("2006-01-02 15:04:05.000")
	p.Status.Phase = configuration_center_v1.FrontEndProcessorAuditing

	// 获取审核流程绑定
	bind, err := uc.auditProcessBind.GetByAuditType(ctx, constant.FrontEndProcessorRequest)
	if err != nil {
		return err
	}
	// 缺少审核流程绑定，则认为不需要审核直接通过
	if bind.ID == 0 {
		p.Status.Phase = configuration_center_v1.FrontEndProcessorAllocating
		return nil
	}

	// 生成 Workflow 审核需要的 Apply ID
	p.Status.ApplyID = uuid.Must(uuid.NewV7()).String()

	// 生成审核消息
	msg := &common.AuditApplyMsg{
		Process: common.AuditApplyProcessInfo{
			AuditType:  constant.FrontEndProcessorRequest,
			ApplyID:    p.Status.ApplyID,
			UserID:     requester.ID,
			UserName:   requester.Name,
			ProcDefKey: bind.ProcDefKey,
		},
		Data: map[string]any{
			WorkflowApplyMsgDataKeyOrderID:          p.OrderID,
			WorkflowApplyMsgDataKeyRequestTimestamp: p.RequestTimestamp,
			WorkflowApplyMsgDataKeyApplyType:        p.Request.ApplyType,
			WorkflowApplyMsgDataKeyApplyID:          p.ID,
		},
		Workflow: common.AuditApplyWorkflowInfo{
			TopCsf: 5,
			AbstractInfo: common.AuditApplyAbstractInfo{
				Text: "前置机申请 " + p.OrderID,
			},
		},
	}
	// 发送审核消息
	return uc.workflow.AuditApply(msg)
}

const (
	WorkflowApplyMsgDataKeyOrderID          = "order_id"
	WorkflowApplyMsgDataKeyRequestTimestamp = "request_timestamp"
	WorkflowApplyMsgDataKeyApplyType        = "apply_type"
	WorkflowApplyMsgDataKeyApplyID          = "id"
)
