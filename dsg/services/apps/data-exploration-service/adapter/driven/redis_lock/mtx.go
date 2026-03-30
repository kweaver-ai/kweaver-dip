package redis_lock

import (
	"context"
	"errors"
	"sync"
	"time"

	"github.com/avast/retry-go/v4"
	"github.com/bsm/redislock"
	"github.com/kweaver-ai/dsg/services/apps/data-exploration-service/infrastructure/repository/db"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/trace"
	"github.com/redis/go-redis/v9"
	"go.uber.org/atomic"
)

const (
	defaultLockKeyPrefix = "KweaverAI.cn/anyfabric/data-exploration-service/lock-"
	lockKeyTTL           = 2 * time.Second // key过期时间默认2秒
)

type Mutex struct {
	redisCli redis.UniversalClient
	locker   *redislock.Client

	mtx sync.Mutex
	lck *redislock.Lock

	stop atomic.Bool

	lastPrintTime *time.Time
}

func NewMutex(db *db.Data) *Mutex {
	return &Mutex{
		redisCli: db.RedisCli,
		locker:   redislock.New(db.RedisCli),
	}
}

// ObtainLocker 获取锁(默认过期时间为2秒)，设置自动刷新时间则会自动刷新锁时间(刷新间隔不能大于2秒)，通过ctx控制结束时间
func (m *Mutex) ObtainLocker(ctx context.Context, key string, autoRefreshTime time.Duration) (locker *redislock.Lock, err error) {
	ctx, span := trace.StartInternalSpan(ctx)
	defer func() { trace.TelemetrySpanEnd(span, err) }()

	locker, err = m.locker.Obtain(ctx, defaultLockKeyPrefix+key, lockKeyTTL, &redislock.Options{
		RetryStrategy: redislock.LimitRetry(redislock.LinearBackoff(100*time.Millisecond), 2),
	})
	if errors.Is(err, redislock.ErrNotObtained) {
		log.WithContext(ctx).Infof("redis.Locker.Obtain not obtained")
		return nil, err
	} else if err != nil {
		log.WithContext(ctx).Errorf("redis.Locker.Obtain failed, err: %v", err)
		return nil, err
	}
	log.WithContext(ctx).Infof("obtained distributed mutex")
	if autoRefreshTime > 0 && autoRefreshTime < lockKeyTTL {
		go m.autoRefresh(ctx, locker, autoRefreshTime)
	}
	return locker, nil
}

// Refresh 校验并刷新TTL
func (m *Mutex) Refresh(ctx context.Context, locker *redislock.Lock) error {
	if locker == nil {
		return errors.New("nil lock")
	}
	// 校验TTL
	ttl, err := retry.DoWithData(func() (time.Duration, error) {
		ttl, err := locker.TTL(ctx)
		if err != nil {
			log.WithContext(ctx).Errorf("redis.Locker.TTL failed, err: %v", err)
			return 0, err
		}

		return ttl, nil
	},
		retry.Attempts(2),
		retry.DelayType(retry.CombineDelay(retry.FixedDelay, retry.RandomDelay)),
		retry.Delay(500*time.Millisecond),
		retry.Context(ctx),
	)

	// 有错误，认为已经失去锁
	if err != nil {
		log.WithContext(ctx).Errorf("redis.Locker.TTL failed, ctx cancel, err: %v", err)
		return err
	}

	if ttl > 0 {
		// 延长锁的使用时间为新的ttl
		if err := locker.Refresh(ctx, lockKeyTTL, nil); err != nil {
			return err
		}
	}
	return nil
}

// Release 释放锁
func (m *Mutex) Release(ctx context.Context, locker *redislock.Lock) error {
	var err error
	ctx, span := trace.StartInternalSpan(ctx)
	defer func() { trace.TelemetrySpanEnd(span, err) }()

	if locker != nil {
		if err := locker.Release(ctx); err != nil {
			log.WithContext(ctx).Errorf("redis.Locker.Release failed, err: %v", err)
			return err
		}
	}

	return nil
}

// autoRefresh 自动刷新TTL
func (m *Mutex) autoRefresh(ctx context.Context, locker *redislock.Lock, autoRefreshTime time.Duration) error {
	ticker := time.NewTicker(autoRefreshTime)
	for {
		select {
		case <-ctx.Done():
			ticker.Stop()
			return nil
		case <-ticker.C:
			err := m.Refresh(ctx, locker)
			if err != nil {
				return err
			}
		}
	}
}
