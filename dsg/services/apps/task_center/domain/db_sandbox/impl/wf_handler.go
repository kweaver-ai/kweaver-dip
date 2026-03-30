package impl

import (
	"context"
	"encoding/json"

	"github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/workflow"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/constant"
	domain "github.com/kweaver-ai/dsg/services/apps/task_center/domain/db_sandbox"
	wf_go "github.com/kweaver-ai/idrm-go-common/workflow"
	wf_common "github.com/kweaver-ai/idrm-go-common/workflow/common"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/samber/lo"
	"go.uber.org/zap"
)

func (u *useCase) RegisterWorkflowHandler() {
	u.wf.RegistConusmeHandlers(workflow.AF_TASKS_DB_SANDBOX_APPLY,
		wf_go.HandlerFunc[wf_common.AuditProcessMsg](workflow.AF_TASKS_DB_SANDBOX_APPLY, u.handleAuditProcess),
		wf_go.HandlerFunc[wf_common.AuditResultMsg](workflow.AF_TASKS_DB_SANDBOX_APPLY, u.handleAuditResult),
		wf_go.HandlerFunc[wf_common.AuditProcDefDelMsg](workflow.AF_TASKS_DB_SANDBOX_APPLY, u.handleAuditDefDel),
	)
}

// handleAuditProcess 处理审核过程消息
func (u *useCase) handleAuditProcess(ctx context.Context, auditType string, msg *wf_common.AuditProcessMsg) error {
	defer func() {
		if err := recover(); err != nil {
			log.WithContext(ctx).Error("[mq] AuditProcessMsgProc ", zap.Any("err", err))
		}
	}()
	//不需要处理这种消息
	if msg.CurrentActivity == nil {
		return nil
	}
	dbSandboxApplyID := msg.ProcessInputModel.Fields.ApplyID

	log.Infof("handleAuditProcess applyID:%v", dbSandboxApplyID)

	alterInfo := map[string]interface{}{
		"audit_advice": "",
		"updated_at":   wf_common.Now(),
	}
	if !msg.ProcessInputModel.Fields.AuditIdea {
		alterInfo["audit_state"] = constant.AuditStatusReject.Integer.Int32()
		alterInfo["audit_advice"] = wf_common.GetAuditMsg(&msg.ProcessInputModel.WFCurComment, &msg.ProcessInputModel.Fields.AuditMsg)
	}
	//更新状态
	if err := u.repo.AuditResultUpdate(ctx, dbSandboxApplyID, alterInfo); err != nil {
		log.WithContext(ctx).Errorf("failed to update audit result flow_type: %v  alterInfo: %+v, err: %v", msg.ProcessDef.Category, alterInfo, err)
	}
	return nil
}

// handleAuditResult 处理审核结果消息
func (u *useCase) handleAuditResult(ctx context.Context, auditType string, msg *wf_common.AuditResultMsg) error {
	log.Warnf("handleAuditResult:%v", string(lo.T2(json.Marshal(msg)).A))
	dbSandboxApplyID := msg.ApplyID

	log.Infof("handleAuditResult applyID:%v", dbSandboxApplyID)
	alterInfo := map[string]interface{}{"updated_at": wf_common.Now()}
	switch msg.Result {
	case wf_common.AUDIT_RESULT_PASS:
		alterInfo["audit_state"] = constant.AuditStatusPass.Integer.Int32()
		alterInfo["status"] = constant.SandboxStatusWaiting.Integer.Int32()
	case wf_common.AUDIT_RESULT_REJECT:
		alterInfo["audit_state"] = constant.AuditStatusReject.Integer.Int32()
		alterInfo["status"] = constant.SandboxStatusReject.Integer.Int32()
	case wf_common.AUDIT_RESULT_UNDONE:
		alterInfo["audit_state"] = constant.AuditStatusUndone.Integer.Int32()
		alterInfo["status"] = constant.SandboxStatusUndone.Integer.Int32()
	default:
		log.WithContext(ctx).Warnf("unknown audit result type: %s, ignore it", msg.Result)
		return nil
	}
	if err := u.repo.AuditResultUpdate(ctx, dbSandboxApplyID, alterInfo); err != nil {
		log.WithContext(ctx).Warnf("AuditResultUpdate sandbox apply model %v result %v", dbSandboxApplyID, err)
		return err
	}
	if msg.Result != wf_common.AUDIT_RESULT_PASS {
		return nil
	}
	//审核通过，执行下一步动作，流转下去
	sandboxApply, err := u.repo.GetSandboxApply(ctx, dbSandboxApplyID)
	if err != nil {
		log.WithContext(ctx).Errorf("query sandbox apply %v error %v", dbSandboxApplyID, err)
		return err
	}
	detail := &domain.DBSandboxTotalDetail{
		ApplyObj: sandboxApply,
	}
	//改为待实施
	detail.ApplyObj.Status = constant.SandboxStatusWaiting.Integer.Int32()
	if err = u.operation.RunWithoutWorkflow(ctx, detail); err != nil {
		return err
	}
	if err = u.repo.FlowUpdateApply(ctx, detail.ApplyObj); err != nil {
		log.WithContext(ctx).Errorf("update: %v err: %v", dbSandboxApplyID, err.Error())
	}
	return err
}

// handleAuditDefDel 处理审核流程删除消息
func (u *useCase) handleAuditDefDel(ctx context.Context, auditType string, msg *wf_common.AuditProcDefDelMsg) error {
	defer func() {
		if err := recover(); err != nil {
			log.WithContext(ctx).Error("[mq] HandleAuditDefDel ", zap.Any("err", err))
		}
	}()
	if len(msg.ProcDefKeys) == 0 {
		return nil
	}
	log.WithContext(ctx).Infof("recv audit type: %s proc_def_keys: %v delete msg, proc related unfinished audit process",
		auditType, msg.ProcDefKeys)
	if _, err := u.repo.UpdateAuditStateWhileDelProc(ctx, msg.ProcDefKeys); err != nil {
		log.WithContext(ctx).Errorf("failed to update audit type: %s proc_def_keys: %v related unfinished audit process to reject status, err: %v",
			auditType, msg.ProcDefKeys, err)
	}
	return nil
}
