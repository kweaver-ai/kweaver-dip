package controller

import (
	"github.com/google/wire"
	GoCommon "github.com/kweaver-ai/idrm-go-common"
	"github.com/kweaver-ai/idrm-go-common/audit"

	apply_scope "github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/controller/apply-scope"
	assessment_ctl "github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/controller/assessment/v1"
	audit_process "github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/controller/audit_process/v1"
	catalog_feedback "github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/controller/catalog_feedback/v1"
	category "github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/controller/category/v1"
	cognitive_service_system "github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/controller/cognitive_service_system/v1"
	data_assets_frontend "github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/controller/data_assets/frontend/v1"
	data_assets "github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/controller/data_assets/v1"
	data_catalog_frontend "github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/controller/data_catalog/frontend/v1"
	data_catalog_frontend_v2 "github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/controller/data_catalog/frontend/v2"
	data_catalog "github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/controller/data_catalog/v1"
	data_catalog_score "github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/controller/data_catalog_score/v1"
	data_comprehension "github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/controller/data_comprehension/frontend/v1"
	data_push "github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/controller/data_push/v1"
	data_resource_frontend "github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/controller/data_resource/frontend/v1"
	data_resource "github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/controller/data_resource/v1"
	elec_licence "github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/controller/elec_licence/v1"
	file_resource "github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/controller/file_resource/v1"
	info_catalog "github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/controller/info_catalog/v1"
	info_system_frontend "github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/controller/info_system/frontend/v1"
	my_frontend "github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/controller/my/frontend/v1"
	my_favorite "github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/controller/my_favorite/v1"
	open_catalog "github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/controller/open_catalog/v1"
	res_feedback "github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/controller/res_feedback/v1"
	statistics "github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/controller/statistics/v1"
	system_operation "github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/controller/system_operation/v1"
	tree "github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/controller/tree/v1"
	tree_node_frontend "github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/controller/tree_node/frontend/v1"
	tree_node "github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/controller/tree_node/v1"
	apply_scope_config_uc "github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/category/apply_scope_config/impl"
)

// ProviderSet is server providers.
var HttpProviderSet = wire.NewSet(
	NewHttpServer,
	// middleware.NewMiddleware,
	GoCommon.Middleware,
	NewAuditLogger,
)

func NewAuditLogger() audit.Logger {
	return audit.Discard()
}

var ControllerProviderSet = wire.NewSet(
	data_catalog.NewController,
	tree.NewService,
	tree_node.NewService,
	data_catalog_frontend.NewController,
	data_catalog_frontend_v2.NewController,
	tree_node_frontend.NewService,
	audit_process.NewController,
	data_comprehension.NewController,
	data_assets_frontend.NewController,
	data_assets.NewController,
	my_frontend.NewController,
	category.NewService,
	category.NewTreeService,
	apply_scope_config_uc.NewUseCase,
	category.NewCategoryApplyScopeConfigService,
	data_resource_frontend.NewController,
	data_resource.NewController,
	catalog_feedback.NewController,
	open_catalog.NewController,
	info_catalog.NewController,
	data_catalog_score.NewController,
	elec_licence.NewController,
	my_favorite.NewController,
	data_push.NewController,
	cognitive_service_system.NewController,
	file_resource.NewController,
	info_system_frontend.New,
	statistics.NewController,
	system_operation.NewController,
	apply_scope.NewController,
	res_feedback.NewController,
	assessment_ctl.NewController,
)
