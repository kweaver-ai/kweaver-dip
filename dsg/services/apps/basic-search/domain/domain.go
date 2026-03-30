package domain

import (
	"github.com/google/wire"

	"github.com/kweaver-ai/dsg/services/apps/basic-search/domain/data_catalog"
	data_search_all "github.com/kweaver-ai/dsg/services/apps/basic-search/domain/data_search_all/impl"
	data_view "github.com/kweaver-ai/dsg/services/apps/basic-search/domain/data_view/impl"
	elec_license "github.com/kweaver-ai/dsg/services/apps/basic-search/domain/elec_license/impl"
	indicator "github.com/kweaver-ai/dsg/services/apps/basic-search/domain/indicator/impl"
	info_catalog "github.com/kweaver-ai/dsg/services/apps/basic-search/domain/info_catalog/impl"
	"github.com/kweaver-ai/dsg/services/apps/basic-search/domain/info_system"
	interface_svc "github.com/kweaver-ai/dsg/services/apps/basic-search/domain/interface_svc/impl"
)

var Set = wire.NewSet(
	data_catalog.NewUseCase,
	interface_svc.NewUseCase,
	data_view.NewUseCase,
	data_search_all.NewUseCase,
	indicator.NewUseCase,
	info_catalog.NewUseCase,
	elec_license.NewUseCase,
	info_system.New,
)
