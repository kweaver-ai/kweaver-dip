package redis

import (
	"context"
	"errors"
	"time"

	"github.com/redis/go-redis/v9"
)

var (
	KeyNotExistError = errors.New("key not exist")
)

func (c *Client) MSetWithExp(ctx context.Context, expiration time.Duration, values ...interface{}) ([]bool, error) {
	pipe := c.client.Pipeline()
	setCmds := make([]*redis.StatusCmd, 0, len(values)/2)
	for i := 0; i < len(values)-1; i = i + 2 {
		setCmds = append(setCmds, pipe.Set(ctx, values[i].(string), values[i+1], expiration))
	}
	if _, err := pipe.Exec(ctx); err != nil {
		return nil, err
	}
	results := make([]bool, len(setCmds))
	for i, cmd := range setCmds {
		results[i] = cmd.Err() != nil
	}
	return results, nil
}

func (c *Client) MGet(ctx context.Context, keys []string) (results map[string]any, err error) {
	sliceCmd := c.client.MGet(ctx, keys...)
	if sliceCmd.Err() != nil {
		return nil, sliceCmd.Err()
	}
	results = make(map[string]any)
	resultSlice := sliceCmd.Val()
	for i := range keys {
		results[keys[i]] = resultSlice[i]
	}
	return results, err
}

func (c *Client) Set(ctx context.Context, key string, value interface{}, expiration time.Duration) error {
	return c.client.Set(ctx, key, value, expiration).Err()
}

func (c *Client) Get(ctx context.Context, key string) (value string, err error) {
	err = c.client.Get(ctx, key).Scan(&value)
	return value, err
}

func (c *Client) HSet(ctx context.Context, hashName, key string, value any) error {
	return c.client.HSet(ctx, hashName, key, value).Err()
}

func (c *Client) HGet(ctx context.Context, hashName, key string) (value string, err error) {
	err = c.client.HGet(ctx, hashName, key).Scan(&value)
	return value, err
}

func (c *Client) HLen(ctx context.Context, hashName string) (int64, error) {
	result := c.client.HLen(ctx, hashName)
	return result.Val(), result.Err()
}

// HEGet 检查是否存在key，不存在返回错误
func (c *Client) HEGet(ctx context.Context, hashName, key string) (string, error) {
	exists, err := c.Exists(ctx, hashName)
	if err != nil {
		return "", err
	}
	if !exists {
		return "", KeyNotExistError
	}
	value := ""
	err = c.client.HGet(ctx, hashName, key).Scan(&value)
	return value, err
}

func (c *Client) Exists(ctx context.Context, key string) (bool, error) {
	res := c.client.Exists(ctx, key)
	return res.Val() == 1, res.Err()
}

func (c *Client) MExists(ctx context.Context, keys ...string) ([]bool, error) {
	pipe := c.client.Pipeline()
	existsCmds := make([]*redis.IntCmd, len(keys))

	for i, key := range keys {
		existsCmds[i] = pipe.Exists(ctx, key)
	}

	if _, err := pipe.Exec(ctx); err != nil {
		return nil, err
	}

	results := make([]bool, len(keys))
	for i, cmd := range existsCmds {
		results[i] = cmd.Val() == 1
	}
	return results, nil
}

func (c *Client) HExists(ctx context.Context, hasName, key string) bool {
	return c.client.HExists(ctx, hasName, key).Val()
}

func (c *Client) HMSet(ctx context.Context, hashName string, args ...any) error {
	return c.client.HMSet(ctx, hashName, args...).Err()
}

func (c *Client) HMSetWithExp(ctx context.Context, hashName string, expiration time.Duration, args ...any) error {
	hmsetPips := c.client.Pipeline()
	results := make([]*redis.BoolCmd, 2)

	results[0] = hmsetPips.HMSet(ctx, hashName, args...)
	results[1] = hmsetPips.Expire(ctx, hashName, expiration)
	if _, err := hmsetPips.Exec(ctx); err != nil {
		return err
	}
	for _, cmd := range results {
		if cmd.Err() != nil {
			return cmd.Err()
		}
	}
	return nil
}

func (c *Client) Del(ctx context.Context, hashName ...string) error {
	return c.client.Del(ctx, hashName...).Err()
}

func (c *Client) HDel(ctx context.Context, hashName string, key ...string) error {
	return c.client.HDel(ctx, hashName, key...).Err()
}

func (c *Client) HGetAll(ctx context.Context, hashName string) (map[string]string, error) {
	exists, err := c.Exists(ctx, hashName)
	if err != nil {
		return nil, err
	}
	if !exists {
		return nil, KeyNotExistError
	}
	values := make(map[string]string)
	result := c.client.HGetAll(ctx, hashName)
	if result.Err() != nil {
		return nil, result.Err()
	}
	if err = result.Scan(&values); err != nil {
		return nil, err
	}
	return values, nil
}
