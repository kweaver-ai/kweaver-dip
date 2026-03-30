package gorm

import (
	"github.com/google/wire"
	"github.com/kweaver-ai/dsg/services/apps/data-subject/adapter/driven/callbacks"
	classify "github.com/kweaver-ai/dsg/services/apps/data-subject/adapter/driven/gorm/classify/impl"
	formSubjectRelation "github.com/kweaver-ai/dsg/services/apps/data-subject/adapter/driven/gorm/form_subject_relation/impl"
	standard_info "github.com/kweaver-ai/dsg/services/apps/data-subject/adapter/driven/gorm/standard_info/impl"
	subject_domain "github.com/kweaver-ai/dsg/services/apps/data-subject/adapter/driven/gorm/subject_domain/impl"
	user "github.com/kweaver-ai/dsg/services/apps/data-subject/adapter/driven/gorm/user/impl"
	datasource "github.com/kweaver-ai/dsg/services/apps/data-subject/adapter/driven/mq/datasource/impl"
	sailorService "github.com/kweaver-ai/dsg/services/apps/data-subject/adapter/driven/rest/sailor_service/impl"
	localmiddleware "github.com/kweaver-ai/dsg/services/apps/data-subject/adapter/driver/middleware"
	af_sailor_impl "github.com/kweaver-ai/idrm-go-common/rest/af_sailor/impl"
	auth_service_v1 "github.com/kweaver-ai/idrm-go-common/rest/auth-service/v1"
	authorization "github.com/kweaver-ai/idrm-go-common/rest/authorization/impl"
	data_application_service_impl "github.com/kweaver-ai/idrm-go-common/rest/data_application_service/impl"
	data_view_impl "github.com/kweaver-ai/idrm-go-common/rest/data_view/impl"
	indicator_management_impl "github.com/kweaver-ai/idrm-go-common/rest/indicator_management/impl"
	standardization_impl "github.com/kweaver-ai/idrm-go-common/rest/standardization/impl"
	af_trace "github.com/kweaver-ai/idrm-go-frame/core/telemetry/trace"
)

var Set = wire.NewSet(
	//middleware Plugins
	af_trace.NewOtelHttpClient,
	localmiddleware.NewUserMgnt,
	localmiddleware.NewHydra,
	localmiddleware.NewConfigurationCenterDriven,

	//mq
	datasource.NewMQHandleInstance,

	//gorm
	subject_domain.NewSubjectDomainRepo,
	standard_info.NewStandardInfoRepo,
	formSubjectRelation.NewRepoImpl,
	user.NewUserRepo,
	classify.NewRepoImpl,

	//rest
	sailorService.NewSailorServiceCall,
	standardization_impl.NewDriven,
	data_view_impl.NewDataViewDriven,
	data_application_service_impl.NewDrivenImpl,
	indicator_management_impl.NewDrivenImpl,
	af_sailor_impl.NewSailorDriven,
	authorization.NewDriven,
	auth_service_v1.NewBaseClient,
	auth_service_v1.NewInternalForBase,

	//entity_change
	databaseCallback,
)

var databaseCallback = wire.NewSet(
	callbacks.NewTransport,
	callbacks.NewEntityChangeTransport,
)
