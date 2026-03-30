package infrastructure

import (
	"fmt"
	"os"

	"github.com/kweaver-ai/dsg/services/apps/data-view/infrastructure/cache"
	"github.com/kweaver-ai/dsg/services/apps/data-view/infrastructure/db"
	"github.com/kweaver-ai/dsg/services/apps/data-view/infrastructure/mq/kafka"

	// "github.com/kweaver-ai/idrm-go-frame/core/redis_tool"
	"github.com/go-redis/redis/v8"

	"github.com/google/wire"
)

func NewRedisClient() *redis.Client {
	return redis.NewClient(&redis.Options{
		Addr:     fmt.Sprintf("%s:%s", os.Getenv("REDIS_HOST"), os.Getenv("REDIS_PORT")),
		Username: os.Getenv("REDIS_USER_NAME"),
		Password: os.Getenv("REDIS_PASSWORD"),
		DB:       1,
	})
}

var Set = wire.NewSet(
	db.NewDB,
	kafka.NewSyncProducer,
	kafka.NewConsumerGroupProduct,
	cache.NewRedis,
	// NewRedisClient,
	// redis_tool.NewRedisSentinelAuto,
)
