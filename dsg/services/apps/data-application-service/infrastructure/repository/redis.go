package repository

import (
	"sync"

	"github.com/kweaver-ai/dsg/services/apps/data-application-service/common/settings"
	"github.com/redis/go-redis/v9"
)

var (
	once   sync.Once
	client redis.UniversalClient
)

type Redis struct {
	Client redis.UniversalClient
}

func NewRedis(s *settings.Settings) *Redis {
	once.Do(func() {
		opts := &redis.UniversalOptions{
			Addrs:            []string{s.Redis.Host},
			Password:         s.Redis.Password,
			SentinelPassword: s.Redis.Password,
			MasterName:       s.Redis.MasterName,
		}
		client = redis.NewUniversalClient(opts)
	})

	return &Redis{Client: client}
}
