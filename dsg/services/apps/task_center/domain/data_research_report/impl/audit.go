package impl

import (
	"context"
	"encoding/json"
	"errors"
	"strconv"
	"strings"

	"github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/workflow"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/errorcode"
	data_research_report_domain "github.com/kweaver-ai/dsg/services/apps/task_center/domain/data_research_report"
	"github.com/kweaver-ai/dsg/services/apps/task_center/infrastructure/repository/db/model"
	wf_common "github.com/kweaver-ai/idrm-go-common/workflow/common"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
)

const ( // 审核状态STR
	STR_AUDIT_STATUS_PASS   = "pass"
	STR_AUDIT_STATUS_REJECT = "reject"
	STR_AUDIT_STATUS_UNDONE = "undone"
)

func ParseAuditApplyID(auditApplyID string) (uint64, uint64, error) {
	strs := strings.Split(auditApplyID, "-")
	if len(strs) != 2 {
		return 0, 0, errors.New("audit apply id format invalid")
	}

	var auditID uint64
	ID, err := strconv.ParseUint(strs[0], 10, 64)
	if err == nil {
		auditID, err = strconv.ParseUint(strs[1], 10, 64)
	}
	return ID, auditID, err
}

func (d *DataResearchReport) DataResearchReportAuditResultMsgProc(ctx context.Context, msg *wf_common.AuditResultMsg) (err error) {
	// 获取最终结果的消息处理
	var (
		researchReport               []*model.DataResearchReport
		researchReportID, auditRecID uint64
		auditResult                  string
	)
	researchReportID, auditRecID, err = ParseAuditApplyID(msg.ApplyID)
	if err != nil {
		log.WithContext(ctx).Errorf("failed to parse audit result apply_id: %s, err: %v", msg.ApplyID, err)
		return err
	}

	if researchReport, err = d.dataResearchReportRepo.GetByUniqueIDs(ctx, []uint64{researchReportID}); err != nil {
		log.WithContext(ctx).
			Errorf("get researchReport: %d failed, error info: %v",
				researchReportID, err)
		return err
	}
	if len(researchReport) == 0 {
		log.WithContext(ctx).
			Warnf("researchReport: %d not found, ignore it",
				researchReportID)
		return nil
	}

	if !(researchReport[0].AuditID != nil && *researchReport[0].AuditID == auditRecID) {
		log.WithContext(ctx).
			Warnf("researchReport: %d audit: %d not found, ignore it",
				researchReportID, auditRecID)
		return nil
	}

	auditResult = msg.Result
	switch msg.Result {
	case STR_AUDIT_STATUS_PASS:
		switch {
		case *researchReport[0].AuditStatus == data_research_report_domain.Auditing:
			updateFilesMap := map[string]interface{}{
				"audit_status":       &data_research_report_domain.Pass,
				"declaration_status": &data_research_report_domain.Declarationed,
				"audit_result":       &auditResult,
			}
			err = d.dataResearchReportRepo.UpdateFields(ctx, researchReport[0].ID, updateFilesMap)
			if err != nil {
				return err
			}
		case *researchReport[0].AuditStatus == data_research_report_domain.ChangeAuditing:
			changeAudit, err := d.dataResearchReportRepo.GetChangeAudit(ctx, researchReport[0].ID)
			if err != nil {
				return err
			}
			updateFilesMap := map[string]interface{}{
				"audit_status":        &data_research_report_domain.Pass,
				"audit_result":        &auditResult,
				"work_order_id":       changeAudit.WorkOrderID,
				"research_purpose":    changeAudit.ResearchPurpose,
				"research_object":     changeAudit.ResearchObject,
				"research_method":     changeAudit.ResearchMethod,
				"research_content":    changeAudit.ResearchContent,
				"research_conclusion": changeAudit.ResearchConclusion,
				"remark":              &changeAudit.Remark,
			}
			err = d.dataResearchReportRepo.UpdateFields(ctx, researchReport[0].ID, updateFilesMap)
			if err != nil {
				return err
			}
			err = d.dataResearchReportRepo.DeleteChangeAudit(ctx, researchReport[0].ID)
			if err != nil {
				return err
			}
		}
	case STR_AUDIT_STATUS_REJECT:
		switch {
		case *researchReport[0].AuditStatus == data_research_report_domain.Auditing:
			updateFilesMap := map[string]interface{}{
				"audit_status":       &data_research_report_domain.Reject,
				"declaration_status": &data_research_report_domain.Declarationed,
				"audit_result":       &auditResult,
			}
			err = d.dataResearchReportRepo.UpdateFields(ctx, researchReport[0].ID, updateFilesMap)
			if err != nil {
				return err
			}
		case *researchReport[0].AuditStatus == data_research_report_domain.ChangeAuditing:
			updateFilesMap := map[string]interface{}{
				"audit_status": &data_research_report_domain.ChangeReject,
				"audit_result": &auditResult,
			}
			err = d.dataResearchReportRepo.UpdateFields(ctx, researchReport[0].ID, updateFilesMap)
			if err != nil {
				return err
			}
		}
	case STR_AUDIT_STATUS_UNDONE:
		switch {
		case *researchReport[0].AuditStatus == data_research_report_domain.Auditing:
			updateFilesMap := map[string]interface{}{
				"audit_status": &data_research_report_domain.Undo,
			}
			err = d.dataResearchReportRepo.UpdateFields(ctx, researchReport[0].ID, updateFilesMap)
			if err != nil {
				return err
			}
		case *researchReport[0].AuditStatus == data_research_report_domain.ChangeAuditing:
			updateFilesMap := map[string]interface{}{
				"audit_status": &data_research_report_domain.Pass,
			}
			err = d.dataResearchReportRepo.UpdateFields(ctx, researchReport[0].ID, updateFilesMap)
			if err != nil {
				return err
			}
		}
		return nil
	default:
		log.WithContext(ctx).Warnf("unknown audit result type: %s, ignore it", msg.Result)
		return nil
	}
	return nil

}

func (d *DataResearchReport) Cancel(ctx context.Context, id string) (err error) {
	// 查询是否可以取消,只有审核状态为审核中的可以撤回
	researchReport, err := d.dataResearchReportRepo.GetById(ctx, id)
	if err != nil {
		return err
	}
	// 审核状态不为审核中或变更审核中时，不可取消
	if *researchReport.AuditStatus != data_research_report_domain.Auditing && *researchReport.AuditStatus != data_research_report_domain.ChangeAuditing {
		return errorcode.Desc(errorcode.ReportUndoError)
	}

	if err = d.wf.AuditCancel(
		&wf_common.AuditCancelMsg{
			ApplyIDs: []string{GenAuditApplyID(researchReport.DataResearchReportID, uint64(*researchReport.AuditID))},
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
	switch {
	case *researchReport.AuditStatus == data_research_report_domain.Auditing:
		researchReport.AuditStatus = &data_research_report_domain.Undo //审核状态更改为已撤回
	case *researchReport.AuditStatus == data_research_report_domain.ChangeAuditing:
		researchReport.AuditStatus = &data_research_report_domain.Pass
	}
	err = d.dataResearchReportRepo.Update(ctx, &researchReport.DataResearchReport)
	if err != nil {
		return err
	}
	return nil

}

func (d *DataResearchReport) AuditList(ctx context.Context, query *data_research_report_domain.AuditListGetReq) (*data_research_report_domain.DataResearchReportAuditListResp, error) {
	var (
		err    error
		audits *workflow.AuditResponse
	)

	audits, err = d.wfRest.GetList(ctx, workflow.WorkflowListType(query.Target), []string{workflow.AF_TASKS_DATA_RESEARCH_REPORT}, query.Offset, query.Limit, query.Keyword)
	if err != nil {
		log.WithContext(ctx).Errorf("uc.workflow.GetList failed: %v", err)
		return nil, errorcode.Detail(errorcode.InternalError, err)
	}
	resp := &data_research_report_domain.DataResearchReportAuditListResp{}
	resp.TotalCount = int64(audits.TotalCount)
	resp.Entries = make([]*data_research_report_domain.DataResearchReportAuditItem, 0, len(audits.Entries))
	for i := range audits.Entries {
		respa := data_research_report_domain.Data{}
		a := audits.Entries[i].ApplyDetail.Data
		if err = json.Unmarshal([]byte(a), &respa); err != nil {
			return nil, err
		}
		resp.Entries = append(resp.Entries,
			&data_research_report_domain.DataResearchReportAuditItem{
				ApplyTime:     audits.Entries[i].ApplyTime,
				ApplyUserName: audits.Entries[i].ApplyUserName,
				ProcInstID:    audits.Entries[i].ID,
				TaskID:        audits.Entries[i].ProcInstID,
				AuditType:     respa.AuditType,
				ID:            respa.Id,
				Name:          respa.Title,
			},
		)
	}
	return resp, nil
}

func (d *DataResearchReport) DataResearchReportAuditProcessMsgProc(ctx context.Context, msg *wf_common.AuditProcessMsg) (err error) {
	// 获取审核原因的消息处理 todo
	var (
		dataResearchReport           []*model.DataResearchReport
		researchReportID, auditRecID uint64
	)
	log.WithContext(ctx).Warnf("DataResearchReportAuditProcessMsgProc")
	researchReportID, auditRecID, err = ParseAuditApplyID(msg.ProcessInputModel.Fields.ApplyID)
	if err != nil {
		log.WithContext(ctx).Errorf("failed to parse audit result apply_id: %s, err: %v", msg.ProcessInputModel.Fields.ApplyID, err)
		return err
	}

	if dataResearchReport, err = d.dataResearchReportRepo.GetByUniqueIDs(ctx, []uint64{researchReportID}); err != nil {
		log.WithContext(ctx).
			Errorf("get plan: %d failed, error info: %v",
				researchReportID, err)
		return err
	}
	if len(dataResearchReport) == 0 {
		log.WithContext(ctx).
			Warnf("plan: %d not found, ignore it",
				researchReportID)
		return nil
	}

	if !(dataResearchReport[0].AuditID != nil && *dataResearchReport[0].AuditID == auditRecID) {
		log.WithContext(ctx).
			Warnf("plan: %d audit: %d not found, ignore it",
				researchReportID, auditRecID)
		return nil
	}

	if !msg.ProcessInputModel.Fields.AuditIdea && len(msg.ProcessInputModel.WFCurComment) > 0 {
		log.WithContext(ctx).
			Warnf("plan: %d, reject reason: %s",
				dataResearchReport[0].ID, msg.ProcessInputModel.WFCurComment)
		err = d.dataResearchReportRepo.UpdateRejectReason(ctx, dataResearchReport[0].ID, msg.ProcessInputModel.WFCurComment)
		if err != nil {
			return err
		}

	}
	return nil
}
