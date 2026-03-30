package impl

import (
	"context"
	"encoding/json"

	"github.com/kweaver-ai/dsg/services/apps/auth-service/adapter/driven/gorm"
	"github.com/kweaver-ai/dsg/services/apps/auth-service/adapter/driven/microservice"
	"github.com/kweaver-ai/dsg/services/apps/auth-service/common/constant"
	"github.com/kweaver-ai/dsg/services/apps/auth-service/common/dto"
	"github.com/kweaver-ai/dsg/services/apps/auth-service/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/auth-service/domain/common_auth"
	"github.com/kweaver-ai/dsg/services/apps/auth-service/domain/dwh_data_auth_request"
	"github.com/kweaver-ai/dsg/services/apps/auth-service/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-common/rest/configuration_center"
	"github.com/kweaver-ai/idrm-go-common/rest/data_view"
	wf_rest "github.com/kweaver-ai/idrm-go-common/rest/workflow"
	"github.com/kweaver-ai/idrm-go-common/util"
	"github.com/kweaver-ai/idrm-go-common/workflow"
	"github.com/kweaver-ai/idrm-go-common/workflow/common"
	"github.com/kweaver-ai/idrm-go-frame/core/errorx"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/samber/lo"
	"go.uber.org/zap"
)

type useCaseImpl struct {
	repo           gorm.DataAuthRequestFormRepo
	workflow       workflow.WorkflowInterface
	ccDriven       configuration_center.Driven
	dataViewDriven data_view.Driven
	dataViewLocal  microservice.DataViewRepo
	wfDriven       wf_rest.WorkflowDriven
	auth           common_auth.Auth
}

func NewUseCase(
	repo gorm.DataAuthRequestFormRepo,
	wf workflow.WorkflowInterface,
	ccDriven configuration_center.Driven,
	dataViewDriven data_view.Driven,
	dataViewLocal microservice.DataViewRepo,
	wfDriven wf_rest.WorkflowDriven,
	auth common_auth.Auth,
) dwh_data_auth_request.UseCase {
	return &useCaseImpl{
		repo:           repo,
		workflow:       wf,
		ccDriven:       ccDriven,
		dataViewDriven: dataViewDriven,
		dataViewLocal:  dataViewLocal,
		wfDriven:       wfDriven,
		auth:           auth,
	}
}

// Create 创建数仓数据申请
func (u *useCaseImpl) Create(ctx context.Context, req *dto.DataAuthRequestArg) (string, error) {
	//检查，已经有的申请单，不能新建，只能修改
	formApplyInfo, err := u.repo.GetUserApplicationForm(ctx, req.DataID)
	if err != nil {
		return "", err
	}
	if formApplyInfo != nil {
		return "", errorcode.DWHAuthReqFormDuplicatedErr.Err()
	}
	//生成消息
	applyFormDetail, err := u.fixCreateApplyMsgInfo(ctx, req)
	if err != nil {
		return "", err
	}
	//发送审核
	if err = u.AuditObjectApply(ctx, applyFormDetail); err != nil {
		return "", err
	}
	return applyFormDetail.ID, nil
}

func (u *useCaseImpl) Update(ctx context.Context, req *dto.DataAuthRequestArg) (string, error) {
	//检查状态，已经在审核中的不能修改
	formApplyInfo, err := u.repo.Get(ctx, req.ID)
	if err != nil {
		if errorx.Is(err, gorm.ErrNotFound) {
			return "", errorcode.PublicResourceNotExistErr.Err()
		}
		return "", errorcode.PublicDatabaseErr.Detail(err.Error())
	}
	if formApplyInfo.Phase == constant.AUDIT_AUDITING {
		return "", errorcode.PublicDataAuditingErr.Err()
	}
	////如果仅仅是修改了名称，则不需要发送审核
	//formSpec, err := u.repo.GetAuthReqSpec(ctx, req.ID)
	//if err != nil {
	//	return "", err
	//}

	//生成消息
	applyFormDetail, err := u.fixUpdateApplyMsgInfo(ctx, req)
	if err != nil {
		return "", err
	}

	//if !req.IsAuditDataChanged(formSpec) {
	//	formApplyInfo.TDwhAuthRequestForm.Name = req.Name
	//	formApplyInfo.DataBusinessName = applyFormDetail.DataBusinessName
	//	if err = u.repo.UpdateRequestFormName(ctx, &formApplyInfo.TDwhAuthRequestForm); err != nil {
	//		return "", err
	//	}
	//}

	//发送审核
	if err = u.AuditObjectApply(ctx, applyFormDetail); err != nil {
		return "", err
	}
	return applyFormDetail.ID, nil
}

// Delete  删除申请单，保留权限
func (u *useCaseImpl) Delete(ctx context.Context, id string) error {
	return u.repo.Delete(ctx, id)
}

func (u *useCaseImpl) Get(ctx context.Context, id string) (*dto.DataAuthFormDetail, error) {
	applyFormInfo, err := u.repo.Get(ctx, id)
	if err != nil {
		if errorx.Is(err, gorm.ErrNotFound) {
			return nil, errorcode.PublicResourceNotExistErr.Err()
		}
		return nil, errorcode.PublicInternalErr.Detail(err.Error())
	}
	//查询申请人信息
	applicantName := u.getApplicantName(ctx, applyFormInfo.Applicant)
	applyFormDetail := &dto.DataAuthFormDetail{
		DataAuthFormListItem: newDataAuthFormListItem(&applyFormInfo.TDwhAuthRequestForm, applicantName),
		ExpiredAt:            applyFormInfo.TDwhAuthRequestSpec.ExpiredAt,
		Spec:                 applyFormInfo.TDwhAuthRequestSpec.Spec,
		RequestType:          applyFormInfo.TDwhAuthRequestSpec.RequestType,
		DraftRequestType:     applyFormInfo.TDwhAuthRequestSpec.DraftRequestType,
		DraftSpec:            applyFormInfo.TDwhAuthRequestSpec.DraftSpec,
		DraftExpiredAt:       applyFormInfo.TDwhAuthRequestSpec.DraftExpiredAt,
		SubView:              newDataAuthFormSubView(applyFormInfo),
	}
	return applyFormDetail, nil
}

func (u *useCaseImpl) List(ctx context.Context, args *dto.DataAuthRequestListArgs) (*dto.PageResult[dto.DataAuthFormListItem], error) {
	if args.Applicant == "" {
		//查询申请人信息
		applicantInfo, err := util.GetUserInfo(ctx)
		if err != nil {
			return nil, err
		}
		args.Applicant = applicantInfo.ID
	}
	total, forms, err := u.repo.List(ctx, args)
	if err != nil {
		return nil, errorcode.PublicDatabaseErr.Detail(err)
	}
	userNameDict, err := u.getUserNameMap(ctx, forms)
	if err != nil {
		log.Warnf("getUserInfoMap error %v", err.Error())
		userNameDict = make(map[string]string)
	}
	pageObjs := lo.Times(len(forms), func(index int) *dto.DataAuthFormListItem {
		return lo.ToPtr(newDataAuthFormListItem(forms[index], userNameDict[forms[index].Applicant]))
	})
	return &dto.PageResult[dto.DataAuthFormListItem]{
		TotalCount: total,
		Entries:    pageObjs,
	}, nil
}

// ListUserData 查询用户的数据权限申请单状态
func (u *useCaseImpl) ListUserData(ctx context.Context, args *dto.UserDataAuthRequestListArgs) ([]*dto.UserDataAuthFormListItem, error) {
	if args.DataID == "" {
		return make([]*dto.UserDataAuthFormListItem, 0), nil
	}
	//查询申请单
	forms, err := u.repo.ListUserAuthForm(ctx, args)
	if err != nil {
		return nil, err
	}
	//返回想要的结构
	return lo.Times(len(forms), func(index int) *dto.UserDataAuthFormListItem {
		return &dto.UserDataAuthFormListItem{
			DataID: forms[index].DataID,
			RequestForm: &dto.DataAuthFormSimple{
				ID:    forms[index].ID,
				Name:  forms[index].Name,
				Phase: forms[index].Phase,
			},
		}
	}), nil
}

func (u *useCaseImpl) AuditList(ctx context.Context, req *dto.AuditListReq) (*dto.PageResult[dto.DataAuthReqFormAuditListItem], error) {
	auditTypes := []string{constant.DWHDataAuthRequestForm}
	audits, err := u.wfDriven.GetAuditList(ctx, wf_rest.WorkflowListType(req.Target), auditTypes, req.Offset, req.Limit)
	if err != nil {
		log.WithContext(ctx).Errorf("uc.workflow.GetAuditList failed: %v", err)
		return nil, errorcode.PublicInternalErr.Detail(err.Error())
	}
	resp := &dto.PageResult[dto.DataAuthReqFormAuditListItem]{
		TotalCount: int(audits.TotalCount),
		Entries:    make([]*dto.DataAuthReqFormAuditListItem, 0),
	}
	if len(audits.Entries) <= 0 {
		return resp, nil
	}
	for i := range audits.Entries {
		auditObj := audits.Entries[i]
		applyDetail := &auditObj.ApplyDetail
		data := &dto.DataAuthReqFormAuditListItem{
			ID:               applyDetail.StrValue("id"),
			Name:             applyDetail.StrValue("name"),
			DataID:           applyDetail.StrValue("data_id"),
			DataBusinessName: applyDetail.StrValue("data_business_name"),
			DataTechName:     applyDetail.StrValue("data_tech_name"),
			AuditCommonInfo: dto.AuditCommonInfo{
				ApplyID:       auditObj.ApplyDetail.Process.ApplyID,
				BizType:       auditObj.BizType,
				AuditStatus:   auditObj.AuditStatus,
				Applicant:     applyDetail.Process.UserID,
				ApplicantName: applyDetail.Process.UserName,
				ProcInstID:    auditObj.ID,
				ApplyTime:     applyDetail.StrValue("apply_time"),
			},
		}
		resp.Entries = append(resp.Entries, data)
	}
	return resp, nil
}

func (u *useCaseImpl) Cancel(ctx context.Context, id string) (err error) {
	//1. 检查没有没有取消记录，不可重复取消
	authRequestFormInfo, err := u.repo.GetAuthReqForm(ctx, id)
	if err != nil {
		return err
	}
	//只有审核中的能撤销，其他的情况无法撤销
	if authRequestFormInfo.Phase != constant.AUDIT_AUDITING {
		return errorcode.DWHAuthReqInvalidCancelErr.Err()
	}
	log.Infof("AuditCancel Meesageg: %v", string(lo.T2(json.Marshal(authRequestFormInfo)).A))
	//2. 调用workflow取消审核
	msg := common.GenNormalCancelMsg(authRequestFormInfo.ApplyID)
	if err = u.workflow.AuditCancel(msg); err != nil {
		return errorcode.DWHAuthReqCancelErr.Detail(err.Error())
	}
	//3. 更新状态
	updateBody := &model.TDwhAuthRequestForm{
		ID:      id,
		Phase:   constant.AUDIT_UNDONE,
		Message: "已撤回审核",
	}
	if err = u.repo.UpdateRequestPhaseAndMsg(ctx, updateBody); err != nil {
		return errorcode.DWHAuthReqCancelErr.Detail(err.Error())
	}
	return nil
}

func (u *useCaseImpl) TestAuditMsg(ctx context.Context, args *dto.TestAuditMsgReq) error {
	//生成或更新行列规则,添加授权
	authReqDetail, err := u.Get(ctx, args.ID)
	if err != nil {
		log.Error("get auth request detail error: ", zap.Error(err))
		return err
	}
	return u.UpsertUserMonopolySubView(ctx, authReqDetail)
}
