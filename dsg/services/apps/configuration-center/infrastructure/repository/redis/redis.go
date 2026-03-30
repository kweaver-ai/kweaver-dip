package redis

import (
	"context"
	"fmt"
	"runtime"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/settings"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/redis/go-redis/v9"
	"go.uber.org/zap"
)

func NewRedis() *redis.Client {
	//本地调试使用单机版
	if runtime.GOOS == "windows" {
		return newSingleRedis()
	}
	return newSentinelRedis()
}

func newSingleRedis() *redis.Client {
	redisConfig := settings.ConfigInstance.Config.Redis
	redisOpts := &redis.Options{
		Addr:     redisConfig.RedisHost,
		Password: redisConfig.RedisPassword,
	}
	return redis.NewClient(redisOpts)
}

func newSentinelRedis() *redis.Client {
	cli := redis.NewFailoverClient(&redis.FailoverOptions{
		MasterName: settings.ConfigInstance.Config.Redis.ConnectInfo.MasterGroupName,
		SentinelAddrs: []string{
			fmt.Sprintf("%s:%s",
				settings.ConfigInstance.Config.Redis.ConnectInfo.SentinelHost,
				settings.ConfigInstance.Config.Redis.ConnectInfo.SentinelPort),
		},
		SentinelUsername: settings.ConfigInstance.Config.Redis.ConnectInfo.SentinelUsername,
		SentinelPassword: settings.ConfigInstance.Config.Redis.ConnectInfo.SentinelPassword,
		Username:         settings.ConfigInstance.Config.Redis.ConnectInfo.Username,
		Password:         settings.ConfigInstance.Config.Redis.ConnectInfo.Password,
	})
	s, err := cli.Ping(context.Background()).Result()
	if err != nil || s != "PONG" {
		log.Error("REDIS PING NOT PONG", zap.Error(err))
		panic("REDIS PING NOT PONG")
	}
	return cli
}
