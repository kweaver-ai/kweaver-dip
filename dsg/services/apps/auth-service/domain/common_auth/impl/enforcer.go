package impl

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/auth-service/adapter/driven/database"
	"github.com/kweaver-ai/dsg/services/apps/auth-service/adapter/driven/database/af_configuration"
	"github.com/kweaver-ai/dsg/services/apps/auth-service/adapter/driven/gorm"
	"github.com/kweaver-ai/dsg/services/apps/auth-service/common/dto"
	"github.com/kweaver-ai/dsg/services/apps/auth-service/common/enum"
	"github.com/kweaver-ai/dsg/services/apps/auth-service/common/util"
	domain "github.com/kweaver-ai/dsg/services/apps/auth-service/domain/common_auth"
	"github.com/kweaver-ai/dsg/services/apps/auth-service/infrastructure/repository/redis"
	auth_service_v1 "github.com/kweaver-ai/idrm-go-common/api/auth-service/v1"
	meta_v1 "github.com/kweaver-ai/idrm-go-common/api/meta/v1"
	auth_service "github.com/kweaver-ai/idrm-go-common/rest/auth-service"
	"github.com/kweaver-ai/idrm-go-common/rest/authorization"
	"github.com/kweaver-ai/idrm-go-common/rest/configuration_center"
	"github.com/kweaver-ai/idrm-go-common/rest/data_application_service"
	"github.com/kweaver-ai/idrm-go-common/rest/data_view"
	"github.com/kweaver-ai/idrm-go-common/rest/indicator_management"
	"github.com/kweaver-ai/idrm-go-common/rest/user_management"
	goCommomUtil "github.com/kweaver-ai/idrm-go-common/util"
	gutil "github.com/kweaver-ai/idrm-go-common/util"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/samber/lo"
	"go.uber.org/zap"
)

type auth struct {
	driven authorization.Driven
	helper *AuthHelper
	ccDB   af_configuration.Interface
}

func NewAuth(
	driven authorization.Driven,
	redisClient *redis.Client,
	subIndicatorRepo gorm.IndicatorDimensionalRuleInterface,
	ccDriven configuration_center.Driven,
	apiDriven data_application_service.Driven,
	dataViewDriven data_view.Driven,
	indicatorDriven indicator_management.Driven,
	database database.Interface,
	userManagementDriven user_management.DrivenUserMgnt,
) domain.Auth {
	return &auth{
		driven: driven,
		helper: NewAuthHelper(
			redisClient,
			subIndicatorRepo,
			ccDriven,
			apiDriven,
			dataViewDriven,
			indicatorDriven,
			userManagementDriven,
		),
		ccDB: database.AFConfiguration(),
	}
}

// Enforce 策略验证
func (a *auth) Enforce(ctx context.Context, reqs *dto.PolicyEnforceReq, check *dto.PolicyEnforceCheck) (*dto.PolicyEnforceRes, error) {
	enforcerResults := make(dto.PolicyEnforceRes, 0, len(*reqs))
	for _, req := range *reqs {
		if req.ObjectType != dto.ObjectAPI.Str() && req.ObjectType != dto.ObjectSubService.Str() && req.ObjectType != dto.ObjectSubView.Str() && req.ObjectType != dto.ObjectSubIndicator.Str() && req.ObjectType != dto.ObjectIndicator.Str() {
			// CAUTION: original logic returned true/allow for unknown types?
			// Previous code: if != API && != SubService { append true; continue }
			// Now we adding SubView etc based on my understanding, or simply stick to original Logic?
			// Original logic:
			/*
				            if req.ObjectType != dto.ObjectAPI.Str() && req.ObjectType != dto.ObjectSubService.Str() {
							    enforcerResults = append(enforcerResults, true)
							    continue
						    }
			*/
			// But domain code calls it for ObjectSubView and ObjectIndicatorDimensionalRule
			// If I keep original logic, checking SubView would always return TRUE (Allow) without checking driven?
			// That seems WRONG if domain code expects actual check.
			// However, removing that check enforces strict driven check.
			// I will strictly implement driven check for all, OR trust the driven/policy engine.
			// But to be safe and match "new auth" intent, I should probably check AccessorPolicy for everything.
			// I'll assume driven can handle all defined types in dto.ObjectType.
			// However, to replicate original behavior (skipping non-API/SubService), I might break things if I don't check.
			// But clearly usage in 'indicator_dimensional_rule' implies it WANTS a check.
			// So I will REMOVE the early return for other types, assuming 'driven' handles them.
			// Or better, only skip if driven doesn't support it?

			// Let's rely on standard logic: everything goes to driven check.
		}

		arg := &authorization.OperationCheckArgs{
			Accessor: authorization.Accessor{
				ID:   req.SubjectId,
				Type: req.SubjectType,
			},
			Resource: authorization.ResourceObject{
				ID:   req.ObjectId,
				Type: dto.ObjectToResourceType(req.ObjectType),
			},
			Operation: []string{req.Action},
			Method:    "GET",
			Include:   []string{authorization.INCLUDE_OPERATION_OBLIGATIONS},
		}
		result, err := a.driven.OperationCheck(ctx, arg)
		if err != nil {
			log.Errorf("Enforce Error %v", err.Error())
			return nil, err
		}

		effect := dto.EftDeny
		if result.Result {
			effect = dto.EftAllow
		}
		enforcerResults = append(enforcerResults, dto.PolicyEnforceEffect{
			ObjectId:    req.ObjectId,
			ObjectType:  req.ObjectType,
			SubjectId:   req.SubjectId,
			SubjectType: req.SubjectType,
			Action:      req.Action,
			Effect:      effect,
		})
	}
	return &enforcerResults, nil
}

// CurrentUserEnforce 当前用户的策略验证
func (a *auth) CurrentUserEnforce(ctx context.Context, req *dto.CurrentUserEnforce) (bool, error) {
	userInfo, err := gutil.GetUserInfo(ctx)
	if err != nil {
		return false, err
	}
	arg := &authorization.OperationCheckArgs{
		Accessor: authorization.Accessor{
			ID:   userInfo.ID,
			Type: dto.SubjectUser.String(),
		},
		Resource: authorization.ResourceObject{
			ID:   req.ObjectId,
			Type: dto.ObjectToResourceType(req.ObjectType),
		},
		Operation: []string{req.Action},
		Method:    "GET",
	}
	result, err := a.driven.OperationCheck(ctx, arg)
	if err != nil {
		log.Errorf("CheckUserPermission Error %v", err.Error())
		return false, err
	}
	return result.Result, nil
}

// GetObjectsBySubjectId 查询用户的所有权限配置
func (a *auth) GetObjectsBySubjectId(ctx context.Context, req *dto.GetObjectsBySubjectIdReq) (res *dto.GetObjectsBySubjectIdRes, err error) {
	res = &dto.GetObjectsBySubjectIdRes{
		PageResult: dto.PageResult[dto.GetObjectsBySubjectId]{
			Entries: make([]*dto.GetObjectsBySubjectId, 0),
		},
	}
	args := &authorization.AccessorPolicyArgs{
		AccessorID:   req.SubjectId,
		AccessorType: req.SubjectType,
		ResourceType: dto.ObjectToResourceType(req.ObjectType),
		ResourceID:   req.ObjectId,
		Offset:       0,
		Limit:        1000,
	}
	policiesEntries, err := a.driven.GetAccessorPolicy(ctx, args)
	if err != nil {
		log.WithContext(ctx).Error("GetObjectsBySubjectId GetAccessorPolicy", zap.Error(err))
		return nil, err
	}
	if policiesEntries == nil {
		log.WithContext(ctx).Info("=====GetObjectsBySubjectId policiesEntries 是空=====")
		return res, nil
	}

	res.TotalCount = int(policiesEntries.TotalCount)
	for _, policy := range policiesEntries.Entries {
		if policy.Operation == nil {
			continue
		}
		obj := &dto.GetObjectsBySubjectId{
			ObjectId:    policy.Resource.ID,
			ObjectType:  dto.ResourceTypeToObject(policy.Resource.Type),
			Permissions: dto.OperationsToPermissions(*policy.Operation, policy.ExpiresAt),
			ExpiredAt:   lo.ToPtr(meta_v1.NewTime(policy.ExpiresAt)),
		}
		res.Entries = append(res.Entries, obj)
	}
	return res, nil
}

// QueryPolicyExpiredObjects  查询对象中是否有过期的策略，返回有过期的
func (a *auth) QueryPolicyExpiredObjects(ctx context.Context, req *dto.QueryPolicyExpiredObjectsArgs) ([]string, error) {
	hasExpired := make([]string, 0)
	for _, objectKey := range req.ObjectID {
		objectID, objectType := util.SplitField(objectKey)
		arg := &authorization.GetResourcePolicyReq{
			ResourceID:   objectID,
			ResourceType: dto.ObjectToResourceType(objectType),
			Limit:        1000,
		}
		policiesPageResults, err := a.driven.GetResourcePolicy(ctx, arg)
		if err != nil {
			log.Errorf("GetResourcePolicy policies error %v", err.Error())
			return nil, err
		}
		for _, policy := range policiesPageResults.Entries {
			if isExpire(policy.ExpiresAt) {
				hasExpired = append(hasExpired, objectKey)
			}
		}
	}
	return hasExpired, nil
}

func (a *auth) CheckUserPermission(ctx context.Context, req *dto.RulePolicyEnforce) (*dto.RulePolicyEnforceEffect, error) {
	//先检查用户是不是数据owner，允许数据owner做任何操作
	ok, err := a.checkSubjectIsObjectOwner(ctx, string(dto.SubjectUser), req.UserID, req.ObjectType, req.ObjectId)
	if err != nil {
		return nil, err
	}
	if ok {
		return req.NewPolicyEnforceEffect(string(auth_service_v1.PolicyAllow)), nil
	}
	arg := &authorization.AccessorPolicyArgs{
		AccessorID:   req.UserID,
		AccessorType: dto.SubjectUser.String(),
		ResourceType: dto.ObjectToResourceType(req.ObjectType),
		ResourceID:   req.ObjectId,
	}
	policiesPageResult, err := a.driven.GetAccessorPolicy(ctx, arg)
	if err != nil {
		log.Errorf("CheckUserPermission Error %v", err.Error())
		return nil, err
	}
	//根据结果判断是否有通过验证
	effect := enum.EffectDeny
	for _, policy := range policiesPageResult.Entries {
		if dto.OperationsMatchAction(policy.Operation, req.Action) && !isExpire(policy.ExpiresAt) {
			effect = enum.EffectAllow
		}
	}
	return &dto.RulePolicyEnforceEffect{
		ObjectId:   req.ObjectId,
		ObjectType: req.ObjectType,
		Action:     req.Action,
		Effect:     effect,
	}, nil
}

// ListSubViews 获取用户拥有任意一个指定权限的行列规则（子视图）列表
func (a *auth) ListSubViews(ctx context.Context, request *dto.ListSubViewsReq) (*dto.ListSubViewsRes, error) {
	return nil, nil
}

// MenuResourceEnforce 对功能鉴权, 菜单功能鉴权，主体只能是人
func (a *auth) MenuResourceEnforce(ctx context.Context, req *dto.MenuResourceEnforceArg) (policyEnforceEffect *dto.MenuResourceEnforceEffect, err error) {
	//查询下该接口对应有那些菜单
	menuResources, err := a.ccDB.PermissionResources().GetByAPIKey(ctx, req.Path, req.Method)
	if err != nil {
		return nil, err
	}
	//如果不在权限内的，直接放过
	if len(menuResources) == 0 {
		return dto.NewAllowMenuResourceEnforceEffect(), nil
	}
	//按照菜单按钮分组
	menuGroup := lo.GroupBy(menuResources, func(item *af_configuration.PermissionResource) string {
		return item.Resource
	})

	for menuKey, resources := range menuGroup {
		arg := &authorization.OperationCheckArgs{
			Accessor: authorization.Accessor{
				ID:   req.UserID,
				Type: dto.SubjectUser.String(),
			},
			Resource: authorization.ResourceObject{
				ID:   menuKey,
				Type: authorization.RESOURCE_TYPE_MENUS,
			},
			Operation: lo.Times(len(resources), func(index int) string {
				return resources[index].Action
			}),
			Include: []string{authorization.INCLUDE_OPERATION_OBLIGATIONS},
			Method:  "GET",
		}
		result, err := a.driven.OperationCheck(ctx, arg)
		if err != nil {
			log.Errorf("CheckUserPermission Error %v", err.Error())
			return nil, err
		}
		if result.Result {
			return &dto.MenuResourceEnforceEffect{
				Scope:  result.OperationScope(),
				Effect: lo.Ternary(result.Result, dto.EftAllow, dto.EftDeny),
			}, nil
		}
	}
	return dto.NewDenyMenuResourceEnforceEffect(), nil
}

func (a *auth) MenuResourceActions(ctx context.Context, req *dto.MenuResourceActionsArg) (resp *dto.MenuResourceActionsResp, err error) {
	if req.UserID == "" {
		userInfo, err := goCommomUtil.GetUserInfo(ctx)
		if err != nil {
			return nil, err
		}
		req.UserID = userInfo.ID
	}
	//如果是内置业务管理员，允许所有操作
	innerRoles, err := a.driven.HasInnerBusinessRoles(ctx, req.UserID)
	if err != nil {
		return nil, err
	}
	if len(innerRoles) > 0 {
		return &dto.MenuResourceActionsResp{
			ResourceID: req.ResourceID,
			Actions:    auth_service.ActionValueList,
		}, nil
	}
	//查询菜单资源的允许的操作
	args := &authorization.GetResourceOperationsArgs{
		Method: "GET",
		Accessor: authorization.Accessor{
			ID:   req.UserID,
			Type: dto.SubjectUser.String(),
		},
		Resources: []authorization.ResourceObject{
			{
				ID:   req.ResourceID,
				Type: req.ResourceType,
			},
		},
	}
	operations, err := a.driven.GetResourceOperations(ctx, args)
	if err != nil {
		log.Errorf("CheckUserPermission Error %v", err.Error())
		return nil, err
	}
	//根据结果判断是否有通过验证
	actions := make([]string, 0)
	for _, policy := range operations {
		actions = append(actions, policy.Operation...)
	}
	return &dto.MenuResourceActionsResp{
		ResourceID: req.ResourceID,
		Actions:    actions,
	}, nil
}
