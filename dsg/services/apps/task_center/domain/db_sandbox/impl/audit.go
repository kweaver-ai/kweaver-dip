package impl

import (
	"context"
	"fmt"
	"strconv"

	"github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/workflow"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/constant"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/models/request"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/models/response"
	domain "github.com/kweaver-ai/dsg/services/apps/task_center/domain/db_sandbox"
	wf_rest "github.com/kweaver-ai/idrm-go-common/rest/workflow"
	wf_common "github.com/kweaver-ai/idrm-go-common/workflow/common"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/trace"
)

func (u *useCase) AuditList(ctx context.Context, req *domain.AuditListReq) (resp *response.PageResultNew[domain.AuditListItem], err error) {
	ctx, span := trace.StartInternalSpan(ctx)
	defer func() { trace.TelemetrySpanEnd(span, err) }()

	auditTypes := []string{workflow.AF_TASKS_DB_SANDBOX_APPLY}
	audits, err := u.wfDriven.GetAuditList(ctx, wf_rest.WorkflowListType(req.Target), auditTypes, *req.Offset, *req.Limit)
	if err != nil {
		log.WithContext(ctx).Errorf("uc.workflow.GetAuditList failed: %v", err)
		return nil, errorcode.PublicInternalError.Detail(err.Error())
	}
	resp = &response.PageResultNew[domain.AuditListItem]{
		TotalCount: audits.TotalCount,
		Entries:    make([]*domain.AuditListItem, 0),
	}
	if len(audits.Entries) <= 0 {
		return resp, nil
	}
	for i := range audits.Entries {
		auditItem := audits.Entries[i]
		customData := auditItem.ApplyDetail.DecodeData()
		operation, _ := strconv.Atoi(fmt.Sprintf("%v", customData["operation"]))
		data := &domain.AuditListItem{
			SandboxID:      fmt.Sprintf("%v", customData["sandbox_id"]),
			ProjectID:      fmt.Sprintf("%v", customData["project_id"]),
			ProjectName:    fmt.Sprintf("%v", customData["project_name"]),
			DepartmentID:   fmt.Sprintf("%v", customData["department_id"]),
			Operation:      fmt.Sprintf("%v", customData["operation"]),
			DepartmentName: fmt.Sprintf("%v", customData["department_name"]),
			ApplicantID:    auditItem.ApplyDetail.Process.UserID,
			ApplicantName:  auditItem.ApplyDetail.Process.UserName,
			ApplicantPhone: fmt.Sprintf("%v", customData["applicant_phone"]),
			ApplyTime:      fmt.Sprintf("%v", customData["apply_time"]),
			RequestSpace:   customData["request_space"],
			Reason:         customData["reason"],
			ValidStart:     customData["valid_start"],
			ValidEnd:       customData["valid_end"],
			AuditCommonInfo: domain.AuditCommonInfo{
				ApplyCode:      auditItem.ApplyDetail.Process.ApplyID,
				AuditType:      auditItem.BizType,
				AuditStatus:    auditItem.AuditStatus,
				AuditTime:      fmt.Sprintf("%v", customData["apply_time"]),
				AuditOperation: operation,
				ApplierID:      auditItem.ApplyDetail.Process.UserID,
				ProcInstID:     auditItem.ID,
				ApplierName:    auditItem.ApplyDetail.Process.UserName,
				ApplyTime:      auditItem.ApplyTime,
			},
		}
		resp.Entries = append(resp.Entries, data)
	}
	return resp, nil
}

func (u *useCase) Revocation(ctx context.Context, req *request.IDReq) (err error) {
	ctx, _ = trace.StartInternalSpan(ctx)
	defer trace.EndSpan(ctx, err)

	//1. 检查没有没有取消记录，不可重复取消
	sandboxApply, err := u.repo.GetSandboxApply(ctx, req.ID)
	if err != nil {
		return err
	}
	//只有审核中的能撤销，其他的情况无法撤销
	if sandboxApply.AuditState != constant.AuditStatusAuditing.Integer.Int32() {
		return errorcode.SandboxInvalidRevocation.Err()
	}
	//2. 调用workflow取消审核
	msg := wf_common.GenNormalCancelMsg(sandboxApply.AuditID)
	if err = u.wf.AuditCancel(msg); err != nil {
		return errorcode.SandboxRevocationFailed.Detail(err.Error())
	}
	//3. 更新状态
	sandboxApply.AuditState = constant.AuditStatusUndone.Integer.Int32()
	if err = u.repo.UpdateSandboxApplyAudit(ctx, sandboxApply); err != nil {
		return errorcode.SandboxRevocationFailed.Detail(err.Error())
	}
	return nil
}
