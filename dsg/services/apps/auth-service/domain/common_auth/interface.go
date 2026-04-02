package common_auth

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/auth-service/common/dto"
	auth_service_v1 "github.com/kweaver-ai/idrm-go-common/api/auth-service/v1"
	"github.com/kweaver-ai/idrm-go-common/rest/authorization"
)

/*
第二版，对接ISF权限系统后的接口
*/

type Auth interface {
	AuthManagement
	Enforcer
	CheckUserCreatePermission(ctx context.Context, arg *dto.Object, actions ...dto.Action) error
	CheckUserModifyPermission(ctx context.Context, arg *dto.Object, actions ...dto.Action) error
	ListPolicies(ctx context.Context, opt *auth_service_v1.PolicyListOptions) ([]auth_service_v1.Policy, error)
	PolicyWrite(ctx context.Context, policy dto.Policy) error
	PolicyUpdateInternal(ctx context.Context, req *dto.PolicyUpdateReq) error
	RemovePolicies(ctx context.Context, policies []dto.PolicyEnforce) error
}
type AuthManagement interface {
	//Create 创建规则
	Create(ctx context.Context, req *dto.PolicyCreateReq) (*authorization.CreatePolicyResp, error)
	//Update 更新规则
	Update(ctx context.Context, req *dto.PolicyUpdateReq) error
	//Delete 删除规则
	Delete(ctx context.Context, req *dto.PolicyDeleteReq) error
	//Get  获取某个资源的策略配置
	Get(ctx context.Context, req *dto.PolicyGetReq) (*dto.Policy, error)
}

type Enforcer interface {
	Enforce(ctx context.Context, reqs dto.PolicyEnforceReq) ([]bool, error)
	CurrentUserEnforce(ctx context.Context, req *dto.CurrentUserEnforce) (bool, error)
	GetObjectsBySubjectId(ctx context.Context, req *dto.GetObjectsBySubjectIdReq) (res *dto.GetObjectsBySubjectIdRes, err error)
	QueryPolicyExpiredObjects(ctx context.Context, req *dto.QueryPolicyExpiredObjectsArgs) ([]string, error)
	CheckUserPermission(ctx context.Context, req *dto.RulePolicyEnforce) (*dto.RulePolicyEnforceEffect, error)
	MenuResourceEnforce(ctx context.Context, r *dto.MenuResourceEnforceArg) (policyEnforceEffect *dto.MenuResourceEnforceEffect, err error)
	MenuResourceActions(ctx context.Context, req *dto.MenuResourceActionsArg) (resp *dto.MenuResourceActionsResp, err error)
	ListSubViews(ctx context.Context, request *dto.ListSubViewsReq) (*dto.ListSubViewsRes, error)
}
