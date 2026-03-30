package driven

import (
	"github.com/google/wire"

	businessGrooming "github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/business_grooming/impl"
	"github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/callback"
	configurationCenter "github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/configuration_center/impl"
	dataCatalog "github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/data_catalog/impl"
	data_exploration "github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/data_exploration/impl"
	data_view "github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/data_view/impl"
	"github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/mq/kafka"
	auth_service_v1 "github.com/kweaver-ai/idrm-go-common/rest/auth-service/v1"
	authorization_impl "github.com/kweaver-ai/idrm-go-common/rest/authorization/impl"
	data_catalog_driven "github.com/kweaver-ai/idrm-go-common/rest/data_catalog/impl"
	rest_data_view "github.com/kweaver-ai/idrm-go-common/rest/data_view/impl"
	standardization "github.com/kweaver-ai/idrm-go-common/rest/standardization/impl"
	workflowDriven "github.com/kweaver-ai/idrm-go-common/rest/workflow/impl"
	af_trace "github.com/kweaver-ai/idrm-go-frame/core/telemetry/trace"
	"github.com/kweaver-ai/idrm-go-frame/core/utils/httpclient"
)

var Set = wire.NewSet(
	businessGrooming.NewBusinessGroomingCall,
	callback.New,
	configurationCenter.NewConfigurationCenterCall,
	dataCatalog.NewCatalogServiceCall,
	af_trace.NewOtelHttpClient,
	httpclient.NewMiddlewareHTTPClient,
	data_view.NewDataView,
	data_catalog_driven.NewDrivenImpl,
	data_exploration.NewDataExploration,
	standardization.NewDriven,
	rest_data_view.NewDataViewDriven,
	workflowDriven.NewWorkflowDriven,
	kafka.NewSaramaClient,
	auth_service_v1.NewInternalForBase,
	authorization_impl.NewDriven,
)
