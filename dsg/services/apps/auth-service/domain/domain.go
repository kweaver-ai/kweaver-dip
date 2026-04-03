package domain

import (
	"github.com/google/wire"
	common_auth_impl "github.com/kweaver-ai/dsg/services/apps/auth-service/domain/common_auth/impl"
)

// ProviderSet is biz providers.
var ProviderSet = wire.NewSet(
	//新的auth
	common_auth_impl.NewAuth,
)
