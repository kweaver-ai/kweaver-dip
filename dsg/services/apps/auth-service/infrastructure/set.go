package infrastructure

import (
	"github.com/google/wire"
	"github.com/kweaver-ai/dsg/services/apps/auth-service/infrastructure/mq/kafka"
	"github.com/kweaver-ai/dsg/services/apps/auth-service/infrastructure/repository/db"
	"github.com/kweaver-ai/dsg/services/apps/auth-service/infrastructure/repository/redis"
)

var Set = wire.NewSet(
	repositorySet,
	kafka.NewConsumer,
)
var repositorySet = wire.NewSet(
	db.NewMariaDB,
	db.NewDatabaseAFDataModel,
	db.NewGormDBWithoutDatabase,
	db.NewConfigurationCenterDB,
	redis.NewRedisClient,
)
