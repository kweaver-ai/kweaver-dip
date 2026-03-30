package driven

import (
	"github.com/google/wire"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/spt"
	authorization_impl "github.com/kweaver-ai/idrm-go-common/rest/authorization/impl"

	//basic_bigdata_service "github.com/kweaver-ai/idrm-go-common/rest/basic_bigdata_service/impl"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/callbacks"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/gorm"
	configuration "github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/mq/configuration/impl"
	datasource "github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/mq/datasource/impl"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/rest/data_connection"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/rest/data_subject"
	hydraV6 "github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/rest/hydra/v6"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/rest/sszd_service"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/rest/standardization"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/rest/user_management"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/rest/virtualization_engine"
	workflow "github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/rest/workflow/impl"
	sharemanagement "github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/thrift/sharemgnt"
	gocephclient "github.com/kweaver-ai/idrm-go-common/go-ceph-client"
	configuration_center_impl "github.com/kweaver-ai/idrm-go-common/rest/configuration_center/impl"
	doc_audit_rest_v1 "github.com/kweaver-ai/idrm-go-common/rest/doc_audit_rest/v1"
	goCommon_user_management "github.com/kweaver-ai/idrm-go-common/rest/user_management"
	af_trace "github.com/kweaver-ai/idrm-go-frame/core/telemetry/trace"
	"github.com/kweaver-ai/idrm-go-frame/core/utils/httpclient"
)

var Set = wire.NewSet(
	gorm.RepositoryProviderSet,
	gocephclient.NewCephClient,
	//http_client.NewRawHTTPClient,
	af_trace.NewOtelHttpClient,
	httpclient.NewMiddlewareHTTPClient,
	hydraV6.NewHydra,
	user_management.NewUserMgnt,
	goCommon_user_management.NewUserMgntByService,
	virtualization_engine.NewVirtualizationEngine,
	data_connection.NewDataConnection,
	standardization.NewStandardization,
	data_subject.NewDataSubject,
	datasource.NewMQHandleInstance,
	configuration.NewMQHandleInstance,
	sharemanagement.NewDriven,
	//entity_change
	databaseCallback,
	workflow.NewWorkflow,
	workflow.NewCommonWorkflow,
	sszd_service.NewSszdService,
	doc_audit_rest_v1.NewForHTTPClient,
	//basic_bigdata_service.NewDriven,
	configuration_center_impl.NewConfigurationCenterDrivenByService,
	spt.NewGRPCClient,
	spt.NewUserRegisterClient,
	//ISF授权管理
	authorization_impl.NewDriven,
)

var databaseCallback = wire.NewSet(
	callbacks.NewTransport,
	callbacks.NewEntityChangeTransport,
)
