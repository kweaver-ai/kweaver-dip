package impl

import (
	"context"
	"encoding/json"

	"github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/workflow"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/errorcode"
	domain_plan "github.com/kweaver-ai/dsg/services/apps/task_center/domain/data_processing_plan"
	"github.com/kweaver-ai/dsg/services/apps/task_center/infrastructure/repository/db/model"
	wf_common "github.com/kweaver-ai/idrm-go-common/workflow/common"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
)

const ( // 审核状态STR
	STR_AUDIT_STATUS_PASS   = "pass"
	STR_AUDIT_STATUS_REJECT = "reject"
	STR_AUDIT_STATUS_UNDONE = "undone"
)

func (d *DataProcessingPlan) DataProcessingPlanAuditResultMsgProc(ctx context.Context, msg *wf_common.AuditResultMsg) (err error) {
	// 获取最终结果的消息处理
	var (
		plans              []*model.DataProcessingPlan
		planID, auditRecID uint64
		auditResult        string
	)
	planID, auditRecID, err = ParseAuditApplyID(msg.ApplyID)
	if err != nil {
		log.WithContext(ctx).Errorf("failed to parse audit result apply_id: %s, err: %v", msg.ApplyID, err)
		return err
	}

	if plans, err = d.processingPlanRepo.GetByUniqueIDs(ctx, []uint64{planID}); err != nil {
		log.WithContext(ctx).
			Errorf("get plan: %d failed, error info: %v",
				planID, err)
		return err
	}
	if len(plans) == 0 {
		log.WithContext(ctx).
			Warnf("plan: %d not found, ignore it",
				planID)
		return nil
	}

	if !(plans[0].AuditID != nil && *plans[0].AuditID == auditRecID) {
		log.WithContext(ctx).
			Warnf("plan: %d audit: %d not found, ignore it",
				planID, auditRecID)
		return nil
	}

	auditResult = msg.Result
	switch msg.Result {
	case STR_AUDIT_STATUS_PASS:
		plans[0].AuditStatus = &domain_plan.Pass
		plans[0].AuditResult = &auditResult
	case STR_AUDIT_STATUS_REJECT:
		// plans[0].AuditStatus = &domain_plan.Reject
		// plans[0].AuditResult = &auditResult
		return nil
	case STR_AUDIT_STATUS_UNDONE:
		return nil
	default:
		log.WithContext(ctx).Warnf("unknown audit result type: %s, ignore it", msg.Result)
		return nil
	}

	err = d.processingPlanRepo.Update(ctx, plans[0])
	if err != nil {
		return err
	}

	return nil

}

func (d *DataProcessingPlan) DataProcessingPlanAuditProcessMsgProc(ctx context.Context, msg *wf_common.AuditProcessMsg) (err error) {
	// 获取审核原因的消息处理 todo
	var (
		plans              []*model.DataProcessingPlan
		planID, auditRecID uint64
		auditResult        string
	)
	planID, auditRecID, err = ParseAuditApplyID(msg.ProcessInputModel.Fields.ApplyID)
	if err != nil {
		log.WithContext(ctx).Errorf("failed to parse audit result apply_id: %s, err: %v", msg.ProcessInputModel.Fields.ApplyID, err)
		return err
	}

	if plans, err = d.processingPlanRepo.GetByUniqueIDs(ctx, []uint64{planID}); err != nil {
		log.WithContext(ctx).
			Errorf("get plan: %d failed, error info: %v",
				planID, err)
		return err
	}
	if len(plans) == 0 {
		log.WithContext(ctx).
			Warnf("plan: %d not found, ignore it",
				planID)
		return nil
	}

	if !(plans[0].AuditID != nil && *plans[0].AuditID == auditRecID) {
		log.WithContext(ctx).
			Warnf("plan: %d audit: %d not found, ignore it",
				planID, auditRecID)
		return nil
	}

	if !(plans[0].AuditStatus != nil && *plans[0].AuditStatus == domain_plan.Auditing) {
		log.WithContext(ctx).
			Warnf("paln: %d status is not AUDITING, ignore it", plans[0].ID)
		return nil
	}

	if !msg.ProcessInputModel.Fields.AuditIdea && len(msg.ProcessInputModel.WFCurComment) > 0 {
		plans[0].AuditStatus = &domain_plan.Reject
		plans[0].AuditResult = &auditResult
		plans[0].RejectReason = &msg.ProcessInputModel.WFCurComment
		err = d.processingPlanRepo.Update(ctx, plans[0])
		if err != nil {
			return err
		}

	}
	return nil
}

func (d *DataProcessingPlan) Cancel(ctx context.Context, id string) (err error) {
	// 查询是否可以取消,只有审核状态为审核中的可以撤回
	modelPlan, err := d.processingPlanRepo.GetById(ctx, id)
	if err != nil {
		return err
	}
	// 只有审核状态为审核中的可以撤回
	if modelPlan.AuditStatus != nil && *modelPlan.AuditStatus != domain_plan.Auditing {
		return errorcode.Desc(errorcode.PlanUndoError)
	}

	if err = d.wf.AuditCancel(
		&wf_common.AuditCancelMsg{
			ApplyIDs: []string{GenAuditApplyID(modelPlan.DataProcessingPlanID, uint64(*modelPlan.AuditID))},
			Cause: struct {
				ZHCN string "json:\"zh-cn\""
				ZHTW string "json:\"zh-tw\""
				ENUS string "json:\"en-us\""
			}{
				ZHCN: "revocation",
				ZHTW: "revocation",
				ENUS: "revocation",
			},
		},
	); err != nil {
		log.WithContext(ctx).Errorf("send undo audit instance message error %v", err)
		return errorcode.Detail(errorcode.InternalError, err)
	}

	modelPlan.AuditStatus = &domain_plan.Undo //审核状态更改为已撤回
	err = d.processingPlanRepo.Update(ctx, modelPlan)
	if err != nil {
		return err
	}
	return nil

}

func (d *DataProcessingPlan) AuditList(ctx context.Context, query *domain_plan.AuditListGetReq) (*domain_plan.ProcessingPlanAuditListResp, error) {
	var (
		err    error
		audits *workflow.AuditResponse
	)

	audits, err = d.wfRest.GetList(ctx, workflow.WorkflowListType(query.Target), []string{workflow.AF_TASKS_DATA_PROCESSING_PLAN}, query.Offset, query.Limit, query.Keyword)
	if err != nil {
		log.WithContext(ctx).Errorf("uc.workflow.GetList failed: %v", err)
		return nil, errorcode.Detail(errorcode.InternalError, err)
	}
	resp := &domain_plan.ProcessingPlanAuditListResp{}
	resp.TotalCount = int64(audits.TotalCount)
	resp.Entries = make([]*domain_plan.ProcessingAuditPlanItem, 0, len(audits.Entries))
	for i := range audits.Entries {
		respa := domain_plan.Data{}
		a := audits.Entries[i].ApplyDetail.Data
		if err = json.Unmarshal([]byte(a), &respa); err != nil {
			return nil, err
		}
		resp.Entries = append(resp.Entries,
			&domain_plan.ProcessingAuditPlanItem{
				ApplyTime:     audits.Entries[i].ApplyTime,
				ApplyUserName: audits.Entries[i].ApplyUserName,
				ProcInstID:    audits.Entries[i].ID,
				TaskID:        audits.Entries[i].ProcInstID,
				ID:            respa.Id,
				Name:          respa.Title,
			},
		)
	}
	return resp, nil
}
