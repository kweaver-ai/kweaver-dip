package util

import (
	"math/rand"
	"time"
)

// 便于单元测试
var clock Clock = &RealClock{}

// RetryOnError 重复调用函数 fn，直到返回的异常是 nil 或不可重复的异常。
//
// 重复调用的间隔是基准时间至其 1.1 倍之间的随机值。
//
// 基准时间从 100ms 开始每次翻倍，直到 5min，之后不变。
//  1. 100-110ms
//  2. 200-220ms
//  3. 400-440ms
//  4. 800-880ms
//  5. 1600-1760ms
//     ...
func RetryOnError(retriable func(error) bool, fn func() error) error {
	interval := time.Millisecond * 100

	// 第一次调用 fn
	err := fn()
	for err != nil && retriable(err) {
		clock.Sleep(jitter(interval))
		err = fn()
		interval = nextInterval(interval)
		if interval > time.Minute*5 {
			interval = time.Minute * 5
		}
	}

	return err
}

// nextInterval 计算下一次等待时长，每次等待时长翻倍，最长 5 分钟。
func nextInterval(i time.Duration) time.Duration {
	const maxInterval = time.Minute * 5
	i = i * 2
	if i > maxInterval {
		i = maxInterval
	}
	return i
}

// jitter 返回 d 到 d * 1.1 之间随机值。
func jitter(d time.Duration) time.Duration {
	return time.Duration((1 + rand.Float64()*0.1) * float64(d))
}
