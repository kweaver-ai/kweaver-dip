package driven

import (
	"github.com/google/wire"
	"github.com/kweaver-ai/idrm-go-frame/core/utils/httpclient"

	"github.com/kweaver-ai/dsg/services/apps/auth-service/adapter/driven/database"
	"github.com/kweaver-ai/dsg/services/apps/auth-service/adapter/driven/gorm"
	"github.com/kweaver-ai/dsg/services/apps/auth-service/adapter/driven/microservice"
	"github.com/kweaver-ai/dsg/services/apps/auth-service/adapter/driven/mq"
	"github.com/kweaver-ai/dsg/services/apps/auth-service/adapter/driven/mq/views"
	"github.com/kweaver-ai/dsg/services/apps/auth-service/adapter/driven/workflow/custom"
	"github.com/kweaver-ai/dsg/services/apps/auth-service/common/util"
	GoCommon "github.com/kweaver-ai/idrm-go-common"
	"github.com/kweaver-ai/idrm-go-common/audit"
)

var Set = wire.NewSet(
	database.New,
	wire.Bind(new(database.Interface), new(*database.Client)),
	microservice.NewConfigurationCenterRepo,
	microservice.NewUserManagementRepo,
	microservice.NewDataApplicationServiceRepo,
	microservice.NewDataSubjectRepo,
	microservice.NewDataViewRepo,
	microservice.NewDocAuditRESTRepo,
	microservice.NewVirtualizationEngineRepo,
	gorm.NewAuthSubViewRepo,
	gorm.NewAPIAuthorizingRequestRepo,
	gorm.NewIndicatorAuthorizingRequestRepo,
	gorm.NewLogicViewAuthorizingRequestRepo,
	gorm.NewSubViewRepo,
	gorm.NewUserRepo,
	gorm.NewIndicatorRepo,
	gorm.NewIndicatorDimensionalRuleInterfaceRepository,
	gorm.NewTTechnicalIndicatorRepo,
	gorm.NewDataApplicationFormRepo,
	util.NewHTTPClient,
	mqHandlers,
	gorm.NewConsumeAuthRequestRepo,
	custom.NewWFConsumerRegister,
	httpclient.NewMiddlewareHTTPClient,

	GoCommon.Set,
)

// mqHandlers kafka消息注册
var mqHandlers = wire.NewSet(
	mq.NewKafkaConsumer,
	audit.Discard,
	views.NewSubViewHandler,
)
