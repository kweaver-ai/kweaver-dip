package infrastructure

import (
	"github.com/google/wire"
	"github.com/kweaver-ai/dsg/services/apps/task_center/infrastructure/mq/kafka"
	"github.com/kweaver-ai/dsg/services/apps/task_center/infrastructure/mq/mq_client"
	"github.com/kweaver-ai/dsg/services/apps/task_center/infrastructure/repository/db"
)

var Set = wire.NewSet(
	db.NewData,
	kafka.NewConsumer,
	kafka.NewSyncProducer,
	mq_client.NewProtonMQClient,
)
