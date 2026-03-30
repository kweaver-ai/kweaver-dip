package impl

import (
	"context"
	"fmt"
	"strings"

	"github.com/kweaver-ai/dsg/services/apps/auth-service/domain/common_auth"
	domain "github.com/kweaver-ai/dsg/services/apps/auth-service/domain/indicator_dimensional_rule"
	"github.com/kweaver-ai/dsg/services/apps/auth-service/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-common/util"
	"github.com/samber/lo"

	"github.com/google/uuid"
	"github.com/kweaver-ai/dsg/services/apps/auth-service/adapter/driven/gorm"
	"github.com/kweaver-ai/dsg/services/apps/auth-service/common/dto"
	"github.com/kweaver-ai/dsg/services/apps/auth-service/common/errorcode"
	auth_service_v1 "github.com/kweaver-ai/idrm-go-common/api/auth-service/v1"
	v1 "github.com/kweaver-ai/idrm-go-common/api/meta/v1"
	"github.com/kweaver-ai/idrm-go-common/interception"
	"github.com/samber/lo/mutable"
)

func NewIndicatorDimensionalRuleInterface(
	// 数据库表 indicator_dimensional_rules
	indicatorDimensionalRule gorm.IndicatorDimensionalRuleInterface,
	auth common_auth.Auth,
) domain.UseCase {
	return &IndicatorDimensionalRuleDomain{
		IndicatorDimensionalRule: indicatorDimensionalRule,
		auth:                     auth,
	}
}

type IndicatorDimensionalRuleDomain struct {
	// 数据库表 indicator_dimensional_rules
	IndicatorDimensionalRule gorm.IndicatorDimensionalRuleInterface
	auth                     common_auth.Auth
}

// 创建
func (d *IndicatorDimensionalRuleDomain) Create(ctx context.Context, rule *auth_service_v1.IndicatorDimensionalRule) (*auth_service_v1.IndicatorDimensionalRule, error) {
	ruleModel := &model.IndicatorDimensionalRule{
		Spec: model.IndicatorDimensionalRuleSpec{
			IndicatorID: rule.Spec.IndicatorID,
			Name:        rule.Spec.Name,
		},
	}
	if err := d.IndicatorDimensionalRule.IsRepeat(ctx, ruleModel); err != nil {
		return nil, err
	}
	if err := d.checkUserIndicatorPermission(ctx, fmt.Sprintf("%v", rule.Spec.IndicatorID), dto.ActionAllocate, dto.ActionAuth); err != nil {
		return nil, err
	}
	// 生成 ID
	rule.ID = uuid.Must(uuid.NewV7()).String()
	result, err := d.IndicatorDimensionalRule.Create(ctx, convert_AuthServiceV1_IndicatorDimensionalRule_To_Model_IndicatorDimensionalRule(rule))
	return convert_Model_IndicatorDimensionalRule_To_AuthServiceV1_IndicatorDimensionalRule(result), err
}

// 删除
func (d *IndicatorDimensionalRuleDomain) Delete(ctx context.Context, id string) (*auth_service_v1.IndicatorDimensionalRule, error) {
	if err := d.checkUserIndicatorRulePermission(ctx, id, dto.ActionAllocate, dto.ActionAuth); err != nil {
		return nil, err
	}
	result, err := d.IndicatorDimensionalRule.Delete(ctx, id)
	return convert_Model_IndicatorDimensionalRule_To_AuthServiceV1_IndicatorDimensionalRule(result), err
}

// 更新 Spec
func (d *IndicatorDimensionalRuleDomain) UpdateSpec(ctx context.Context, id string, spec *auth_service_v1.IndicatorDimensionalRuleSpec) (*auth_service_v1.IndicatorDimensionalRule, error) {
	ruleModel := &model.IndicatorDimensionalRule{
		Metadata: model.Metadata{
			ID: id,
		},
		Spec: model.IndicatorDimensionalRuleSpec{
			IndicatorID: spec.IndicatorID,
			Name:        spec.Name,
		},
	}
	if err := d.IndicatorDimensionalRule.IsRepeat(ctx, ruleModel); err != nil {
		return nil, err
	}
	if err := d.checkUserIndicatorRulePermission(ctx, id, dto.ActionAllocate, dto.ActionAuth); err != nil {
		return nil, err
	}
	result, err := d.IndicatorDimensionalRule.UpdateSpec(ctx, id, convert_AuthServiceV1_IndicatorDimensionalRuleSpec_To_Model_IndicatorDimensionalRuleSpec(spec))
	return convert_Model_IndicatorDimensionalRule_To_AuthServiceV1_IndicatorDimensionalRule(result), err
}

// 获取一个
func (d *IndicatorDimensionalRuleDomain) Get(ctx context.Context, id string) (*auth_service_v1.IndicatorDimensionalRule, error) {
	result, err := d.IndicatorDimensionalRule.Get(ctx, id)
	if err != nil {
		return nil, err
	}

	rule := convert_Model_IndicatorDimensionalRule_To_AuthServiceV1_IndicatorDimensionalRule(result)

	// 前端要求 rule.Spec.RowFilters.Where 为空列表时序列化 json 为 `[]`
	if rule.Spec.RowFilters != nil && rule.Spec.RowFilters.Where == nil {
		rule.Spec.RowFilters.Where = make([]auth_service_v1.Where, 0)
	}
	return convert_Model_IndicatorDimensionalRule_To_AuthServiceV1_IndicatorDimensionalRule(result), err
}

// 获取列表
func (d *IndicatorDimensionalRuleDomain) List(ctx context.Context, opts *auth_service_v1.IndicatorDimensionalRuleListOptions) (*auth_service_v1.IndicatorDimensionalRuleList, error) {
	switch opts.Sort {
	// 无排序
	case "":
		listOpts := convert_AuthServiceV1_IndicatorDimensionalRuleListOptions_To_Model_IndicatorDimensionalRuleListOptions(opts)
		//查询可授权的子规则
		authedSubIndicatorID, err := d.listUserAuthedRules(ctx, opts.IndicatorID)
		if err != nil {
			return nil, err
		}
		authedSubIndicatorIDDict := lo.SliceToMap(authedSubIndicatorID, func(item string) (string, int) {
			return item, 1
		})
		result, err := d.IndicatorDimensionalRule.List(ctx, listOpts)
		list := convert_Model_IndicatorDimensionalRuleList_To_AuthService_IndicatorDimensionalRuleList(result)
		// 前端要求 rule.Spec.RowFilters.Where 为空列表时序列化 json 为 `[]`
		for i, r := range list.Entries {
			if r.Spec.RowFilters != nil && r.Spec.RowFilters.Where == nil {
				list.Entries[i].Spec.RowFilters.Where = make([]auth_service_v1.Where, 0)
			}
			//标记是否可授权
			list.Entries[i].Spec.CanAuth = authedSubIndicatorIDDict[list.Entries[i].Metadata.ID] > 0
		}
		return list, err

	// 根据当前用户是否有权限排序
	case auth_service_v1.IndicatorDimensionalRuleSortIsAuthorized:
		// 获取访问者
		sub, err := interception.AuthServiceSubjectFromContext(ctx)
		if err != nil {
			return nil, err
		}

		// 获取所有维度规则的 ID
		ids, err := d.IndicatorDimensionalRule.ListID(ctx, convert_AuthServiceV1_IndicatorDimensionalRuleListOptions_To_Model_IndicatorDimensionalRuleListOptions(opts))
		if err != nil {
			return nil, err
		}
		var list = auth_service_v1.IndicatorDimensionalRuleList{TotalCount: len(ids)}

		// 对所有维度规则鉴权
		var enforceReq dto.PolicyEnforceReq
		for _, id := range ids {
			enforceReq = append(enforceReq, dto.PolicyEnforce{
				ObjectId:    id,
				ObjectType:  string(auth_service_v1.ObjectIndicatorDimensionalRule),
				SubjectId:   sub.ID,
				SubjectType: string(sub.Type),
				Action:      string(auth_service_v1.ActionRead),
			})
		}
		enforceResp, err := d.auth.Enforce(ctx, &enforceReq, nil)
		if err != nil {
			return nil, err
		}

		// 根据鉴权结果排序，不允许当前用户执行 read 操作的在前，允许的在后
		sortObjectIDsByActionAndPolicyEnforceRes(ids, auth_service_v1.ActionRead, enforceResp)
		// 如果是降序，反转为允许的在前，不允许的在后
		if opts.Direction == v1.Descending {
			mutable.Reverse(ids)
		}
		// 分页边界 ids[h:t]
		var (
			h = min(len(ids), (opts.Offset-1)*opts.Limit)
			t = min(len(ids), h+opts.Limit)
		)

		// 获取维度规则的内容
		//
		// TODO: 批量查询数据库
		list.Entries = make([]auth_service_v1.IndicatorDimensionalRule, min(opts.Limit, len(ids)))
		for i, id := range ids[h:t] {
			r, err := d.IndicatorDimensionalRule.Get(ctx, id)
			if err != nil {
				return nil, err
			}
			convert_Model_IndicatorDimensionalRule_Into_AuthServiceV1_IndicatorDimensionalRule(r, &list.Entries[i])
			// 前端要求 rule.Spec.RowFilters.Where 为空列表时序列化 json 为 `[]`
			if list.Entries[i].Spec.RowFilters != nil && list.Entries[i].Spec.RowFilters.Where == nil {
				list.Entries[i].Spec.RowFilters.Where = make([]auth_service_v1.Where, 0)
			}
		}

		return &list, nil
	default:
		return nil, errorcode.Detail(errorcode.InternalError, "unsupported sort [%s]", opts.Sort)
	}
}

func (d *IndicatorDimensionalRuleDomain) GetIndicatorDimensionalRules(ctx context.Context, opts *auth_service_v1.IndicatorDimensionalRuleListArgs) ([]*auth_service_v1.IndicatorDimensionalRule, error) {
	indicatorRuleIDSlice := strings.Split(opts.IndicatorRuleID, ",")
	ds, err := d.IndicatorDimensionalRule.ListRuleID(ctx, indicatorRuleIDSlice...)
	if err != nil {
		return nil, errorcode.PublicDatabaseErr.Detail(err.Error())
	}
	out := make([]*auth_service_v1.IndicatorDimensionalRule, len(ds))
	for i := range ds {
		out[i] = &auth_service_v1.IndicatorDimensionalRule{}
		convert_Model_IndicatorDimensionalRule_Into_AuthServiceV1_IndicatorDimensionalRule(ds[i], out[i])
	}
	return out, nil
}

func (d *IndicatorDimensionalRuleDomain) GetIndicatorDimensionalRulesByIndicators(ctx context.Context, opts *auth_service_v1.IndicatorDimensionalByIndicatorRulesReq) (map[string][]string, error) {
	indicatorIDSlice := strings.Split(opts.IndicatorID, ",")
	ds, err := d.IndicatorDimensionalRule.ListRulesByIndicatorID(ctx, indicatorIDSlice...)
	if err != nil {
		return nil, errorcode.PublicDatabaseErr.Detail(err.Error())
	}
	ruleGroup := lo.GroupBy(ds, func(item *model.IndicatorDimensionalRule) string {
		return fmt.Sprintf("%v", item.Spec.IndicatorID)
	})
	return lo.MapEntries(ruleGroup, func(key string, value []*model.IndicatorDimensionalRule) (string, []string) {
		return key, lo.Uniq(lo.Times(len(value), func(index int) string {
			return value[index].ID
		}))
	}), nil
}

// listUserAuthedSubView implements sub_view.SubViewRepo.
// 查询用户授权的行列规则ID列表
func (d *IndicatorDimensionalRuleDomain) listUserAuthedRules(ctx context.Context, indicatorID int) ([]string, error) {
	arg := &model.IndicatorDimensionalRuleListOptions{
		IndicatorID: indicatorID,
	}
	allSubIndicators, err := d.IndicatorDimensionalRule.ListID(ctx, arg)
	if err != nil {
		return nil, errorcode.PublicDatabaseErr.Detail(err.Error())
	}
	if len(allSubIndicators) <= 0 {
		return []string{}, nil
	}
	userInfo, _ := util.GetUserInfo(ctx)
	if userInfo == nil {
		return []string{}, nil
	}
	opt := &auth_service_v1.PolicyListOptions{
		Subjects: []auth_service_v1.Subject{
			{
				ID:   userInfo.ID,
				Type: auth_service_v1.SubjectUser,
			},
		},
		Objects: lo.Times(len(allSubIndicators), func(index int) auth_service_v1.Object {
			return auth_service_v1.Object{
				ID:   allSubIndicators[index],
				Type: auth_service_v1.ObjectIndicatorDimensionalRule,
			}
		}),
	}
	policy, err := d.auth.ListPolicies(ctx, opt)
	if err != nil {
		return nil, err
	}
	//过滤有授权权限的
	policy = lo.Filter(policy, func(item auth_service_v1.Policy, index int) bool {
		return item.Action == auth_service_v1.ActionAuth || item.Action == auth_service_v1.ActionAllocate
	})
	//返回结果
	return lo.Uniq(lo.Times(len(policy), func(index int) string {
		return policy[index].Object.ID
	})), nil
}

func (d *IndicatorDimensionalRuleDomain) checkUserIndicatorPermission(ctx context.Context, indicatorID string, actions ...dto.Action) error {
	arg := &dto.Object{
		ObjectType: string(auth_service_v1.ObjectIndicator),
		ObjectId:   indicatorID,
	}
	return d.auth.CheckUserCreatePermission(ctx, arg, actions...)
}

func (d *IndicatorDimensionalRuleDomain) checkUserIndicatorRulePermission(ctx context.Context, ruleID string, actions ...dto.Action) error {
	arg := &dto.Object{
		ObjectType: string(auth_service_v1.ObjectIndicatorDimensionalRule),
		ObjectId:   ruleID,
	}
	return d.auth.CheckUserModifyPermission(ctx, arg, actions...)
}
