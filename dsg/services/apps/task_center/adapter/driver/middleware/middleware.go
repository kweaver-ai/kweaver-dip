package middleware

import (
	"net/http"

	"github.com/kweaver-ai/dsg/services/apps/task_center/common/settings"
	"github.com/kweaver-ai/idrm-go-common/rest/configuration_center"
	configuration_center_impl "github.com/kweaver-ai/idrm-go-common/rest/configuration_center/impl"
	"github.com/kweaver-ai/idrm-go-common/rest/hydra"
	hydra_impl "github.com/kweaver-ai/idrm-go-common/rest/hydra/impl"
	"github.com/kweaver-ai/idrm-go-common/rest/user_management"
	"github.com/kweaver-ai/idrm-go-frame/core/utils/httpclient"
)

func NewUserMgnt(client *http.Client) user_management.DrivenUserMgnt {
	conf := settings.ConfigInstance
	return user_management.NewUserMgnt(httpclient.NewMiddlewareHTTPClient(client), conf.DepServices.UserMgmPrivate)
}

func NewHydra(client *http.Client) hydra.Hydra {
	conf := settings.ConfigInstance
	return hydra_impl.NewHydra(client, conf.DepServices.HydraAdmin, "")
}

func NewConfigurationCenterDriven(client *http.Client) configuration_center.Driven {
	return configuration_center_impl.NewConfigurationCenterDrivenByService(client)
}
