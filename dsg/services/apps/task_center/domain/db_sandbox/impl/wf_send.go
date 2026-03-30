package impl

import (
	"context"
	"time"

	"github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/workflow"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/constant"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/user_util"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/util"
	domain "github.com/kweaver-ai/dsg/services/apps/task_center/domain/db_sandbox"
	"github.com/kweaver-ai/idrm-go-common/rest/configuration_center"
	wf_common "github.com/kweaver-ai/idrm-go-common/workflow/common"
	"github.com/kweaver-ai/idrm-go-frame/core/enum"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/trace"
)

// SendAuditMsg 发送审核消息
func (u *useCase) SendAuditMsg(ctx context.Context, detail *domain.DBSandboxTotalDetail) (isAuditProcessExist bool, err error) {
	ctx, _ = trace.StartInternalSpan(ctx)
	defer trace.EndSpan(ctx, err)

	//检查是否有绑定的审核流程
	process, err := u.ccDriven.GetProcessBindByAuditType(ctx,
		&configuration_center.GetProcessBindByAuditTypeReq{AuditType: workflow.AF_TASKS_DB_SANDBOX_APPLY})
	if err != nil {
		log.WithContext(ctx).Errorf("failed to check audit process info (type: %s), err: %v", workflow.AF_TASKS_DB_SANDBOX_APPLY, err)
		return false, nil
	}
	isAuditProcessExist = util.CE(process.ProcDefKey != "", true, false).(bool)
	if !isAuditProcessExist {
		return isAuditProcessExist, nil
	}

	uInfo, _ := user_util.ObtainUserInfo(ctx)
	msg := &wf_common.AuditApplyMsg{
		Process: wf_common.AuditApplyProcessInfo{
			ApplyID:    detail.ApplyObj.ID,
			AuditType:  process.AuditType,
			UserID:     uInfo.ID,
			UserName:   uInfo.Name,
			ProcDefKey: process.ProcDefKey,
		},

		Data: map[string]any{
			"id":              detail.ApplyObj.ID,
			"sandbox_id":      detail.ApplyObj.SandboxID,
			"operation":       enum.ToString[constant.SandboxOperation](detail.ApplyObj.Operation),
			"audit_time":      time.Now().Unix(),
			"project_id":      detail.SandboxObj.ProjectID,
			"project_name":    detail.SandboxProjectName,
			"department_id":   detail.SandboxObj.DepartmentID,
			"department_name": detail.SandboxDepartmentName,
			"applicant_phone": detail.ApplyObj.ApplicantPhone,
			"apply_time":      detail.ApplyObj.ApplyTime,
			"request_space":   detail.ApplyObj.RequestSpace,
			"reason":          detail.ApplyObj.Reason,
			"valid_start":     detail.SandboxObj.ValidStart,
			"valid_end":       detail.SandboxObj.ValidEnd,
		},
		Workflow: wf_common.AuditApplyWorkflowInfo{
			TopCsf: 5,
			AbstractInfo: wf_common.AuditApplyAbstractInfo{
				Icon: constant.AUDIT_ICON_BASE64,
				Text: detail.SandboxProjectName + "-沙箱空间审核",
			},
		},
	}
	detail.ApplyObj.AuditID = msg.Process.ApplyID
	detail.ApplyObj.ProcDefKey = process.ProcDefKey
	if err = u.wf.AuditApply(msg); err != nil {
		return isAuditProcessExist, errorcode.SendAuditApplyMsgError.Detail(err.Error())
	}
	return isAuditProcessExist, nil
}

// CancelAuditMsg 撤回审核
func (u *useCase) CancelAuditMsg(ctx context.Context, applyID string) (err error) {
	ctx, _ = trace.StartInternalSpan(ctx)
	defer trace.EndSpan(ctx, err)

	msg := wf_common.GenNormalCancelMsg(applyID)
	if err = u.wf.AuditCancel(msg); err != nil {
		return errorcode.SendAuditApplyMsgError.Detail(err.Error())
	}
	return nil
}
