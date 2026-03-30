package driven

import (
	"github.com/google/wire"
	authorization_impl "github.com/kweaver-ai/idrm-go-common/rest/authorization/impl"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/driven/ad"
	// adSearch "github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/driven/anydata_search/impl"
	auth "github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/driven/auth/impl"
	auth_service "github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/driven/auth_service/impl"
	bs "github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/driven/basic_search/impl"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/driven/callbacks"
	cog "github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/driven/cognitive_assistant/impl"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/driven/configuration_center"
	cc "github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/driven/configuration_center/impl"
	data_exploration "github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/driven/data_exploration/impl"
	localDataView "github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/driven/data_view"
	dv "github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/driven/data_view/impl"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/driven/databases"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/driven/demand_management"
	localIndicatorManagement "github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/driven/indicator-management"
	im "github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/driven/indicator-management/impl"
	metadata "github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/driven/metadata/impl"
	es "github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/driven/mq/es/impl"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/driven/openai"
	task_center "github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/driven/task_center/impl"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/driven/virtualization_engine"
	workflow "github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/driven/workflow"
	gocephclient "github.com/kweaver-ai/idrm-go-common/go-ceph-client"
	auth_service_v1 "github.com/kweaver-ai/idrm-go-common/rest/auth-service/v1"
	basic_bigdata_service "github.com/kweaver-ai/idrm-go-common/rest/basic_bigdata_service/impl"
	basic_search_v1 "github.com/kweaver-ai/idrm-go-common/rest/basic_search/v1"
	demand_management_v1 "github.com/kweaver-ai/idrm-go-common/rest/demand_management/v1"
	label "github.com/kweaver-ai/idrm-go-common/rest/label/impl"
	task_center_common "github.com/kweaver-ai/idrm-go-common/rest/task_center/impl"
	workflowDriven "github.com/kweaver-ai/idrm-go-common/rest/workflow/impl"
	"github.com/kweaver-ai/idrm-go-frame/core/utils/httpclient"
)

var Set = wire.NewSet(
	auth_service_v1.NewForBaseAndClient,
	auth_service.NewASDrivenRepo,
	auth_service_v1.NewInternalForBase,
	ad.NewAD,
	openai.NewOpenAI,
	virtualization_engine.NewVirtualizationEngine,
	configuration_center.NewConfigurationCenter,
	data_exploration.NewDataExploration,
	// adSearch.NewAnyDataSearchRepo,
	metadata.NewMetadataRepo,
	cc.NewCCDrivenRepo,
	bs.NewRepo,
	cog.NewCogAssistant,
	auth.NewRepo,
	auth_service.NewAuthServiceImpl,
	dv.NewDVDrivenRepo,
	NewLocalDataViewRepo,
	NewLocalIndicatorManagementRepo,
	databaseCallback,
	workflow.NewWorkflow,
	workflow.NewWFStarter,
	es.NewESRepo,
	wire.Bind(new(demand_management_v1.DemandManagementV1Interface), new(*demand_management_v1.DemandManagementV1Client)),
	demand_management.New,
	workflowDriven.NewWorkflowDriven,
	basic_bigdata_service.NewDriven,
	gocephclient.NewCephClient,
	task_center.NewDriven,
	task_center_common.NewDriven,
	basic_search_v1.NewForBaseAndClient,
	wire.Bind(new(basic_search_v1.Interface), new(*basic_search_v1.Client)),
	databases.New,
	wire.Bind(new(databases.Interface), new(*databases.Client)),
	label.NewBigDataDriven,
	authorization_impl.NewDriven,
)

var databaseCallback = wire.NewSet(
	callbacks.NewTransport,
	callbacks.NewEntityChangeTransport,
	callbacks.NewDataPushCallback,
)

// NewLocalDataViewRepo 提供 localDataView.Repo 接口的实现
func NewLocalDataViewRepo(client httpclient.HTTPClient) localDataView.Repo {
	return dv.NewDVDrivenRepo(client)
}

// NewLocalIndicatorManagementRepo 提供 localIndicatorManagement.Repo 接口的实现
func NewLocalIndicatorManagementRepo(client httpclient.HTTPClient) localIndicatorManagement.Repo {
	return im.NewIMDrivenRepo(client)
}
