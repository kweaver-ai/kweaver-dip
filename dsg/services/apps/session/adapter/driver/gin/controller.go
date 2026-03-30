package gin

import (
	login "github.com/kweaver-ai/dsg/services/apps/session/adapter/driver/gin/login/v1"
	logout "github.com/kweaver-ai/dsg/services/apps/session/adapter/driver/gin/logout/v1"
	refresh_token "github.com/kweaver-ai/dsg/services/apps/session/adapter/driver/gin/refresh_token/v1"
	user_info "github.com/kweaver-ai/dsg/services/apps/session/adapter/driver/gin/user_info/v1"

	"github.com/google/wire"
)

// ProviderSet is server providers.
var HttpProviderSet = wire.NewSet(
	NewHttpServer,
)

var ServiceProviderSet = wire.NewSet(
	login.NewLogin,
	logout.NewLogOut,
	refresh_token.NewRefreshToken,
	user_info.NewUserInfo,
)
