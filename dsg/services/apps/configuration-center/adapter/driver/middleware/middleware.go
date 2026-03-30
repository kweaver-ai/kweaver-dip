package middleware

import (
	"github.com/gin-gonic/gin"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/rest/hydra"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/rest/user_management"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/apps"
	IUser "github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/user"
	"github.com/kweaver-ai/idrm-go-common/access_control"
)

const VirtualEngineApp = "af-virtual-engine-gateway"

type Middleware interface {
	TokenInterception() gin.HandlerFunc
	SkipTokenInterception() gin.HandlerFunc
	AccessControl(resource access_control.Resource) gin.HandlerFunc
	MultipleAccessControl(resources ...access_control.Resource) gin.HandlerFunc
}
type MiddlewareImpl struct {
	hydra   hydra.Hydra
	user    IUser.UseCase
	userMgm user_management.DrivenUserMgnt
	apps    apps.AppsUseCase
}

func NewMiddleware(hydra hydra.Hydra, u IUser.UseCase, userMgm user_management.DrivenUserMgnt, apps apps.AppsUseCase) Middleware {
	return &MiddlewareImpl{hydra: hydra, user: u, userMgm: userMgm, apps: apps}
}

var PathDisableList []string = []string{"/api/configuration-center/v1/apps"}

const (
	Resource string = "configuration_center"
)
