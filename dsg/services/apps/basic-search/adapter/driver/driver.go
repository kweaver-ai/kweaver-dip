package driver

import (
	"github.com/google/wire"

	"github.com/kweaver-ai/dsg/services/apps/basic-search/adapter/driver/data_catalog"
	"github.com/kweaver-ai/dsg/services/apps/basic-search/adapter/driver/data_search_all"
	"github.com/kweaver-ai/dsg/services/apps/basic-search/adapter/driver/data_view"
	"github.com/kweaver-ai/dsg/services/apps/basic-search/adapter/driver/elec_license"
	"github.com/kweaver-ai/dsg/services/apps/basic-search/adapter/driver/indicator"
	"github.com/kweaver-ai/dsg/services/apps/basic-search/adapter/driver/info_catalog"
	"github.com/kweaver-ai/dsg/services/apps/basic-search/adapter/driver/info_system"
	"github.com/kweaver-ai/dsg/services/apps/basic-search/adapter/driver/interface_svc"
)

var Set = wire.NewSet(
	data_catalog.NewService,
	data_catalog.NewConsumer,
	info_catalog.NewService,
	info_catalog.NewConsumer,
	elec_license.NewService,
	elec_license.NewConsumer,
	interface_svc.NewService,
	interface_svc.NewConsumer,
	data_view.NewService,
	data_view.NewConsumer,
	indicator.NewService,
	indicator.NewConsumer,
	data_search_all.NewService,
	info_system.New,
	NewHttpServer,
	NewMQConsumeService,
	wire.Struct(new(Router), "*"), wire.Bind(new(IRouter), new(*Router)),
)
