package cache

import (
	"math/rand"
	"sync"
	"time"
)

type RandDuration struct {
	deviation float64 // 偏差
	r         *rand.Rand
	lock      *sync.Mutex
}

func NewRandDuration(deviation float64) RandDuration {
	if deviation < 0 {
		deviation = 0
	}
	if deviation > 1 {
		deviation = 1
	}
	return RandDuration{
		deviation: deviation,
		r:         rand.New(rand.NewSource(time.Now().UnixNano())),
		lock:      new(sync.Mutex),
	}
}

func (u RandDuration) AroundDuration(base time.Duration) time.Duration {
	u.lock.Lock()
	defer u.lock.Unlock()
	val := time.Duration((1 + u.deviation - 2*u.deviation*u.r.Float64()) * float64(base))
	return val
}

//func (u RandDuration) AroundInt(base int64) int64 {
//	u.lock.Lock()
//	defer u.lock.Unlock()
//	val := int64((1 + u.deviation - 2*u.deviation*u.r.Float64()) * float64(base))
//	return val
//}
