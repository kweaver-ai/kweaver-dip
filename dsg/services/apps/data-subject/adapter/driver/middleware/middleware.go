package middleware

import (
	"net/http"

	my_config "github.com/kweaver-ai/dsg/services/apps/data-subject/infrastructure/config"
	"github.com/kweaver-ai/idrm-go-common/rest/configuration_center"
	configuration_center_impl "github.com/kweaver-ai/idrm-go-common/rest/configuration_center/impl"
	"github.com/kweaver-ai/idrm-go-common/rest/hydra"
	hydra_impl "github.com/kweaver-ai/idrm-go-common/rest/hydra/impl"
	"github.com/kweaver-ai/idrm-go-common/rest/user_management"
	"github.com/kweaver-ai/idrm-go-frame/core/utils/httpclient"
)

func NewUserMgnt(conf *my_config.Bootstrap, client *http.Client) user_management.DrivenUserMgnt {
	return user_management.NewUserMgnt(httpclient.NewMiddlewareHTTPClient(client), conf.DepServices.UserMgmPrivate)
}

func NewHydra(conf *my_config.Bootstrap, client *http.Client) hydra.Hydra {
	return hydra_impl.NewHydra(client, conf.DepServices.HydraAdmin, "")
}

func NewConfigurationCenterDriven(conf *my_config.Bootstrap, client *http.Client) configuration_center.Driven {
	return configuration_center_impl.NewConfigurationCenterDriven(client, conf.DepServices.ConfigurationCenterHost, "", "")
}
