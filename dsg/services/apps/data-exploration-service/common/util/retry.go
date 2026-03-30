package util

import (
	"context"
	"time"

	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
)

// RetryableFunc 可重试的函数类型（无参数）
type RetryableFunc[T any] func() (T, error)

// RetryWithResult 带有结果返回的重试函数模板（无参数）
func RetryWithResult[T any](ctx context.Context, fn RetryableFunc[T], maxRetries int, initialDelay time.Duration, funcName string) (T, error) {
	var result T
	var err error
	delay := initialDelay

	for i := 0; i <= maxRetries; i++ {
		result, err = fn()
		if err == nil {
			if i > 0 {
				log.WithContext(ctx).Infof("函数 %s 调用在第%d次重试后成功", funcName, i)
			}
			return result, nil
		}

		if i < maxRetries {
			log.WithContext(ctx).Warnf("函数 %s 调用失败，正在进行第%d次重试: %v", funcName, i+1, err)
			select {
			case <-ctx.Done():
				var zero T
				return zero, ctx.Err()
			case <-time.After(delay):
				delay *= 2 // 指数退避
			}
		}
	}

	log.WithContext(ctx).Errorf("函数 %s 调用经过%d次重试后仍然失败: %v", funcName, maxRetries, err)
	var zero T
	return zero, err
}

// RetryableFuncWithSearchAfter 可重试的函数类型，支持 SearchAfter 参数
type RetryableFuncWithSearchAfter[T any] func([]string) (T, error)

// searchAfterExtractor 从结果中提取 SearchAfter 的函数类型
type searchAfterExtractor[T any] func(T) []string

// getResultExtractor 从结果中判断是否调用成功 的函数类型
type getResultExtractor[T any] func(T) []map[string]any

// RetryWithResultAndSearchAfter 带有结果返回的重试函数模板，支持 SearchAfter 功能
// 第二次及以后调用 fn 时，将上一次返回结果中的 SearchAfter 作为参数传入 fn
func RetryWithResultAndSearchAfter[T any](ctx context.Context, fn RetryableFuncWithSearchAfter[T], maxRetries int, initialDelay time.Duration, funcName string, getResultExtractor getResultExtractor[T], getSearchAfter searchAfterExtractor[T]) (T, error) {
	res := make([]map[string]any, 0)
	var searchAfter []string
	delay := initialDelay

	for {
		result, err := fn(searchAfter)
		if err == nil {
			searchAfter = getSearchAfter(result) // 提取 SearchAfter 为下一次调用做准备
			res = append(res, getResultExtractor(result)...)
		}
		maxRetries--
		if maxRetries >= 0 {
			log.WithContext(ctx).Warnf(" %s 正在进行重试: %v", funcName, err)
			select {
			case <-ctx.Done():
				var zero T
				return zero, ctx.Err()
			case <-time.After(delay):
				//delay *= 2 // 指数退避
			}
		} else {
			// 达到最大重试次数仍然失败
			log.WithContext(ctx).Errorf(" %s 调用经过重试后仍然失败: %v", funcName, err)
			var zero T
			return zero, err
		}
	}
}
