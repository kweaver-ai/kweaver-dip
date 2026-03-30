package driver

import (
	"github.com/google/wire"
	"github.com/kweaver-ai/dsg/services/apps/auth-service/adapter/driven/resources"
	"github.com/kweaver-ai/dsg/services/apps/auth-service/adapter/driver/v1/dwh_auth_request_form"

	"github.com/kweaver-ai/dsg/services/apps/auth-service/adapter/driver/v1/indicator_dimensional_rule"
	auth_v2 "github.com/kweaver-ai/dsg/services/apps/auth-service/adapter/driver/v2/auth"
)

// HttpProviderSet ProviderSet is server providers.
var HttpProviderSet = wire.NewSet(NewHttpServer)

var ProviderSet = wire.NewSet(
	auth_v2.NewController,
	indicator_dimensional_rule.New,
	dwh_auth_request_form.NewAuthController,
	resources.NewRegisterClient,
)
