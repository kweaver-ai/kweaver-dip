package util

import (
	"sync"
	"time"

	godisson "github.com/cheerego/go-redisson"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository"
)

const (
	defaultWaitTime        = 0
	defaultLeaseTime       = 5 * 1e3
	defaultLockKeyPrefix   = "data_catalog_redisson_lock_"
	defaultWatchDogTimeout = 30 * time.Second
)

type Redisson struct {
	g    *godisson.Godisson
	lMap map[string]*lock
	l    *sync.Mutex
}

type lock struct {
	lKey string
	l    *godisson.Mutex
	t    *time.Timer
}

func NewRedisson(redis *repository.Redis) *Redisson {
	redisson := &Redisson{
		g:    godisson.NewGodisson(redis.GetClient(), godisson.WithWatchDogTimeout(defaultWatchDogTimeout)),
		lMap: map[string]*lock{},
		l:    new(sync.Mutex),
	}
	return redisson
}

func (l *Redisson) getLock(key string) *godisson.Mutex {
	var lo *lock
	var ok bool

	l.l.Lock()
	defer l.l.Unlock()

	lKey := defaultLockKeyPrefix + key
	if lo, ok = l.lMap[lKey]; !ok {
		lo = &lock{lKey: key, l: l.g.NewMutex(lKey)}
		l.lMap[lKey] = lo
	}
	if lo.t == nil {
		lo.t = time.AfterFunc(20*defaultWatchDogTimeout, func() {
			l.l.Lock()
			defer l.l.Unlock()
			delete(l.lMap, lKey)
		})
	} else {
		lo.t.Reset(20 * defaultWatchDogTimeout)
	}
	return lo.l
}

func (l *Redisson) TryLock(key string) bool {
	if err := l.getLock(key).TryLock(defaultWaitTime, defaultLeaseTime); err == nil {
		return true
	}
	return false
}

func (l *Redisson) Unlock(key string) error {
	_, err := l.getLock(key).Unlock()
	return err
}
