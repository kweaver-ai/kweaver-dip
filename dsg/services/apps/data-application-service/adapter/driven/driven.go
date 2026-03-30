package driven

import (
	"github.com/google/wire"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/adapter/driven/mq/consumer"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/adapter/driven/mq/consumer/service"

	"github.com/kweaver-ai/dsg/services/apps/data-application-service/adapter/driven/callbacks"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/adapter/driven/gorm"
	hydra "github.com/kweaver-ai/dsg/services/apps/data-application-service/adapter/driven/hydra/v6"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/adapter/driven/microservice"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/adapter/driven/mq"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/adapter/driven/workflow"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/common/util"
)

var Set = wire.NewSet(
	gorm.NewDeveloperRepo,
	gorm.NewServiceRepo,
	gorm.NewServiceDailyRecordRepo,
	gorm.NewServiceCategoryRelationRepo,
	gorm.NewFileRepo,
	gorm.NewAuditProcessBindRepo,
	gorm.NewServiceStatsRepo,
	gorm.NewServiceApplyRepo,
	gorm.NewAppRepo,
	gorm.NewServiceGateway,
	gorm.NewSubServiceImpl,
	gorm.NewServiceCallRecordRepo,
	gorm.NewGatewayCollectionLogRepo,
	util.NewHTTPClient,
	hydra.NewHydra,
	wire.FieldsOf(new(*mq.MQ), "SaramaSyncProducer"),
	mq.NewMQClient,
	workflow.NewConsumerAndRegisterHandlers,
	consumer.NewConsumer,
	service.NewHandler,
	microservice.NewConfigurationCenterRepo,
	microservice.NewDataCatalogRepo,
	microservice.NewMetadataManageRepo,
	microservice.NewVirtualEngineRepo,
	microservice.NewUserManagementRepo,
	microservice.NewWorkflowRestRepo,
	microservice.NewBasicSearchRepo,
	microservice.NewDataSubjectRepo,
	microservice.NewDataViewRepo,
	microservice.NewAuthServiceRepo,
	microservice.NewDeployMgm,
	//entity_change
	callbacks.NewEntityChangeTransport,
	callbacks.NewTransport,
	callbacks.NewDataApplicationServiceCallback,
)
