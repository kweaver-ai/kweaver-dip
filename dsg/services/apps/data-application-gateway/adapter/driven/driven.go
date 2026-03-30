package driven

import (
	"net/http"

	auth_service "github.com/kweaver-ai/idrm-go-common/rest/auth-service"

	"github.com/google/wire"
	"github.com/kweaver-ai/dsg/services/apps/data-application-gateway/adapter/driven/gorm"
	hydra "github.com/kweaver-ai/dsg/services/apps/data-application-gateway/adapter/driven/hydra/v6"
	mdl_uniquery "github.com/kweaver-ai/dsg/services/apps/data-application-gateway/adapter/driven/mdl-uniquery"
	"github.com/kweaver-ai/dsg/services/apps/data-application-gateway/adapter/driven/microservice"
	"github.com/kweaver-ai/dsg/services/apps/data-application-gateway/adapter/driven/reverse_proxy"
	"github.com/kweaver-ai/dsg/services/apps/data-application-gateway/adapter/driven/virtual_engine"
	"github.com/kweaver-ai/dsg/services/apps/data-application-gateway/common/util"
	auth_service_v1 "github.com/kweaver-ai/idrm-go-common/rest/auth-service/v1"
	"github.com/kweaver-ai/idrm-go-common/rest/configuration_center"
	configuration_center_impl "github.com/kweaver-ai/idrm-go-common/rest/configuration_center/impl"
	data_view_impl "github.com/kweaver-ai/idrm-go-common/rest/data_view/impl"
	"github.com/kweaver-ai/idrm-go-common/rest/user_management"
	"github.com/kweaver-ai/idrm-go-common/trace"
)

func NewConfigurationCenterLabelService(client *http.Client) configuration_center.LabelService {
	return configuration_center_impl.NewConfigurationCenterDrivenByService(client)
}

func NewConfigurationCenterApplicationService(client *http.Client) configuration_center.ApplicationService {
	return configuration_center_impl.NewConfigurationCenterDrivenByService(client)
}

func NewUserManagementService(client *http.Client) user_management.DrivenUserMgnt {
	return user_management.NewUserMgntByService(client)
}

func NewAuthServiceInternalV1Interface(client *http.Client) (auth_service.AuthServiceInternalV1Interface, error) {
	return auth_service_v1.NewInternalForBase(client)
}

var Set = wire.NewSet(
	gorm.NewServiceRepo,
	gorm.NewAppRepo,
	gorm.NewServiceApplyRepo,
	gorm.NewServiceCallRecordRepo,
	gorm.NewConfigurationRepo,
	gorm.NewDataApplicationServiceRepo,
	virtual_engine.NewVirtualEngineRepo,
	reverse_proxy.NewReverseProxyRepo,
	hydra.NewHydra,
	trace.NewOtelHttpClient,
	microservice.NewDataViewRepo,
	microservice.NewConfigurationCenterRepo,
	util.NewHTTPClient,
	microservice.NewAuthServiceRepo,
	data_view_impl.NewDataViewDriven,
	NewConfigurationCenterLabelService,
	NewConfigurationCenterApplicationService,
	NewUserManagementService,
	NewAuthServiceInternalV1Interface,
	mdl_uniquery.NewMDLUniQuery,
)
