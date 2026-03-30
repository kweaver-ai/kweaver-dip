package impl

import (
	"context"
	"fmt"
	"time"

	data_research_report_driven "github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/gorm/data_research_report"
	"github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/workflow"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/errorcode"
	data_research_report_domain "github.com/kweaver-ai/dsg/services/apps/task_center/domain/data_research_report"
	"github.com/kweaver-ai/dsg/services/apps/task_center/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-common/rest/configuration_center"
	wf_go "github.com/kweaver-ai/idrm-go-common/workflow"
	wf_common "github.com/kweaver-ai/idrm-go-common/workflow/common"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	utilities "github.com/kweaver-ai/idrm-go-frame/core/utils"
)

const (
	AUDIT_ICON_BASE64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAABQklEQVR4nO2UP0tCURjGnwOh" +
		"lINSGpRZEjjVUENTn6CWWoKc2mpra6qxpra2mnIybKipPkFTVA41CWGZBUmhg4US2HPuRfpzrn/OQcHBH9z3Pi+Xe393eM8r/FeJEwgsog2ICg6F/zpRYW4" +
		"bXUFDHAXR/jD2xmaw+3LHDtgYmmBV+f18/eES8fc0/uMoyE0vsQIHrynrpZ3gFDuVzWzS+pnVwQg7IHBzzPqXuoLCVxn7uRRTbdYCEXh7XEwGAl06U7Byf4Gzw" +
		"jOTyrx3GLHxWSYbI8FjqYhMucikEnJ5MOr2MNkYCeTHM6UPJpWQu8+SVDESbD0la06SnKDtkZ8RNhLoYCQ4z2dx+5lnUpns9WHOF2SyMRLE39I44ml2YpmnODo" +
		"QRhUjgQ5NC+R+kctOB61l10q6goZIwSnvC7xajoCIfQOxQqhkUqjuTQAAAABJRU5ErkJggg=="
)

type DataResearchReport struct {
	dataResearchReportRepo data_research_report_driven.DataResearchReportRepo
	ccDriven               configuration_center.Driven
	wf                     wf_go.WorkflowInterface
	wfRest                 workflow.WorkflowInterface
}

func NewDataResearchReport(dataResearchReport data_research_report_driven.DataResearchReportRepo,
	ccDriven configuration_center.Driven,
	wf wf_go.WorkflowInterface,
	wfRest workflow.WorkflowInterface) data_research_report_domain.DataResearchReport {
	d := &DataResearchReport{dataResearchReportRepo: dataResearchReport,
		ccDriven: ccDriven,
		wf:       wf,
		wfRest:   wfRest,
	}
	wf.RegistConusmeHandlers(workflow.AF_TASKS_DATA_RESEARCH_REPORT, d.DataResearchReportAuditProcessMsgProc, d.DataResearchReportAuditResultMsgProc,
		nil)
	return d
}

func (d *DataResearchReport) Create(ctx context.Context, req *data_research_report_domain.DataResearchReportCreateParam, userId, userName string) (*data_research_report_domain.IDResp, error) {
	var (
		err            error
		bIsAuditNeeded bool
	)
	//  检查同名冲突
	err = d.CheckNameRepeat(ctx, &data_research_report_domain.DataResearchReportNameRepeatReq{Name: req.Name})
	if err != nil {
		return nil, err
	}

	uniqueID, err := utilities.GetUniqueID()
	if err != nil {
		return nil, errorcode.Detail(errorcode.InternalError, err)
	}
	researchReport := req.ToModel(userId, uniqueID)
	// 如果是提交
	if req.NeedDeclaration {
		// 判断是否有审核流程
		auditBindInfo, err := d.ccDriven.GetProcessBindByAuditType(ctx, &configuration_center.GetProcessBindByAuditTypeReq{AuditType: workflow.AF_TASKS_DATA_RESEARCH_REPORT})
		if err != nil {
			return nil, err
		}
		if len(auditBindInfo.ID) > 0 && auditBindInfo.ProcDefKey != "" {
			bIsAuditNeeded = true
		}
		var auditType string
		switch {
		case *researchReport.DeclarationStatus == data_research_report_domain.ToDeclaration:
			auditType = data_research_report_domain.AuditType2Str(data_research_report_domain.AuditType)
		case *researchReport.DeclarationStatus == data_research_report_domain.Declarationed:
			auditType = data_research_report_domain.AuditType2Str(data_research_report_domain.ChangeAuditType)
		}
		if bIsAuditNeeded {
			var auditRecID uint64
			auditRecID, err = utilities.GetUniqueID()
			if err != nil {
				return nil, errorcode.Detail(errorcode.InternalError, err)
			}
			msg := &wf_common.AuditApplyMsg{
				Process: wf_common.AuditApplyProcessInfo{
					ApplyID:    GenAuditApplyID(uniqueID, auditRecID),
					AuditType:  workflow.AF_TASKS_DATA_RESEARCH_REPORT,
					UserID:     userId,
					UserName:   userName,
					ProcDefKey: auditBindInfo.ProcDefKey,
				},
				Data: map[string]any{
					"id":          researchReport.ID,
					"title":       req.Name,
					"submit_time": time.Now().UnixMilli(),
					"audit_type":  auditType,
				},
				Workflow: wf_common.AuditApplyWorkflowInfo{
					TopCsf: 5,
					AbstractInfo: wf_common.AuditApplyAbstractInfo{
						Icon: AUDIT_ICON_BASE64,
						Text: "数据调研报告名称：" + req.Name,
					},
				},
			}
			if err := d.wf.AuditApply(msg); err != nil {
				log.WithContext(ctx).Errorf("send start audit instance message error %v", err)
				return nil, errorcode.Detail(errorcode.InternalError, err)
			}
			researchReport.AuditStatus = &data_research_report_domain.Auditing            //审核中
			researchReport.AuditID = &auditRecID                                          //  审核记录id
			researchReport.DeclarationStatus = &data_research_report_domain.ToDeclaration // 待申报
		} else {
			researchReport.DeclarationStatus = &data_research_report_domain.Declarationed // 已经申报
			researchReport.AuditStatus = &data_research_report_domain.Pass
		}
	} else {
		researchReport.AuditStatus = &data_research_report_domain.Undo
	}
	err = d.dataResearchReportRepo.Create(ctx, researchReport)
	if err != nil {
		return nil, err
	}
	return &data_research_report_domain.IDResp{UUID: researchReport.ID}, nil
}

func (d *DataResearchReport) CheckNameRepeat(ctx context.Context, req *data_research_report_domain.DataResearchReportNameRepeatReq) error {
	exist, err := d.dataResearchReportRepo.CheckNameRepeat(ctx, req.Id, req.Name)
	if err != nil {
		return errorcode.Detail(errorcode.ReportDatabaseError, err.Error())
	}
	if exist {
		return errorcode.Desc(errorcode.ReportNameRepeatError)
	}
	return nil
}

func GenAuditApplyID(ID uint64, auditRecID uint64) string {
	return fmt.Sprintf("%d-%d", ID, auditRecID)
}

func (d *DataResearchReport) Delete(ctx context.Context, id string) error {
	var (
		err error
	)
	//  检查是否存在
	researchReport, err := d.dataResearchReportRepo.GetById(ctx, id)
	if err != nil {
		return err
	}

	// 审核处于审核中的(撤回的,拒绝,驳回的可以删除), 状态为已经申报的,不可以删除
	// if (researchReport.AuditStatus != nil && *researchReport.AuditStatus == data_research_report_domain.Auditing) || *researchReport.DeclarationStatus == data_research_report_domain.Declarationed {
	if researchReport.AuditStatus != nil && *researchReport.AuditStatus == data_research_report_domain.Auditing {
		return errorcode.Desc(errorcode.ReportDeleteError)
	}

	err = d.dataResearchReportRepo.Delete(ctx, id)
	if err != nil {
		return err
	}
	// 删除变更审核
	_ = d.dataResearchReportRepo.DeleteChangeAudit(ctx, id)
	return nil
}

func (d *DataResearchReport) Update(ctx context.Context, req *data_research_report_domain.DataResearchReportUpdateReq, id, userId, userName string) (*data_research_report_domain.IDResp, error) {
	var (
		err            error
		bIsAuditNeeded bool
	)
	//  检查是否存在
	researchReport, err := d.dataResearchReportRepo.GetById(ctx, id)
	if err != nil {
		return nil, err
	}
	//  检查同名冲突 todo
	err = d.CheckNameRepeat(ctx, &data_research_report_domain.DataResearchReportNameRepeatReq{Name: req.Name, Id: id})
	if err != nil {
		return nil, err
	}
	// 审核中不可编辑
	if researchReport.AuditStatus != nil && (*researchReport.AuditStatus == data_research_report_domain.Auditing || *researchReport.AuditStatus == data_research_report_domain.ChangeAuditing) {
		return nil, errorcode.Desc(errorcode.ReportEditError)
	}

	if req.NeedDeclaration {
		// 判断是否有审核流程
		auditBindInfo, err := d.ccDriven.GetProcessBindByAuditType(ctx, &configuration_center.GetProcessBindByAuditTypeReq{AuditType: workflow.AF_TASKS_DATA_RESEARCH_REPORT})
		if err != nil {
			return nil, err
		}
		if len(auditBindInfo.ID) > 0 && auditBindInfo.ProcDefKey != "" {
			bIsAuditNeeded = true
		}

		if bIsAuditNeeded {
			var auditRecID uint64
			auditRecID, err = utilities.GetUniqueID()
			if err != nil {
				return nil, errorcode.Detail(errorcode.InternalError, err)
			}
			var auditType string
			switch {
			case *researchReport.DeclarationStatus == data_research_report_domain.ToDeclaration:
				auditType = data_research_report_domain.AuditType2Str(data_research_report_domain.AuditType)
			case *researchReport.DeclarationStatus == data_research_report_domain.Declarationed:
				auditType = data_research_report_domain.AuditType2Str(data_research_report_domain.ChangeAuditType)
			}
			msg := &wf_common.AuditApplyMsg{
				Process: wf_common.AuditApplyProcessInfo{
					ApplyID:    GenAuditApplyID(researchReport.DataResearchReportID, auditRecID),
					AuditType:  workflow.AF_TASKS_DATA_RESEARCH_REPORT,
					UserID:     userId,
					UserName:   userName,
					ProcDefKey: auditBindInfo.ProcDefKey,
				},
				Data: map[string]any{
					"id":          researchReport.ID,
					"title":       req.Name,
					"submit_time": time.Now().UnixMilli(),
					"audit_type":  auditType,
				},
				Workflow: wf_common.AuditApplyWorkflowInfo{
					TopCsf: 5,
					AbstractInfo: wf_common.AuditApplyAbstractInfo{
						Icon: AUDIT_ICON_BASE64,
						Text: "数据调研报告名称：" + req.Name,
					},
				},
			}
			if err := d.wf.AuditApply(msg); err != nil {
				log.WithContext(ctx).Errorf("send start audit instance message error %v", err)
				return nil, errorcode.Detail(errorcode.InternalError, err)
			}
			researchReport.AuditID = &auditRecID //  审核记录id
			switch {
			// 待申报
			case *researchReport.DeclarationStatus == data_research_report_domain.ToDeclaration || (*researchReport.DeclarationStatus == data_research_report_domain.Declarationed && *researchReport.AuditStatus == data_research_report_domain.Reject):
				researchReport.AuditStatus = &data_research_report_domain.Auditing //审核中
				researchReport.DataResearchReport.Name = req.Name
				researchReport.DataResearchReport.WorkOrderID = req.WorkOrderID
				researchReport.DataResearchReport.ResearchPurpose = req.ResearchPurpose
				researchReport.DataResearchReport.ResearchObject = req.ResearchObject
				researchReport.DataResearchReport.ResearchMethod = req.ResearchMethod
				researchReport.DataResearchReport.ResearchContent = req.ResearchContent
				researchReport.DataResearchReport.ResearchConclusion = req.ResearchConclusion
				researchReport.DataResearchReport.Remark = &req.Remark
				err = d.dataResearchReportRepo.Update(ctx, &researchReport.DataResearchReport)
				if err != nil {
					return nil, err
				}
			// 审核通过
			case *researchReport.AuditStatus == data_research_report_domain.Pass || *researchReport.AuditStatus == data_research_report_domain.Undo:
				researchReport.AuditStatus = &data_research_report_domain.ChangeAuditing //变更审核
				researchReportChangeAudit := &model.DataResearchReportChangeAudit{
					ID:                 researchReport.ID,
					WorkOrderID:        req.WorkOrderID,
					ResearchPurpose:    req.ResearchPurpose,
					ResearchObject:     req.ResearchObject,
					ResearchMethod:     req.ResearchMethod,
					ResearchContent:    req.ResearchContent,
					ResearchConclusion: req.ResearchConclusion,
					Remark:             req.Remark,
					CreatedByUID:       userId,
					UpdatedByUID:       userId,
				}
				err = d.dataResearchReportRepo.CreateChangeAudit(ctx, researchReportChangeAudit)
				if err != nil {
					return nil, err
				}
				err = d.dataResearchReportRepo.Update(ctx, &researchReport.DataResearchReport)
				if err != nil {
					return nil, err
				}
			// 变更审核未通过
			case *researchReport.AuditStatus == data_research_report_domain.ChangeReject:
				researchReport.AuditStatus = &data_research_report_domain.ChangeAuditing //变更审核
				researchReportChangeAudit := &model.DataResearchReportChangeAudit{
					ID:                 researchReport.ID,
					WorkOrderID:        req.WorkOrderID,
					ResearchPurpose:    req.ResearchPurpose,
					ResearchObject:     req.ResearchObject,
					ResearchMethod:     req.ResearchMethod,
					ResearchContent:    req.ResearchContent,
					ResearchConclusion: req.ResearchConclusion,
					Remark:             req.Remark,
					CreatedByUID:       userId,
					UpdatedByUID:       userId,
				}
				err = d.dataResearchReportRepo.UpdateChangeAudit(ctx, researchReportChangeAudit)
				if err != nil {
					return nil, err
				}
				err = d.dataResearchReportRepo.Update(ctx, &researchReport.DataResearchReport)
				if err != nil {
					return nil, err
				}
			}
		} else {
			// 判断是否有变更内容，如果有删除
			changeAudit, err := d.dataResearchReportRepo.GetChangeAudit(ctx, researchReport.ID)
			if err != nil {
				return nil, err
			}
			if changeAudit != nil {
				err = d.dataResearchReportRepo.DeleteChangeAudit(ctx, researchReport.ID)
				if err != nil {
					return nil, err
				}
			}
			researchReport.DataResearchReport.Name = req.Name
			researchReport.DataResearchReport.WorkOrderID = req.WorkOrderID
			researchReport.DataResearchReport.ResearchPurpose = req.ResearchPurpose
			researchReport.DataResearchReport.ResearchObject = req.ResearchObject
			researchReport.DataResearchReport.ResearchMethod = req.ResearchMethod
			researchReport.DataResearchReport.ResearchContent = req.ResearchContent
			researchReport.DataResearchReport.ResearchConclusion = req.ResearchConclusion
			researchReport.DataResearchReport.Remark = &req.Remark
			researchReport.DeclarationStatus = &data_research_report_domain.Declarationed // 已经申报
			researchReport.AuditStatus = &data_research_report_domain.Pass
			err = d.dataResearchReportRepo.Update(ctx, &researchReport.DataResearchReport)
			if err != nil {
				return nil, err
			}
		}
	} else {
		//暂存
		switch {
		// 待申报暂存
		case *researchReport.DeclarationStatus == data_research_report_domain.ToDeclaration:
			researchReport.DataResearchReport.Name = req.Name
			researchReport.DataResearchReport.WorkOrderID = req.WorkOrderID
			researchReport.DataResearchReport.ResearchPurpose = req.ResearchPurpose
			researchReport.DataResearchReport.ResearchObject = req.ResearchObject
			researchReport.DataResearchReport.ResearchMethod = req.ResearchMethod
			researchReport.DataResearchReport.ResearchContent = req.ResearchContent
			researchReport.DataResearchReport.ResearchConclusion = req.ResearchConclusion
			researchReport.DataResearchReport.Remark = &req.Remark
			err = d.dataResearchReportRepo.Update(ctx, &researchReport.DataResearchReport)
			if err != nil {
				return nil, err
			}
		// 已申报暂存
		case *researchReport.DeclarationStatus == data_research_report_domain.Declarationed:
			// 先查询是否有变更内容
			changeAudit, err := d.dataResearchReportRepo.GetChangeAudit(ctx, researchReport.ID)
			if err != nil {
				return nil, err
			}
			// 如果有变更内容则更新，没有则创建
			if changeAudit != nil {
				researchReportChangeAudit := &model.DataResearchReportChangeAudit{
					ID:                 researchReport.ID,
					WorkOrderID:        req.WorkOrderID,
					ResearchPurpose:    req.ResearchPurpose,
					ResearchObject:     req.ResearchObject,
					ResearchMethod:     req.ResearchMethod,
					ResearchContent:    req.ResearchContent,
					ResearchConclusion: req.ResearchConclusion,
					Remark:             req.Remark,
					CreatedByUID:       userId,
					UpdatedByUID:       userId,
				}
				err = d.dataResearchReportRepo.UpdateChangeAudit(ctx, researchReportChangeAudit)
				if err != nil {
					return nil, err
				}
			} else {
				researchReportChangeAudit := &model.DataResearchReportChangeAudit{
					ID:                 researchReport.ID,
					WorkOrderID:        req.WorkOrderID,
					ResearchPurpose:    req.ResearchPurpose,
					ResearchObject:     req.ResearchObject,
					ResearchMethod:     req.ResearchMethod,
					ResearchContent:    req.ResearchContent,
					ResearchConclusion: req.ResearchConclusion,
					Remark:             req.Remark,
					CreatedByUID:       userId,
					UpdatedByUID:       userId,
				}
				err = d.dataResearchReportRepo.CreateChangeAudit(ctx, researchReportChangeAudit)
				if err != nil {
					return nil, err
				}
			}
			researchReport.AuditStatus = &data_research_report_domain.Undo
			err = d.dataResearchReportRepo.Update(ctx, &researchReport.DataResearchReport)
			if err != nil {
				return nil, err
			}
		}
	}
	return &data_research_report_domain.IDResp{UUID: researchReport.ID}, nil
}

func (d *DataResearchReport) GetById(ctx context.Context, id string) (*data_research_report_domain.DataResearchReportDetailResp, error) {
	researchReport, err := d.dataResearchReportRepo.GetById(ctx, id)
	if err != nil {
		return nil, err
	}
	changeAudit, err := d.dataResearchReportRepo.GetChangeAudit(ctx, id)
	if err != nil {
		return nil, err
	}
	return &data_research_report_domain.DataResearchReportDetailResp{
		DataResearchReportObject: data_research_report_domain.DataResearchReportObject{
			DataResearchReportObject: *researchReport,
			AuditStatusDisplay: func() string {
				if researchReport.AuditStatus != nil {
					return data_research_report_domain.AuditStatus2Str(*researchReport.AuditStatus)
				}
				return ""
			}(),
			DeclarationStatusDisplay: data_research_report_domain.DeclarationStatus2Str(*researchReport.DeclarationStatus),
		},
		ChangeAudit: changeAudit,
	}, nil
}

func (d *DataResearchReport) GetByWorkOrderId(ctx context.Context, id string) (*data_research_report_domain.DataResearchReportDetailResp, error) {
	researchReport, err := d.dataResearchReportRepo.GetByWorkOrderId(ctx, id)
	if err != nil {
		return nil, err
	}

	// 如果没有关联的调研报告，则返回空
	if researchReport.ID == "" {
		return &data_research_report_domain.DataResearchReportDetailResp{}, nil
	}

	// changeAudit, err := d.dataResearchReportRepo.GetChangeAudit(ctx, id)
	// if err != nil {
	// 	return nil, err
	// }
	return &data_research_report_domain.DataResearchReportDetailResp{
		DataResearchReportObject: data_research_report_domain.DataResearchReportObject{
			DataResearchReportObject: *researchReport,
			AuditStatusDisplay: func() string {
				if researchReport.AuditStatus != nil {
					return data_research_report_domain.AuditStatus2Str(*researchReport.AuditStatus)
				}
				return ""
			}(),
			DeclarationStatusDisplay: data_research_report_domain.DeclarationStatus2Str(*researchReport.DeclarationStatus),
		},
		// ChangeAudit: changeAudit,
	}, nil
}

func (d *DataResearchReport) GetList(ctx context.Context, req *data_research_report_domain.ResearchReportQueryParam) (*data_research_report_domain.DataResearchReportListResp, error) {
	var (
		err error
	)
	count, researchReportList, err := d.dataResearchReportRepo.List(ctx, req)
	if err != nil {
		return nil, err
	}
	result := make([]*data_research_report_domain.DataResearchReportObject, 0, len(researchReportList))
	for _, report := range researchReportList {
		result = append(result, &data_research_report_domain.DataResearchReportObject{
			DataResearchReportObject: *report,
			AuditStatusDisplay: func() string {
				if report.AuditStatus != nil {
					return data_research_report_domain.AuditStatus2Str(*report.AuditStatus)
				}
				return ""
			}(),
			DeclarationStatusDisplay: data_research_report_domain.DeclarationStatus2Str(*report.DeclarationStatus),
		})
	}
	return &data_research_report_domain.DataResearchReportListResp{PageResult: data_research_report_domain.PageResult[data_research_report_domain.DataResearchReportObject]{
		Entries:    result,
		TotalCount: count,
	}}, nil
}
