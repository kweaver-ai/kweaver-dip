package infrastructure

import (
	"github.com/google/wire"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/repository/redis"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/mq/kafka"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/mq/nsq"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/repository/db"
)

var Set = wire.NewSet(
	db.NewData,
	kafka.NewSaramaClient,
	kafka.NewSyncProducer,
	kafka.NewConsumer,
	nsq.NewConsumer,
	nsq.NewProducer,
	redis.NewRedis,
)
