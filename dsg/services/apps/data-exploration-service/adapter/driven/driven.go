package driven

import (
	"github.com/kweaver-ai/dsg/services/apps/data-exploration-service/adapter/driven/callbacks"
	"github.com/kweaver-ai/dsg/services/apps/data-exploration-service/adapter/driven/gorm/third_party_report"
	mdl_uniquery "github.com/kweaver-ai/dsg/services/apps/data-exploration-service/adapter/driven/mdl-uniquery"

	"github.com/kweaver-ai/dsg/services/apps/data-exploration-service/adapter/driven/configuration_center"
	"github.com/kweaver-ai/dsg/services/apps/data-exploration-service/adapter/driven/gorm/client_info"
	"github.com/kweaver-ai/dsg/services/apps/data-exploration-service/adapter/driven/gorm/report"
	"github.com/kweaver-ai/dsg/services/apps/data-exploration-service/adapter/driven/gorm/report_item"
	"github.com/kweaver-ai/dsg/services/apps/data-exploration-service/adapter/driven/gorm/task_config"
	"github.com/kweaver-ai/dsg/services/apps/data-exploration-service/adapter/driven/mq"
	"github.com/kweaver-ai/dsg/services/apps/data-exploration-service/adapter/driven/mq/data_exploration_handler"
	"github.com/kweaver-ai/dsg/services/apps/data-exploration-service/adapter/driven/mq/kafka"
	"github.com/kweaver-ai/dsg/services/apps/data-exploration-service/adapter/driven/redis_lock"

	hydra "github.com/kweaver-ai/dsg/services/apps/data-exploration-service/adapter/driven/hydra/v6"

	"github.com/kweaver-ai/dsg/services/apps/data-exploration-service/adapter/driven/user_management"
	"github.com/kweaver-ai/dsg/services/apps/data-exploration-service/adapter/driven/virtualization_engine"

	"github.com/google/wire"
)

var Set = wire.NewSet(
	//trace.NewOtelHttpClient,
	configuration_center.NewConfigurationCenter,
	hydra.NewHydra,
	user_management.NewUserMgnt,
	report.NewRepo,
	third_party_report.NewRepo,
	client_info.NewRepo,
	report_item.NewRepo,
	task_config.NewRepo,
	virtualization_engine.NewVirtualizationEngine,
	redis_lock.NewMutex,
	data_exploration_handler.NewDataExplorationHandler,
	kafka.NewKafkaProducer,
	kafka.NewConsumerClient,
	mq.NewMQHandler,
	mdl_uniquery.NewMDLUniQuery,
	databaseCallback,
)

var databaseCallback = wire.NewSet(
	callbacks.NewTransport,
	callbacks.NewEntityChangeTransport,
)
