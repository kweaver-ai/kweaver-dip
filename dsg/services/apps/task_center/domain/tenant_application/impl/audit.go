package impl

import (
	"context"
	"encoding/json"

	"github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/workflow"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/errorcode"
	domain "github.com/kweaver-ai/dsg/services/apps/task_center/domain/tenant_application"
	"github.com/kweaver-ai/dsg/services/apps/task_center/infrastructure/repository/db/model"
	wf_common "github.com/kweaver-ai/idrm-go-common/workflow/common"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"go.uber.org/zap"
)

const ( // 审核状态STR
	STR_AUDIT_STATUS_PASS   = "pass"
	STR_AUDIT_STATUS_REJECT = "reject"
	STR_AUDIT_STATUS_UNDONE = "undone"
)

func (t *TenantApplication) TenantApplicationAuditResultMsgProc(ctx context.Context, msg *wf_common.AuditResultMsg) (err error) {
	// 获取最终结果的消息处理
	var (
		tenantApplications              []*model.TcTenantApp
		tenantApplicationID, auditRecID uint64
		auditResult                     string
	)
	tenantApplicationID, auditRecID, err = ParseAuditApplyID(msg.ApplyID)
	if err != nil {
		log.WithContext(ctx).Errorf("failed to parse audit result apply_id: %s, err: %v", msg.ApplyID, err)
		return err
	}

	if tenantApplications, err = t.tenantApplicationRepo.GetByUniqueIDs(ctx, []uint64{tenantApplicationID}); err != nil {
		log.WithContext(ctx).
			Errorf("get tenantApplication: %d failed, error info: %v",
				tenantApplications, err)
		return err
	}
	if len(tenantApplications) == 0 {
		log.WithContext(ctx).
			Warnf("workOrder: %d not found, ignore it",
				tenantApplicationID)
		return nil
	}

	if !(tenantApplications[0].AuditID != nil && *tenantApplications[0].AuditID == auditRecID) {
		log.WithContext(ctx).
			Warnf("workOrder: %d audit: %d not found, ignore it",
				tenantApplicationID, auditRecID)
		return nil
	}
	auditResult = msg.Result
	log.WithContext(ctx).Infof("result %s", auditResult)
	switch msg.Result {
	case STR_AUDIT_STATUS_PASS:
		auditStatus := domain.TN_AUDIT_STATUS_PASS
		tenantApplications[0].AuditStatus = &auditStatus
		// plans[0].Status = &domain_plan.Declarationed // 已经申报
		tenantApplications[0].AuditResult = &auditResult
		tenantApplications[0].Status = domain.DARA_STATUS_PENDING_ACTIVATION
	case STR_AUDIT_STATUS_REJECT:
		auditStatus := domain.TN_AUDIT_STATUS_REJECT
		tenantApplications[0].AuditStatus = &auditStatus
		tenantApplications[0].AuditResult = &auditResult
		tenantApplications[0].Status = domain.DARA_STATUS_UNREPORT
		// plans[0].AuditResult = &auditResult

	case STR_AUDIT_STATUS_UNDONE:
		auditStatus := domain.TN_AUDIT_STATUS_UNDONE

		tenantApplications[0].AuditStatus = &auditStatus
		tenantApplications[0].Status = domain.DARA_STATUS_UNREPORT
		return nil
	default:
		log.WithContext(ctx).Warnf("unknown audit result type: %s, ignore it", msg.Result)
		return nil
	}

	err = t.tenantApplicationRepo.Update(nil, ctx, tenantApplications[0])
	if err != nil {
		return err
	}

	return nil

}

func (t *TenantApplication) TenantApplicationAuditProcessMsgProc(ctx context.Context, msg *wf_common.AuditProcessMsg) (err error) {
	// 获取审核原因的消息处理
	var (
		tenantApplications              []*model.TcTenantApp
		tenantApplicationID, auditRecID uint64
	)

	tenantApplicationID, auditRecID, err = ParseAuditApplyID(msg.ProcessInputModel.Fields.ApplyID)
	if err != nil {
		log.WithContext(ctx).Errorf("failed to parse audit result apply_id: %s, err: %v", msg.ProcessInputModel.Fields.ApplyID, err)
		return err
	}

	//log.WithContext(ctx).Infof("process message %s", msg.ProcessInputModel.Fields.ApplyID)

	if tenantApplications, err = t.tenantApplicationRepo.GetByUniqueIDs(ctx, []uint64{tenantApplicationID}); err != nil {
		log.WithContext(ctx).
			Errorf("get tenantApplication: %d failed, error info: %v",
				tenantApplicationID, err)
		return err
	}
	if len(tenantApplications) == 0 {
		log.WithContext(ctx).
			Warnf("tenantApplication: %d not found, ignore it",
				tenantApplicationID)
		return nil
	}

	if !(tenantApplications[0].AuditID != nil && *tenantApplications[0].AuditID == auditRecID) {
		log.WithContext(ctx).
			Warnf("tenantApplication: %d audit: %d not found, ignore it",
				tenantApplicationID, auditRecID)
		return nil
	}
	if tenantApplications[0].AuditStatus != nil && *tenantApplications[0].AuditStatus == domain.TN_AUDIT_STATUS_NONE {
		log.WithContext(ctx).
			Warnf("tenantApplication: %s status is not AUDITING, ignore it", tenantApplications[0].ID)
		return nil
	}

	if !msg.ProcessInputModel.Fields.AuditIdea && len(msg.ProcessInputModel.WFCurComment) > 0 {

		aStatus := domain.TN_AUDIT_STATUS_REJECT
		tenantApplications[0].AuditStatus = &aStatus
		tenantApplications[0].Status = domain.DARA_STATUS_UNREPORT
		tenantApplications[0].RejectReason = msg.ProcessInputModel.WFCurComment
		err = t.tenantApplicationRepo.Update(nil, ctx, tenantApplications[0])
		if err != nil {
			return err
		}

	}
	return nil
}

func (t *TenantApplication) Cancel(ctx context.Context, req *domain.TenantApplicationCancelReq, id string) (err error) {
	// 查询是否可以取消,只有审核状态为审核中的可以撤回
	tenantApplication, err := t.tenantApplicationRepo.GetById(ctx, id)
	if err != nil {
		return err
	}
	// 只有审核状态为审核中的可以撤回
	if tenantApplication.AuditStatus != nil && *tenantApplication.AuditStatus != domain.AuditStatusAuditing.Integer.Int32() {
		return errorcode.Desc(errorcode.PlanUndoError)
	}
	if tenantApplication.AuditID == nil {
		return errorcode.Desc(errorcode.PlanUndoError)
	}
	applyID := GenAuditApplyID(tenantApplication.TenantApplicationID, *tenantApplication.AuditID)

	if err = t.wf.AuditCancel(

		&wf_common.AuditCancelMsg{
			ApplyIDs: []string{applyID},
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
	auditStatus := domain.TN_AUDIT_STATUS_UNDONE
	tenantApplication.AuditStatus = &auditStatus //审核状态更改为已撤回
	tenantApplication.CancelReason = req.CancelReason
	tenantApplication.AuditID = nil
	err = t.tenantApplicationRepo.Update(nil, ctx, tenantApplication)
	if err != nil {
		return err
	}
	return nil

}

func (t *TenantApplication) modelToAuditList(ctx context.Context, apply *model.TcTenantApp) (*domain.TenantApplicationAuditItem, error) {
	tenantInfo := domain.TenantApplicationObjectItem{
		ID:              apply.ID,
		ApplicationName: apply.ApplicationName,
		ApplicationCode: apply.ApplicationCode,
		TenantName:      apply.TenantName,
		DepartmentId:    apply.BusinessUnitID,
		DepartmentName:  "",
		DepartmentPath:  "",
		ContactorId:     apply.BusinessUnitContactorID,
		ContactorName:   t.userDomain.GetNameByUserId(ctx, apply.BusinessUnitContactorID),
		ContactorPhone:  apply.BusinessUnitPhone,
		CancelReason:    apply.CancelReason,
		RejectReason:    apply.RejectReason,
		AppliedAt:       apply.UpdatedAt.UnixMilli(),
	}

	dept, err := t.ccDriven.GetDepartmentPrecision(ctx, []string{tenantInfo.DepartmentId})
	if err != nil {
		log.WithContext(ctx).Error("configuration GetDepartmentPrecision err", zap.Error(err))
		return nil, errorcode.Detail(errorcode.InternalError, err)
	}
	if len(dept.Departments) == 0 {
		log.WithContext(ctx).Errorf("department：%s not existed", tenantInfo.DepartmentId)
		return nil, errorcode.Detail(errorcode.InternalError, "部门不存在")
	}
	tenantInfo.DepartmentName = dept.Departments[0].Name
	tenantInfo.DepartmentPath = dept.Departments[0].Path

	tenantInfo.AppliedByUid = apply.CreatedByUID
	appliedByUid, err := t.userDomain.GetByUserId(ctx, apply.CreatedByUID)
	tenantInfo.AppliedByName = appliedByUid.Name

	auditRes := domain.TenantApplicationAuditItem{TenantApplicationObjectItem: tenantInfo}
	auditRes.Status = domain.SAAStatus2Str(apply.Status)
	return &auditRes, nil
}

func (t *TenantApplication) AuditList(ctx context.Context, query *domain.AuditListGetReq) (*domain.TenantApplicationAuditListResp, error) {
	var (
		err    error
		audits *workflow.AuditResponse
	)

	audits, err = t.wfRest.GetList(ctx, workflow.WORKFLOW_LIST_TYPE_TASK, []string{workflow.AF_TASKS_DATA_PROCESSING_TENANT_APPLICATION}, query.Offset, query.Limit, query.Keyword)
	if err != nil {
		log.WithContext(ctx).Errorf("uc.workflow.GetList failed: %v", err)
		return nil, errorcode.Detail(errorcode.InternalError, err)
	}

	resp := &domain.TenantApplicationAuditListResp{}
	resp.TotalCount = int64(audits.TotalCount)
	resp.Entries = make([]*domain.TenantApplicationAuditItem, 0, len(audits.Entries))

	tTenantAppIds := make([]uint64, 0, len(audits.Entries))
	tid2Type := map[uint64]domain.TenantApplicationAuditItem{}
	for _, item := range audits.Entries {
		tenantApplicationID, _, err := ParseAuditApplyID(item.ApplyDetail.Process.ApplyID)
		if err != nil {
			return nil, err
		}
		tTenantAppIds = append(tTenantAppIds, tenantApplicationID)
		tid2Type[tenantApplicationID] = domain.TenantApplicationAuditItem{
			ProcInstID:  item.ID,
			TaskID:      item.ProcInstID,
			AuditStatus: item.AuditStatus,
			AuditType:   item.ApplyDetail.Process.AuditType,
		}
	}

	if len(tTenantAppIds) == 0 {
		return resp, nil
	}
	entities, err := t.tenantApplicationRepo.GetByUniqueIDs(ctx, tTenantAppIds)

	entityInfo := map[uint64]*domain.TenantApplicationAuditItem{}

	for _, entity := range entities {
		tenantInfo, err := t.modelToAuditList(ctx, entity)
		if err != nil {
			return nil, err
		}
		if entity.AuditStatus != nil {
			tenantInfo.AuditStatus = domain.TAEnum2AuditStatus(*entity.AuditStatus)
		}
		entityInfo[entity.TenantApplicationID] = tenantInfo
	}

	for _, item := range audits.Entries {
		tenantApplicationID, _, err := ParseAuditApplyID(item.ApplyDetail.Process.ApplyID)
		if err != nil {
			return nil, err
		}
		entityDetails, exists := entityInfo[tenantApplicationID]
		if exists {
			entityDetails.AuditType = item.AuditType
			entityDetails.ProcInstID = item.ID
			entityDetails.TaskID = item.ProcInstID

			resp.Entries = append(resp.Entries, entityDetails)

		} else {
			data := domain.Data{}
			a := item.ApplyDetail.Data
			if err = json.Unmarshal([]byte(a), &data); err != nil {
				return nil, err
			}
			basicInfo := domain.TenantApplicationObjectItem{
				ID:              data.Id,
				ApplicationName: data.Title,
				ApplicationCode: "",
				TenantName:      "",
				DepartmentId:    "",
				DepartmentName:  "",
				DepartmentPath:  "",
				ContactorId:     item.ApplyDetail.Process.UserID,
				ContactorName:   item.ApplyDetail.Process.UserName,
				ContactorPhone:  "",
				CancelReason:    "",
				RejectReason:    "",

				AppliedAt: data.SubmitTime,
			}
			nEntityDetails := domain.TenantApplicationAuditItem{
				TenantApplicationObjectItem: basicInfo,
				AuditType:                   item.AuditType,
				ProcInstID:                  item.ID,
				TaskID:                      item.ProcInstID,
				Status:                      domain.S_STATUS_DELETE,
			}

			resp.Entries = append(resp.Entries, &nEntityDetails)
		}

	}
	return resp, nil
}
