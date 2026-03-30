package domain

import (
	"github.com/google/wire"
	common_auth_impl "github.com/kweaver-ai/dsg/services/apps/auth-service/domain/common_auth/impl"
	dwh_data_application_form_impl "github.com/kweaver-ai/dsg/services/apps/auth-service/domain/dwh_data_auth_request/impl"
	indicator_dimensional_rule_impl "github.com/kweaver-ai/dsg/services/apps/auth-service/domain/indicator_dimensional_rule/impl"
)

// ProviderSet is biz providers.
var ProviderSet = wire.NewSet(
	indicator_dimensional_rule_impl.NewIndicatorDimensionalRuleInterface, // 指标维度规则
	// 授权申请
	dwh_data_application_form_impl.NewUseCase,
	//新的auth
	common_auth_impl.NewAuth,
)
