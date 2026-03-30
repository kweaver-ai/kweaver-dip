package domain

import (
	"github.com/google/wire"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/common"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/info_catalog"
	"github.com/kweaver-ai/idrm-go-common/rest/user_management"

	apply_scope "github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/apply-scope/impl"
	assessment_domain "github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/assessment/impl"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/audit_process"
	catalog_feedback "github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/catalog_feedback/impl"
	category "github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/category/impl"
	cognitive_service_system_case "github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/cognitive_service_system/impl"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/common_usecase"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/data_assets"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/data_catalog"
	data_catalog_score "github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/data_catalog_score/impl"
	data_comprehension "github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/data_comprehension/impl"
	data_push "github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/data_push/impl"
	data_resource "github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/data_resource/impl"
	data_resource_catalog "github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/data_resource_catalog/impl"
	elec_licence "github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/elec_licence/impl"
	file_resource_domain "github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/file_resource/impl"
	frontend_data_catalog "github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/frontend/data_catalog"
	frontend_data_resource "github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/frontend/data_resource"
	frontend_info_system "github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/frontend/info_system"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/frontend/my"
	info_resource_catalog_domain "github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/info_resource_catalog/impl"
	my_favorite "github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/my_favorite/impl"
	open_catalog_domain "github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/open_catalog/impl"
	res_feedback "github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/res_feedback/impl"
	statistics "github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/statistics/impl"
	system_operation "github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/system_operation/impl"
	tree "github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/tree/impl"
	tree_node "github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/tree_node/impl"
	info_resource_catalog_repo "github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/info_resource_catalog"
	business_grooming "github.com/kweaver-ai/idrm-go-common/rest/business_grooming/impl"
	data_application_service "github.com/kweaver-ai/idrm-go-common/rest/data_application_service/impl"
	"github.com/kweaver-ai/idrm-go-common/rest/data_subject/data_subject_impl"
	data_sync "github.com/kweaver-ai/idrm-go-common/rest/data_sync/impl"
	data_view "github.com/kweaver-ai/idrm-go-common/rest/data_view/impl"
	demand_management "github.com/kweaver-ai/idrm-go-common/rest/demand_management/impl"
	standardization "github.com/kweaver-ai/idrm-go-common/rest/standardization/impl"
	virtual_engine "github.com/kweaver-ai/idrm-go-common/rest/virtual_engine/impl"
	WorkflowDriven "github.com/kweaver-ai/idrm-go-common/rest/workflow/impl"
)

// ProviderSet is biz providers.
var ProviderSet = wire.NewSet(
	//外部driven,
	goCommonSet,
	user_management.NewUserMgntByService,

	data_catalog.NewDataCatalogDomain,
	frontend_data_catalog.NewDataCatalogDomain,
	tree.NewUseCase,
	tree_node.NewUseCase,
	audit_process.NewAuditProcessDomain,
	data_comprehension.NewComprehensionDomain,
	data_assets.NewDataAssetsDomain,
	my.NewMyDomain,
	common_usecase.NewCommonUseCase,
	category.NewUseCase,
	category.NewUseTreeCase,
	frontend_data_resource.NewDataResourceDomain,
	wire.Bind(new(frontend_info_system.Interface), new(*frontend_info_system.Domain)),
	frontend_info_system.New,
	data_resource.NewDataResourceDomain,
	data_resource_catalog.NewDataResourceCatalogDomain,
	data_resource_catalog.NewDataResourceCatalogInternal,
	open_catalog_domain.NewOpenCatalogDomain,
	WorkflowDriven.NewDocAuditDriven,
	data_catalog_score.NewDataCatalogScoreDomain,
	data_push.NewUseCase,
	catalog_feedback.NewUseCase,
	// [信息资源编目领域服务依赖注入]
	info_resource_catalog_domain.NewInfoResourceCatalogDomain, // 信息资源编目领域服务
	business_grooming.NewDriven,                               // 业务建模服务从动适配器
	info_resource_catalog_repo.NewInfoResourceCatalogRepo,     // 信息资源编目资源库
	// [/]

	elec_licence.NewElecLicenceDomain,
	my_favorite.NewUseCase,
	cognitive_service_system_case.NewCognitiveServiceSystemDomain,
	file_resource_domain.NewFileResourceDomain,
	statistics.NewUseCase,
	system_operation.NewSystemOperationDomain,
	common.NewDepartmentDomain,
	apply_scope.NewApplyScopeUseCaseImpl,
	info_catalog.NewInfoCatalogDomain,
	assessment_domain.NewAssessmentTargetDomain,
	assessment_domain.NewAssessmentPlanDomain,
	assessment_domain.NewOperationTargetDomain,
	assessment_domain.NewOperationPlanDomain,
	res_feedback.NewUseCase,
)

// 外部Driven
//func NewConfigurationCenterDriven(client *http.Client) configuration_center.Driven {
//	return configuration_center_impl.NewConfigurationCenterDriven(client, settings.GetConfig().DepServicesConf.ConfigCenterHost, settings.GetConfig().DepServicesConf.WorkflowHost)
//}

var goCommonSet = wire.NewSet(
	//NewConfigurationCenterDriven,
	data_subject_impl.NewDataViewDriven,
	standardization.NewDriven,
	data_application_service.NewDrivenImpl,
	data_view.NewDataViewDriven,
	demand_management.NewDemandManagementDriven,
	data_sync.NewDataSyncDriven,
	virtual_engine.NewDrivenImpl,
)
