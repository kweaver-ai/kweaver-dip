package driven

import (
	"github.com/google/wire"
	data_search_all "github.com/kweaver-ai/dsg/services/apps/basic-search/adapter/driven/data_search_all/impl"
	data_catalog "github.com/kweaver-ai/dsg/services/apps/basic-search/adapter/driven/es_data_datalog"
	data_view "github.com/kweaver-ai/dsg/services/apps/basic-search/adapter/driven/es_data_view/impl"
	elec_license "github.com/kweaver-ai/dsg/services/apps/basic-search/adapter/driven/es_elec_license/impl"
	indicator "github.com/kweaver-ai/dsg/services/apps/basic-search/adapter/driven/es_indicator/impl"
	info_catalog "github.com/kweaver-ai/dsg/services/apps/basic-search/adapter/driven/es_info_catalog/impl"
	interface_svc "github.com/kweaver-ai/dsg/services/apps/basic-search/adapter/driven/es_interface_svc/impl"
	"github.com/kweaver-ai/dsg/services/apps/basic-search/adapter/driven/hydra"
	"github.com/kweaver-ai/dsg/services/apps/basic-search/adapter/driven/opensearch"
	"github.com/kweaver-ai/idrm-go-common/trace"
	"github.com/kweaver-ai/idrm-go-frame/core/utils/httpclient"
)

var Set = wire.NewSet(
	trace.NewOtelHttpClient,
	hydra.NewHydra,
	httpclient.NewMiddlewareHTTPClient,
	opensearch.NewOpenSearchClient,
	data_catalog.NewSearch,
	interface_svc.NewObjSearch,
	data_view.NewObjSearch,
	indicator.NewObjSearch,
	data_search_all.NewSearch,
	info_catalog.NewSearch,
	elec_license.NewSearcher,
)
