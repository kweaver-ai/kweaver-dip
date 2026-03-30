package repository

import (
	"context"
	"time"

	redis "github.com/go-redis/redis/v8"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/settings"
)

type Redis struct {
	client *redis.Client
}

func NewRedis(config *settings.Config) *Redis {
	return &Redis{client: redis.NewClient(&redis.Options{
		Addr:         config.RedisConf.Host,
		Password:     config.RedisConf.Password,
		DB:           config.RedisConf.DB,
		MinIdleConns: config.RedisConf.MinIdleConns,
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

/*
	if _, err := r.client.TxPipelined(ctx, func(pipeliner redis.Pipeliner) error {
		_, err := pipeliner.RPush(ctx, key, values).Result()
		if err != nil {
			return err
		}
		_, err = pipeliner.Expire(ctx, key, expire).Result()
		if err != nil {
			return err
		}
		return nil
	}); err != nil {
		return 0, err
	}
	return 0, nil
*/
