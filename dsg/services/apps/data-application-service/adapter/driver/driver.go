package driver

import (
	"github.com/google/wire"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/adapter/driver/v1/sub_service"

	"github.com/kweaver-ai/dsg/services/apps/data-application-service/adapter/driver/v1/audit_process_bind"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/adapter/driver/v1/developer"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/adapter/driver/v1/file"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/adapter/driver/v1/service"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/adapter/driver/v1/service_apply"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/adapter/driver/v1/service_call_record"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/adapter/driver/v1/service_daily_record"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/adapter/driver/v1/service_stats"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/adapter/driver/v1/subject_domain"
	"github.com/kweaver-ai/idrm-go-common/audit"
	"github.com/kweaver-ai/idrm-go-frame/core/utils/httpclient"

	GoCommon "github.com/kweaver-ai/idrm-go-common"
)

// HttpProviderSet ProviderSet is server providers.
var HttpProviderSet = wire.NewSet(NewHttpServer)

var ProviderSet = wire.NewSet(
	// middleware.NewMiddleware,
	developer.NewDeveloperController,
	service.NewServiceController,
	file.NewFileController,
	audit_process_bind.NewAuditProcessBindController,
	service_apply.NewServiceApplyController,
	service_call_record.NewServiceCallRecordController,
	service_daily_record.NewServiceDailyRecordController,
	service_stats.NewServiceStatsController,
	subject_domain.NewSubjectDomainController,
	sub_service.NewSubServiceService,

	// GoCommon
	audit.NewKafka,
	httpclient.NewMiddlewareHTTPClient,
	GoCommon.Set,
)
