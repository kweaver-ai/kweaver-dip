package indicator_dimensional_rule

import (
	"context"
	auth_service_v1 "github.com/kweaver-ai/idrm-go-common/api/auth-service/v1"
)

//go:generate mockgen -destination impl/indicator_dimensional_rule.mock.go -package domain -typed github.com/kweaver-ai/dsg/services/apps/auth-service/domain/indicator_dimensional_rule UseCase

type UseCase interface {
	// 创建
	Create(ctx context.Context, rule *auth_service_v1.IndicatorDimensionalRule) (*auth_service_v1.IndicatorDimensionalRule, error)
	// 删除
	Delete(ctx context.Context, id string) (*auth_service_v1.IndicatorDimensionalRule, error)
	// 更新 Spec
	UpdateSpec(ctx context.Context, id string, spec *auth_service_v1.IndicatorDimensionalRuleSpec) (*auth_service_v1.IndicatorDimensionalRule, error)
	// 获取一个
	Get(ctx context.Context, id string) (*auth_service_v1.IndicatorDimensionalRule, error)
	// 获取列表
	List(ctx context.Context, opts *auth_service_v1.IndicatorDimensionalRuleListOptions) (*auth_service_v1.IndicatorDimensionalRuleList, error)
	//查询指标
	GetIndicatorDimensionalRules(ctx context.Context, opts *auth_service_v1.IndicatorDimensionalRuleListArgs) ([]*auth_service_v1.IndicatorDimensionalRule, error)
	GetIndicatorDimensionalRulesByIndicators(ctx context.Context, opts *auth_service_v1.IndicatorDimensionalByIndicatorRulesReq) (map[string][]string, error)
}
