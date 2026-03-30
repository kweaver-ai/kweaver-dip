package redis

import (
	"sync"

	"github.com/kweaver-ai/dsg/services/apps/auth-service/common/settings"
	"github.com/redis/go-redis/v9"
)

var (
	once   sync.Once
	client redis.UniversalClient
)

type Client struct {
	client redis.UniversalClient
}

func NewRedisClient() *Client {
	s := settings.Instance
	once.Do(func() {
		opts := &redis.UniversalOptions{
			Addrs:    []string{s.Redis.Host},
			Password: s.Redis.Password,
		}
		client = redis.NewUniversalClient(opts)
	})

	return &Client{client: client}
}
