package cache

import (
	"os"
	"time"

	"context"

	"github.com/go-redis/redis/v8"
	"github.com/kweaver-ai/idrm-go-frame/core/redis_tool"
)

type Redis struct {
	client *redis.Client
}

func NewRedis() *Redis {
	return &Redis{client: redis_tool.NewRedisSentinelAuto()}
	// return &Redis{
	// 	client: redis.NewClient(
	// 		&redis.Options{
	// 			Addr:     fmt.Sprintf("%s:%s", os.Getenv("REDIS_HOST"), os.Getenv("REDIS_PORT")),
	// 			Username: os.Getenv("REDIS_USER_NAME"),
	// 			Password: os.Getenv("REDIS_PASSWORD"),
	// 			DB:       1,
	// 		},
	// 	),
	// }
}

func NewRedisMock() *Redis {
	return &Redis{client: redis.NewClient(
		&redis.Options{
			Addr:         os.Getenv("REDIS_SENTINEL_HOST") + "6379",
			Password:     os.Getenv("REDIS_SENTINEL_PASSWORD"),
			DB:           1,
			MinIdleConns: 8,
		})}
}

func (r *Redis) GetClient() *redis.Client {
	return r.client
}

func (r *Redis) Set(ctx context.Context, key string, value any) error {
	return r.client.Set(ctx, key, value, 0).Err()
}

func (r *Redis) Exists(ctx context.Context, key string) (int64, error) {
	return r.client.Exists(ctx, key).Result()
}

func (r *Redis) Incr(ctx context.Context, key string) (int64, error) {
	return r.client.Incr(ctx, key).Result()
}

func (r *Redis) LLen(ctx context.Context, key string) (int64, error) {
	return r.client.LLen(ctx, key).Result()
}

func (r *Redis) LRange(ctx context.Context, key string, start, stop int64) ([]string, error) {
	return r.client.LRange(ctx, key, start, stop).Result()
}

func (r *Redis) RPush(ctx context.Context, key string, expire time.Duration, values ...any) (int64, error) {

	res, err := r.client.RPush(ctx, key, values).Result()
	go r.client.Expire(ctx, key, expire)
	return res, err
}
