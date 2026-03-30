package mock

import (
	"github.com/kweaver-ai/idrm-go-common/middleware"
	"github.com/kweaver-ai/idrm-go-common/rest/configuration_center"
	"github.com/kweaver-ai/idrm-go-common/rest/hydra"
	"github.com/kweaver-ai/idrm-go-common/rest/user_management"
)

type Middleware struct {
	hydra                     hydra.Hydra
	userMgm                   user_management.DrivenUserMgnt
	configurationCenterDriven configuration_center.Driven
}

func NewMiddleware(hydra hydra.Hydra, userMgm user_management.DrivenUserMgnt, configurationCenterDriven configuration_center.Driven) middleware.Middleware {
	return &Middleware{
		hydra:                     hydra,
		userMgm:                   userMgm,
		configurationCenterDriven: configurationCenterDriven,
	}
}
