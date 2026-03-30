package impl

import (
	"context"
	auth_service_v1 "github.com/kweaver-ai/idrm-go-common/api/auth-service/v1"

	"github.com/kweaver-ai/dsg/services/apps/auth-service/common/dto"
	"github.com/kweaver-ai/dsg/services/apps/auth-service/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/auth-service/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-common/rest/configuration_center"
	"github.com/kweaver-ai/idrm-go-common/rest/data_view"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/samber/lo"
)

func (u *useCaseImpl) GetViewBasicInfo(ctx context.Context, id string) (*data_view.ViewBasicInfo, error) {
	views, err := u.dataViewDriven.GetDataViewBasic(ctx, []string{id})
	if err != nil {
		return nil, err
	}
	if len(views) > 0 {
		return views[0], nil
	}
	return nil, errorcode.DWHAuthReqFormDataViewNotExistErr.Err()
}

// DeleteAuditPolicy 解绑审核策略
func (u *useCaseImpl) DeleteAuditPolicy(ctx context.Context, auditType string) error {
	if auditType == "" {
		return nil
	}
	args := &configuration_center.DeleteProcessBindByAuditTypeReq{
		AuditType: auditType,
	}
	return u.ccDriven.DeleteProcessBindByAuditType(ctx, args)
}

func (u *useCaseImpl) GetAuditPolicy(ctx context.Context, auditType string) (string, error) {
	result, err := u.ccDriven.GetProcessBindByAuditType(ctx, &configuration_center.GetProcessBindByAuditTypeReq{AuditType: auditType})
	if err != nil {
		return "", err
	}
	return result.ProcDefKey, err
}

func (u *useCaseImpl) getUserNameMap(ctx context.Context, forms []*model.TDwhAuthRequestForm) (map[string]string, error) {
	userIDSlice := lo.Uniq(lo.Times(len(forms), func(index int) string {
		return forms[index].Applicant
	}))
	userInfoMap, err := u.ccDriven.GetBaseUserByIds(ctx, userIDSlice)
	if err != nil {
		return nil, err
	}
	return lo.SliceToMap(userInfoMap, func(item *configuration_center.UserBase) (string, string) {
		return item.ID, item.Name
	}), nil
}

func (u *useCaseImpl) getApplicantName(ctx context.Context, applicant string) string {
	applicantName := ""
	applicantInfo, err := u.ccDriven.GetUserInfo(ctx, applicant)
	if err != nil {
		log.Warnf("Get.GetUserInfo error %v", err.Error())
	} else {
		applicantName = applicantInfo.Name
	}
	return applicantName
}

// getUserAuthSubviewInThisView 获取用户在当前库表有的子视图，用来下一步将这些权限全部删除
func (u *useCaseImpl) getUserAuthSubviewInThisView(ctx context.Context, userID, viewID string) ([]string, error) {
	subViewIDResp, err := u.dataViewDriven.GeSubViewByViews(ctx, []string{viewID})
	if err != nil {
		log.Warnf("Get.GeSubViewByViews error %v", err.Error())
		return nil, err
	}
	//过滤出有只读权限的
	subIDSlice := subViewIDResp[viewID]
	if len(subIDSlice) <= 0 {
		return make([]string, 0), nil
	}
	//只留下有一个读取权限的
	subIDSlice = lo.Filter(subIDSlice, func(item string, index int) bool {
		//查询用户的权限数量，是否有读取权限
		actionCount, hasRead, _ := u.checkSubViewActionCount(ctx, userID, subIDSlice[index])
		return actionCount == 1 && hasRead
	})
	return subIDSlice, nil
}

// checkIsUserMonopolyThisSubView 检查用户是否独占当前的子视图
// 如果当前用户的某个行列规则有其他权限，读取或者下载，那么则说该行规则不能修改，要新建一个，返回false
func (u *useCaseImpl) checkIsUserMonopolyThisSubView(ctx context.Context, userID, subViewID string) (bool, error) {
	actionCount, _, err := u.checkSubViewActionCount(ctx, userID, subViewID)
	if err != nil {
		log.Warnf("Get.checkSubViewHasSingleAction error %v", err.Error())
		return false, err
	}
	//如果用户有多个权限，不能覆盖修改，那么只能返回 false
	if actionCount > 1 {
		return false, nil
	}
	opts := &auth_service_v1.PolicyListOptions{
		Objects: []auth_service_v1.Object{
			{
				ID:   subViewID,
				Type: auth_service_v1.ObjectSubView,
			},
		},
	}
	policies, err := u.auth.ListPolicies(ctx, opts)
	if err != nil {
		log.Warnf("Get.ListPolicies error %v", err.Error())
		return false, err
	}
	if len(policies) <= 0 {
		return true, nil
	}
	for _, policy := range policies {
		if policy.Subject.ID != userID && policy.Action.Str() == dto.ActionRead.Str() {
			return false, nil
		}
	}
	return true, nil
}

// exitUserFromSubViews 将当前用户的子视图的读取权限退出
func (u *useCaseImpl) exitUserFromSubViews(ctx context.Context, userID string, subViewSlice []string) error {
	args := make([]dto.PolicyEnforce, 0)
	for _, subview := range subViewSlice {
		args = append(args, dto.PolicyEnforce{
			ObjectId:    subview,
			ObjectType:  string(auth_service_v1.ObjectSubView),
			SubjectId:   userID,
			SubjectType: string(auth_service_v1.SubjectUser),
			Action:      dto.ActionRead.Str(),
		})
	}
	if err := u.auth.RemovePolicies(ctx, args); err != nil {
		return err
	}
	return nil
}

// checkSubViewActionCount  检查当前用户对视图行列规则拥有的权限的数量
func (u *useCaseImpl) checkSubViewActionCount(ctx context.Context, userID, subViewID string) (int, bool, error) {
	actions := []string{dto.ActionRead.Str(), dto.ActionDownload.Str(), dto.ActionAllocate.Str(), dto.ActionAuth.Str()}
	var policyEnforces dto.PolicyEnforceReq = lo.Times(len(actions), func(index int) dto.PolicyEnforce {
		return dto.PolicyEnforce{
			ObjectId:    subViewID,
			ObjectType:  string(auth_service_v1.ObjectSubView),
			SubjectId:   userID,
			SubjectType: string(auth_service_v1.SubjectUser),
			Action:      actions[index],
		}
	})
	enforceResult, err := u.auth.Enforce(ctx, &policyEnforces, &dto.PolicyEnforceCheck{SkipRoleCheck: true})
	if err != nil {
		log.Warnf("Get.Enforce error %v", err.Error())
		return 0, false, err
	}
	hasRead := false
	authedCount := lo.CountBy(*enforceResult, func(item dto.PolicyEnforceEffect) bool {
		if item.Effect == dto.EftAllow && item.Action == dto.ActionRead.Str() {
			hasRead = true
		}
		return item.Effect == dto.EftAllow
	})
	return authedCount, hasRead, nil
}
