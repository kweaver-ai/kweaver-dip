package driver

import (
	"github.com/google/wire"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/driver/http_client/hydra"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/driver/http_client/user_management"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/driver/http_client/virtualization_engine"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/driver/mq"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/driver/mq/apply_num"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/driver/mq/entity_change"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/driver/mq/interface_catalog"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/driver/mq/kafka"
	"github.com/kweaver-ai/idrm-go-common/trace"
	"github.com/kweaver-ai/idrm-go-frame/core/utils/httpclient"
)

var DriverSet = wire.NewSet(
	trace.NewOtelHttpClient,
	httpclient.NewMiddlewareHTTPClient,
	hydra.NewHydra,
	user_management.NewUserMgnt,
	virtualization_engine.NewVirtualizationEngine,

	//mq
	mq.NewMQManager,
	kafka.NewMqHandler,
	entity_change.NewEntityChangeHandler,
	interface_catalog.NewInterfaceCatalogHandler,
	apply_num.NewApplyNumHandler,
)
