package infrastructure

import (
	"github.com/google/wire"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/mq/kafka"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db"
)

var Set = wire.NewSet(
	db.NewData,
	db.NewGormDB,
	kafka.NewConsumer,
	kafka.NewSyncProducer,
	kafka.NewXSyncProducer,
	repository.NewRedis,
)
