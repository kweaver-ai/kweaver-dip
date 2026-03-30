package driver

import (
	"github.com/google/wire"
	"github.com/kweaver-ai/dsg/services/apps/data-application-gateway/adapter/driver/v1/query"
	"github.com/kweaver-ai/idrm-go-common"
	"github.com/kweaver-ai/idrm-go-common/audit"
	authorization "github.com/kweaver-ai/idrm-go-common/rest/authorization/impl"
	"github.com/kweaver-ai/idrm-go-frame/core/utils/httpclient"
)

// HttpProviderSet ProviderSet is server providers.
var HttpProviderSet = wire.NewSet(NewHttpServer)

var ProviderSet = wire.NewSet(
	query.NewQueryController,
	httpclient.NewMiddlewareHTTPClient,
	GoCommon.Middleware,
	audit.Discard,
	authorization.NewDriven,
)
