package mock

import (
	"github.com/gin-gonic/gin"
	"github.com/kweaver-ai/idrm-go-common/audit"
	"github.com/kweaver-ai/idrm-go-common/middleware"
	"github.com/kweaver-ai/idrm-go-common/rest/configuration_center"
	"github.com/kweaver-ai/idrm-go-common/rest/hydra"
	"github.com/kweaver-ai/idrm-go-common/rest/user_management"
)

type Middleware struct {
	hydra                     hydra.Hydra
	userMgm                   user_management.DrivenUserMgnt
	configurationCenterDriven configuration_center.Driven
	auditLogger               audit.Logger
}

func NewMiddleware(hydra hydra.Hydra, userMgm user_management.DrivenUserMgnt, configurationCenterDriven configuration_center.Driven, auditLogger audit.Logger) middleware.Middleware {
	return &Middleware{
		hydra:                     hydra,
		userMgm:                   userMgm,
		configurationCenterDriven: configurationCenterDriven,
		auditLogger:               auditLogger,
	}
}

func (m *Middleware) PermissionControl(permissions []string, admin bool) gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Next()
	}
}
