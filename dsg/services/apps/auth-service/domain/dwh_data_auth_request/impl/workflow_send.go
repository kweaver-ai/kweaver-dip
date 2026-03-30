package impl

import (
	"context"
	"github.com/google/uuid"
	"github.com/kweaver-ai/dsg/services/apps/auth-service/common/constant"
	"github.com/kweaver-ai/dsg/services/apps/auth-service/common/dto"
	"github.com/kweaver-ai/dsg/services/apps/auth-service/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-common/errorcode"
	"github.com/kweaver-ai/idrm-go-common/util"
	workflow_common "github.com/kweaver-ai/idrm-go-common/workflow/common"
	"time"
)

// fixCreateApplyMsgInfo 补充申请单信息
func (u *useCaseImpl) fixCreateApplyMsgInfo(ctx context.Context, req *dto.DataAuthRequestArg) (*dto.DataAuthFormDetail, error) {
	//查询申请人信息
	applicantInfo, err := util.GetUserInfo(ctx)
	if err != nil {
		return nil, err
	}
	//查询视图信息
	viewBasicInfo, err := u.GetViewBasicInfo(ctx, req.DataID)
	if err != nil {
		return nil, err
	}
	//补齐子视图数据
	req.SubView.Spec = &dto.SubViewSpec{
		Name:        genSubViewName(viewBasicInfo.BusinessName, applicantInfo.Name),
		Detail:      req.Spec,
		AuthScopeID: viewBasicInfo.Id,
		LogicViewID: viewBasicInfo.Id,
	}
	req.SubView.Policies = []dto.SubjectPolicy{
		{
			SubjectType: dto.SubjectUser,
			SubjectID:   applicantInfo.ID,
			Actions:     []dto.Action{dto.ActionRead},
			ExpiredAt:   timestampToExpiredAt(req.ExpiredAt),
		},
	}

	//补齐数据
	id := uuid.New().String()
	formDataDetail := &dto.DataAuthFormDetail{
		ExpiredAt:   req.ExpiredAt,
		Spec:        req.Spec,
		RequestType: req.RequestType,
		DataAuthFormListItem: dto.DataAuthFormListItem{
			DataAuthRequestBasic: dto.DataAuthRequestBasic{
				ID:               id,
				Name:             req.Name,
				DataID:           req.DataID,
				DataBusinessName: viewBasicInfo.BusinessName,
				DataTechName:     viewBasicInfo.TechnicalName,
				Applicant:        applicantInfo.ID,
				ApplicantName:    applicantInfo.Name,
				ApplyTime:        time.Now().UnixMilli(),
			},
			Status: dto.DataAuthRequestStatus{
				Phase:   constant.AUDIT_AUDITING,
				ApplyID: genApplyID(id),
			},
		},
		SubView: req.SubView,
	}
	return formDataDetail, nil
}

// fixCreateApplyMsgInfo 补充申请单信息, 更新修改的只能是数据范围和名称，其他的不能动
func (u *useCaseImpl) fixUpdateApplyMsgInfo(ctx context.Context, req *dto.DataAuthRequestArg) (*dto.DataAuthFormDetail, error) {
	applyFormInfo, err := u.Get(ctx, req.ID)
	if err != nil {
		return nil, err
	}
	//查询视图信息
	viewBasicInfo, err := u.GetViewBasicInfo(ctx, req.DataID)
	if err != nil {
		return nil, err
	}
	//补齐子视图数据
	req.SubView.ID = applyFormInfo.SubView.ID
	req.SubView.Spec = &dto.SubViewSpec{
		Name:        applyFormInfo.SubView.Spec.Name,
		Detail:      req.Spec,
		AuthScopeID: viewBasicInfo.Id,
		LogicViewID: viewBasicInfo.Id,
	}
	req.SubView.Policies = []dto.SubjectPolicy{
		{
			SubjectType: dto.SubjectUser,
			SubjectID:   applyFormInfo.Applicant,
			Actions:     []dto.Action{dto.ActionRead},
			ExpiredAt:   timestampToExpiredAt(req.ExpiredAt),
		},
	}
	//补齐数据
	formDataDetail := &dto.DataAuthFormDetail{
		ExpiredAt:   req.ExpiredAt,
		Spec:        req.Spec,
		RequestType: req.RequestType,
		DataAuthFormListItem: dto.DataAuthFormListItem{
			DataAuthRequestBasic: dto.DataAuthRequestBasic{
				ID:               req.ID,
				Name:             req.Name,
				DataID:           applyFormInfo.DataID,
				DataBusinessName: viewBasicInfo.BusinessName,
				DataTechName:     viewBasicInfo.TechnicalName,
				Applicant:        applyFormInfo.Applicant,
				ApplicantName:    applyFormInfo.ApplicantName,
				ApplyTime:        time.Now().UnixMilli(),
			},
			Status: dto.DataAuthRequestStatus{
				Phase:   constant.AUDIT_AUDITING,
				ApplyID: genApplyID(req.ID),
			},
		},
		SubView: req.SubView,
	}
	return formDataDetail, nil
}

func (u *useCaseImpl) auditMsgGenerator(applyFormDetail *dto.DataAuthFormDetail) *workflow_common.AuditApplyMsg {
	msg := &workflow_common.AuditApplyMsg{
		Process: workflow_common.AuditApplyProcessInfo{
			AuditType:  constant.DWHDataAuthRequestForm,
			ApplyID:    genApplyID(applyFormDetail.ID),
			UserID:     applyFormDetail.Applicant,
			UserName:   applyFormDetail.ApplicantName,
			ProcDefKey: "", //外面赋值
		},
		Data: map[string]any{
			"id":                 applyFormDetail.ID,
			"name":               applyFormDetail.Name,
			"data_id":            applyFormDetail.DataID,
			"data_business_name": applyFormDetail.DataBusinessName,
			"data_tech_name":     applyFormDetail.DataTechName,
			"apply_time":         time.UnixMilli(applyFormDetail.ApplyTime).Format(time.DateTime),
		},
		Workflow: workflow_common.AuditApplyWorkflowInfo{
			TopCsf: 5,
			AbstractInfo: workflow_common.AuditApplyAbstractInfo{
				Icon: constant.AuditIconBase64,
				Text: "库表名称：" + applyFormDetail.DataBusinessName,
			},
			Webhooks: []workflow_common.Webhook{},
		},
	}
	return msg
}

// AuditObjectApply 发送审核，保存状态
func (u *useCaseImpl) AuditObjectApply(ctx context.Context, applyFormDetail *dto.DataAuthFormDetail) error {
	auditMsg := u.auditMsgGenerator(applyFormDetail)
	//查询审核策略
	procDefKey, err := u.GetAuditPolicy(ctx, auditMsg.Process.AuditType)
	if err != nil {
		return err
	}
	//没有审核策略直接报错
	if procDefKey == "" {
		return errorcode.AuditProcessNotExistErr.Err()
	}
	//设置审核的key
	auditMsg.Process.ProcDefKey = procDefKey
	//发送消息
	if err = u.workflow.AuditApply(auditMsg); err != nil {
		return errorcode.AuditMsgSendErr.Detail(err.Error())
	}
	//获取返回的审核属性
	applyFormDetail.Status.ApplyID = auditMsg.Process.ApplyID
	applyFormDetail.Status.Phase = constant.AUDIT_AUDITING
	applyFormDetail.Status.ProcDefKey = procDefKey
	//发送审核后保存信息
	return u.saveAfterSendAuditMsg(ctx, applyFormDetail)
}

// AfterSendAuditMsgHandler  审核执行完的动作，保存或者更新
func (u *useCaseImpl) saveAfterSendAuditMsg(ctx context.Context, applyFormDetail *dto.DataAuthFormDetail) error {
	formModel := &model.TDwhAuthRequestForm{
		ID:               applyFormDetail.ID,
		Name:             applyFormDetail.Name,
		Applicant:        applyFormDetail.Applicant,
		ApplyTime:        applyFormDetail.ApplyTime,
		DataID:           applyFormDetail.DataID,
		DataTechName:     applyFormDetail.DataTechName,
		DataBusinessName: applyFormDetail.DataBusinessName,
		ApplyID:          applyFormDetail.Status.ApplyID,
		Phase:            applyFormDetail.Status.Phase,
		ProcDefKey:       applyFormDetail.Status.ProcDefKey,
	}
	spec := model.TDwhAuthRequestSpec{
		ID:            applyFormDetail.SubView.ID,
		Name:          applyFormDetail.SubView.Spec.Name,
		RequestFormID: applyFormDetail.ID,
	}
	//更新的，先保存草稿
	if applyFormDetail.SubView.ID != "" {
		spec.DraftRequestType = applyFormDetail.RequestType
		spec.DraftSpec = applyFormDetail.Spec
		spec.DraftExpiredAt = applyFormDetail.ExpiredAt
	} else {
		spec.RequestType = applyFormDetail.RequestType
		spec.Spec = applyFormDetail.Spec
		spec.ExpiredAt = applyFormDetail.ExpiredAt
	}
	formModelAssociate := &model.DwhAuthRequestFormAssociations{
		TDwhAuthRequestForm: *formModel,
		TDwhAuthRequestSpec: spec,
	}
	return u.repo.UpsertBeforeAudit(ctx, formModelAssociate)
}
