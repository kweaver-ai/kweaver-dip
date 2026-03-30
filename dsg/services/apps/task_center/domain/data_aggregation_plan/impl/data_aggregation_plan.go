package impl

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"strconv"
	"strings"
	"time"

	model_plan "github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/gorm/data_aggregation_plan"
	"github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/workflow"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/errorcode"
	domain_plan "github.com/kweaver-ai/dsg/services/apps/task_center/domain/data_aggregation_plan"
	"github.com/kweaver-ai/dsg/services/apps/task_center/domain/user"
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

type DataAggregationPlan struct {
	aggregationPlanRepo model_plan.DataAggregatioPlanRepo
	userDomain          user.IUser
	wf                  wf_go.WorkflowInterface
	wfRest              workflow.WorkflowInterface
	ccDriven            configuration_center.Driven
}

func NewDataComprehensionPlan(
	aggregationPlanRepo model_plan.DataAggregatioPlanRepo,
	userDomain user.IUser,
	wf wf_go.WorkflowInterface,
	wfRest workflow.WorkflowInterface,
	ccDriven configuration_center.Driven,
) domain_plan.DataAggregationPlan {
	d := &DataAggregationPlan{
		aggregationPlanRepo: aggregationPlanRepo,
		userDomain:          userDomain,
		wf:                  wf,
		wfRest:              wfRest,
		ccDriven:            ccDriven,
	}
	wf.RegistConusmeHandlers(workflow.AF_TASKS_DATA_AGGREGATOPM_PLAN, d.DataAggregationPlanAuditProcessMsgProc,
		d.DataAggregationPlanAuditResultMsgProc, nil)
	return d
}

func (d *DataAggregationPlan) Create(ctx context.Context, req *domain_plan.AggregationPlanCreateReq, userId, userName string) (*domain_plan.IDResp, error) {
	var (
		err            error
		bIsAuditNeeded bool
	)
	//  检查同名冲突
	err = d.CheckNameRepeat(ctx, &domain_plan.AggregationPlanNameRepeatReq{Name: req.Name})
	if err != nil {
		return nil, err
	}

	uniqueID, err := utilities.GetUniqueID()
	if err != nil {
		return nil, errorcode.Detail(errorcode.InternalError, err)
	}
	modelPlan := req.ToModel(userId, uniqueID)
	// 如果是提交
	if req.NeedDeclaration {
		// 判断是否有审核流程
		auditBindInfo, err := d.ccDriven.GetProcessBindByAuditType(ctx, &configuration_center.GetProcessBindByAuditTypeReq{AuditType: workflow.AF_TASKS_DATA_AGGREGATOPM_PLAN})
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
			msg := &wf_common.AuditApplyMsg{
				Process: wf_common.AuditApplyProcessInfo{
					ApplyID:    GenAuditApplyID(uniqueID, auditRecID),
					AuditType:  workflow.AF_TASKS_DATA_AGGREGATOPM_PLAN,
					UserID:     userId,
					UserName:   userName,
					ProcDefKey: auditBindInfo.ProcDefKey,
				},
				Data: map[string]any{
					"id":          modelPlan.ID,
					"title":       req.Name,
					"submit_time": time.Now().UnixMilli(),
				},
				Workflow: wf_common.AuditApplyWorkflowInfo{
					TopCsf: 5,
					AbstractInfo: wf_common.AuditApplyAbstractInfo{
						Icon: AUDIT_ICON_BASE64,
						Text: "数据归集计划名称：" + req.Name,
					},
				},
			}
			if err := d.wf.AuditApply(msg); err != nil {
				log.WithContext(ctx).Errorf("send start audit instance message error %v", err)
				return nil, errorcode.Detail(errorcode.InternalError, err)
			}
			modelPlan.AuditStatus = &domain_plan.Auditing //审核中
			modelPlan.AuditID = &auditRecID               //  审核记录id
		} else {
			modelPlan.AuditStatus = &domain_plan.Pass //审核通过
		}
	}
	err = d.aggregationPlanRepo.Create(ctx, modelPlan)
	if err != nil {
		return nil, err
	}
	return &domain_plan.IDResp{UUID: modelPlan.ID}, nil
}

func (d *DataAggregationPlan) Delete(ctx context.Context, id string) error {
	var (
		err error
	)
	//  检查是否存在
	modelPlan, err := d.aggregationPlanRepo.GetById(ctx, id)
	if err != nil {
		return err
	}

	// 审核处于审核中的(撤回的,拒绝,驳回的可以删除), 状态为已经申报的,不可以删除
	if (modelPlan.AuditStatus != nil && *modelPlan.AuditStatus == domain_plan.Auditing) || *modelPlan.Status == domain_plan.Completed {
		return errorcode.Desc(errorcode.PlanDeleteError)
	}

	err = d.aggregationPlanRepo.Delete(ctx, id)
	if err != nil {
		return err
	}
	return nil
}

func (d *DataAggregationPlan) Update(ctx context.Context, req *domain_plan.AggregationPlanUpdateReq, id, userId, userName string) (*domain_plan.IDResp, error) {
	var (
		err            error
		bIsAuditNeeded bool
	)
	//  检查是否存在
	modelPlan, err := d.aggregationPlanRepo.GetById(ctx, id)
	if err != nil {
		return nil, err
	}
	//  检查同名冲突 todo
	err = d.CheckNameRepeat(ctx, &domain_plan.AggregationPlanNameRepeatReq{Name: req.Name, Id: id})
	if err != nil {
		return nil, err
	}

	// 审核处于审核中的(撤回的,拒绝,驳回的的可以编辑), 状态为完成的,不可以编辑
	if (modelPlan.AuditStatus != nil && *modelPlan.AuditStatus == domain_plan.Auditing) || *modelPlan.Status == domain_plan.Completed {
		return nil, errorcode.Desc(errorcode.PlanEditError)
	}

	if req.NeedDeclaration {
		// 判断是否有审核流程
		auditBindInfo, err := d.ccDriven.GetProcessBindByAuditType(ctx, &configuration_center.GetProcessBindByAuditTypeReq{AuditType: workflow.AF_TASKS_DATA_AGGREGATOPM_PLAN})
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
			msg := &wf_common.AuditApplyMsg{
				Process: wf_common.AuditApplyProcessInfo{
					ApplyID:    GenAuditApplyID(modelPlan.DataAggregationPlanID, auditRecID),
					AuditType:  workflow.AF_TASKS_DATA_AGGREGATOPM_PLAN,
					UserID:     userId,
					UserName:   userName,
					ProcDefKey: auditBindInfo.ProcDefKey,
				},
				Data: map[string]any{
					"id":          modelPlan.ID,
					"title":       req.Name,
					"submit_time": time.Now().UnixMilli(),
				},
				Workflow: wf_common.AuditApplyWorkflowInfo{
					TopCsf: 5,
					AbstractInfo: wf_common.AuditApplyAbstractInfo{
						Icon: AUDIT_ICON_BASE64,
						Text: "数据归集计划名称：" + req.Name,
					},
				},
			}
			if err := d.wf.AuditApply(msg); err != nil {
				log.WithContext(ctx).Errorf("send start audit instance message error %v", err)
				return nil, errorcode.Detail(errorcode.InternalError, err)
			}
			modelPlan.AuditStatus = &domain_plan.Auditing //审核中
			modelPlan.AuditID = &auditRecID               //  审核记录id
		} else {
			modelPlan.AuditStatus = &domain_plan.Pass //审核通过
		}
	}
	modelPlan.Name = req.Name
	modelPlan.ResponsibleUID = req.ResponsibleUID
	modelPlan.Priority = req.Priority
	modelPlan.StartedAt = sql.NullInt64{Int64: req.StartedAt, Valid: true}
	modelPlan.FinishedAt = sql.NullInt64{Int64: req.FinishedAt, Valid: true}
	modelPlan.Content = req.Content
	modelPlan.Opinion = &req.Opinion
	if req.AutoStart {
		var autoStart int8 = 1
		modelPlan.AutoStart = &autoStart
	} else {
		var autoStart int8 = 0
		modelPlan.AutoStart = &autoStart
	}
	err = d.aggregationPlanRepo.Update(ctx, modelPlan)
	if err != nil {
		return nil, err
	}
	return &domain_plan.IDResp{UUID: modelPlan.ID}, nil
}

func (d *DataAggregationPlan) GetById(ctx context.Context, id string) (*domain_plan.AggregationPlanGetByIdReq, error) {
	modelPlan, err := d.aggregationPlanRepo.GetById(ctx, id)
	if err != nil {
		return nil, err
	}
	return &domain_plan.AggregationPlanGetByIdReq{
		Name:             modelPlan.Name,
		ResponsibleUID:   modelPlan.ResponsibleUID,
		ResponsibleUName: d.userDomain.GetNameByUserId(ctx, modelPlan.ResponsibleUID),
		PriorityId:       modelPlan.Priority,
		// Priority:         domain_plan.PriorityStatus2Str(modelPlan.Priority),
		Status:        domain_plan.Status2Str(*modelPlan.Status),
		Priority:      modelPlan.Priority,
		StartedAt:     modelPlan.StartedAt.Int64,
		FinishedAt:    modelPlan.FinishedAt.Int64,
		Content:       modelPlan.Content,
		Opinion:       *modelPlan.Opinion,
		AutoStart:     *modelPlan.AutoStart == 1,
		CreatedAt:     modelPlan.CreatedAt.UnixMilli(),
		CreatedByUser: d.userDomain.GetNameByUserId(ctx, modelPlan.CreatedByUID),
		UpdatedAt:     modelPlan.UpdatedAt.UnixMilli(),
		UpdatedByUser: d.userDomain.GetNameByUserId(ctx, modelPlan.UpdatedByUID),
	}, nil
}

func (d *DataAggregationPlan) List(ctx context.Context, query *domain_plan.AggregationPlanQueryParam) (*domain_plan.AggregationPlanListResp, error) {
	totalCount, modelPlans, err := d.aggregationPlanRepo.List(ctx, *query)
	if err != nil {
		return nil, err
	}
	resp := &domain_plan.AggregationPlanListResp{}
	resp.TotalCount = totalCount
	resp.Entries = make([]*domain_plan.AggregationPlanItem, 0, len(modelPlans))
	for i := range modelPlans {
		var auditStatus, rejectReason, auditApplyID string
		if modelPlans[i].AuditStatus != nil {
			auditStatus = domain_plan.AuditStatus2Str(*modelPlans[i].AuditStatus)
			if *modelPlans[i].AuditStatus == domain_plan.Auditing && modelPlans[i].AuditID != nil {
				auditApplyID = fmt.Sprintf("%d-%d", modelPlans[i].DataAggregationPlanID, *modelPlans[i].AuditID)
			}
		}
		if modelPlans[i].RejectReason != nil && *modelPlans[i].RejectReason != "default_comment" {
			rejectReason = *modelPlans[i].RejectReason
		}
		resp.Entries = append(resp.Entries,
			&domain_plan.AggregationPlanItem{
				ID:                modelPlans[i].ID,
				Name:              modelPlans[i].Name,
				Content:           modelPlans[i].Content,
				ResponsiblePerson: d.userDomain.GetNameByUserId(ctx, modelPlans[i].ResponsibleUID),
				AuditStatus:       auditStatus,
				RejectReason:      rejectReason,
				Status:            domain_plan.Status2Str(*modelPlans[i].Status),
				Priority:          modelPlans[i].Priority,
				StartedAt:         modelPlans[i].StartedAt.Int64,
				FinishedAt:        modelPlans[i].FinishedAt.Int64,
				CreatedAt:         modelPlans[i].CreatedAt.UnixMilli(),
				AuditApplyID:      auditApplyID,
			},
		)
	}
	return resp, nil
}

func (d *DataAggregationPlan) CheckNameRepeat(ctx context.Context, req *domain_plan.AggregationPlanNameRepeatReq) error {
	exist, err := d.aggregationPlanRepo.CheckNameRepeat(ctx, req.Id, req.Name)
	if err != nil {
		return errorcode.Detail(errorcode.PlanDatabaseError, err.Error())
	}
	if exist {
		return errorcode.Desc(errorcode.PlanNameRepeatError)
	}
	return nil
}

func GenAuditApplyID(ID uint64, auditRecID uint64) string {
	return fmt.Sprintf("%d-%d", ID, auditRecID)
}

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

func (d *DataAggregationPlan) UpdateStatus(ctx context.Context, id string, req *domain_plan.ComprehensionPlanUpdateStatusReq, userId string) (*domain_plan.IDResp, error) {
	modelPlan, err := d.aggregationPlanRepo.GetById(ctx, id)
	if err != nil {
		return nil, err
	}

	status := domain_plan.Str2Status2(req.Status)
	modelPlan.Status = &status

	err = d.aggregationPlanRepo.Update(ctx, modelPlan)
	if err != nil {
		return nil, err
	}

	return &domain_plan.IDResp{UUID: modelPlan.ID}, nil
}
