package domain

import (
	"github.com/google/wire"
	d_session "github.com/kweaver-ai/dsg/services/apps/session/domain/d_session/impl"
	login "github.com/kweaver-ai/dsg/services/apps/session/domain/login/impl"
	logout "github.com/kweaver-ai/dsg/services/apps/session/domain/logout/impl"
	refresh_token "github.com/kweaver-ai/dsg/services/apps/session/domain/refresh_token/impl"
	user_info "github.com/kweaver-ai/dsg/services/apps/session/domain/user_info/impl"
)

// ProviderSet is biz providers.
var DomainProviderSet = wire.NewSet(
	login.NewLoginUsecase,
	logout.NewLogOutUsecase,
	refresh_token.NewRefreshUsecase,
	user_info.NewUserInfoUsecase,
	d_session.NewSession,
)
