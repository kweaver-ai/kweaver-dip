package driven

import (
	"net/http"
	"time"

	"github.com/google/wire"
	"github.com/kweaver-ai/dsg/services/apps/session/adapter/driven/audit"
	"github.com/kweaver-ai/dsg/services/apps/session/adapter/driven/http_client"
	"github.com/kweaver-ai/dsg/services/apps/session/adapter/driven/http_client/anyshare"
	"github.com/kweaver-ai/dsg/services/apps/session/adapter/driven/http_client/authentication"
	deploy_management "github.com/kweaver-ai/dsg/services/apps/session/adapter/driven/http_client/deploy_manager"
	hydra "github.com/kweaver-ai/dsg/services/apps/session/adapter/driven/http_client/hydra/v6"
	"github.com/kweaver-ai/dsg/services/apps/session/adapter/driven/http_client/oauth2"
	"github.com/kweaver-ai/dsg/services/apps/session/adapter/driven/http_client/user_management"
	"github.com/kweaver-ai/dsg/services/apps/session/adapter/driven/kafka"
	"github.com/kweaver-ai/dsg/services/apps/session/common/settings"
	goCommonAudit "github.com/kweaver-ai/idrm-go-common/audit"
	configuration_center_impl "github.com/kweaver-ai/idrm-go-common/rest/configuration_center/impl"
	af_trace "github.com/kweaver-ai/idrm-go-frame/core/telemetry/trace"
)

var DrivenSet = wire.NewSet(
	//http_client.NewRawHTTPClient,
	NewClient,
	http_client.NewOtelHTTPClient,
	anyshare.NewAnyshare,
	hydra.NewHydra,
	user_management.NewUserMgnt,
	oauth2.NewOauth2,
	deploy_management.NewDeployMgm,
	authentication.NewAuthentication,
	configuration_center_impl.NewConfigurationCenterDrivenByService,
	goCommonAudit.New,
	audit.NewAuditLogger,
	kafka.NewSaramaSyncProducer,
)

func NewClient() *http.Client {
	return af_trace.NewOTELHttpClientWithTimeout(time.Duration(settings.ConfigInstance.Config.HttpClientExpireSecondInt) * time.Second)
}
