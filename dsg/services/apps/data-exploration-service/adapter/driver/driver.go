package driver

import (
	"github.com/google/wire"
	exploration "github.com/kweaver-ai/dsg/services/apps/data-exploration-service/adapter/driver/exploration/v1"
	task_config "github.com/kweaver-ai/dsg/services/apps/data-exploration-service/adapter/driver/task_config/v1"
	GoCommon "github.com/kweaver-ai/idrm-go-common"
	"github.com/kweaver-ai/idrm-go-common/audit"
	"github.com/kweaver-ai/idrm-go-frame/core/utils/httpclient"
)

var Set = wire.NewSet(
	//http provider
	httpclient.NewMiddlewareHTTPClient,
	NewHttpServer,
	GoCommon.Set,
	audit.Discard,
	//controller
	exploration.NewController,
	task_config.NewController,
)
