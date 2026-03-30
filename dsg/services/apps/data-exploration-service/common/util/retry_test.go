package util

import (
	"context"
	"errors"
	"testing"
	"time"
)

func TestRetryWithResult(t *testing.T) {
	ctx := context.Background()

	t.Run("成功执行无须重试", func(t *testing.T) {
		callCount := 0
		fn := func() (string, error) {
			callCount++
			return "success", nil
		}

		result, err := RetryWithResult(ctx, fn, 3, time.Millisecond, "TestFunction")

		if err != nil {
			t.Errorf("期望无错误，但得到: %v", err)
		}

		if result != "success" {
			t.Errorf("期望结果为 'success'，但得到: %s", result)
		}

		if callCount != 1 {
			t.Errorf("期望调用1次，但实际调用%d次", callCount)
		}
	})

	t.Run("重试后成功", func(t *testing.T) {
		callCount := 0
		fn := func() (string, error) {
			callCount++
			if callCount < 3 {
				return "", errors.New("临时错误")
			}
			return "success", nil
		}

		result, err := RetryWithResult(ctx, fn, 5, time.Millisecond, "TestFunction")

		if err != nil {
			t.Errorf("期望无错误，但得到: %v", err)
		}

		if result != "success" {
			t.Errorf("期望结果为 'success'，但得到: %s", result)
		}

		if callCount != 3 {
			t.Errorf("期望调用3次，但实际调用%d次", callCount)
		}
	})

	t.Run("重试次数耗尽仍失败", func(t *testing.T) {
		callCount := 0
		fn := func() (string, error) {
			callCount++
			return "", errors.New("持续错误")
		}

		result, err := RetryWithResult(ctx, fn, 2, time.Millisecond, "TestFunction")

		if err == nil {
			t.Error("期望有错误，但没有得到错误")
		}

		var zero string
		if result != zero {
			t.Errorf("期望零值结果，但得到: %s", result)
		}

		if callCount != 3 { // 初始1次 + 2次重试
			t.Errorf("期望调用3次，但实际调用%d次", callCount)
		}
	})

	t.Run("上下文取消", func(t *testing.T) {
		callCount := 0
		fn := func() (string, error) {
			callCount++
			return "", errors.New("错误")
		}

		// 创建一个已取消的上下文
		ctx, cancel := context.WithCancel(ctx)
		cancel()

		result, err := RetryWithResult(ctx, fn, 5, time.Millisecond, "TestFunction")

		if err == nil {
			t.Error("期望有错误，但没有得到错误")
		}

		if err != context.Canceled {
			t.Errorf("期望 context.Canceled 错误，但得到: %v", err)
		}

		var zero string
		if result != zero {
			t.Errorf("期望零值结果，但得到: %s", result)
		}

		if callCount != 1 {
			t.Errorf("期望调用1次，但实际调用%d次", callCount)
		}
	})
}

func TestRetryWithArgs(t *testing.T) {
	ctx := context.Background()

	t.Run("成功执行无须重试", func(t *testing.T) {
		callCount := 0
		fn := func(input string) (string, error) {
			callCount++
			return "hello " + input, nil
		}

		result, err := RetryWithArgs(ctx, fn, "world", 3, time.Millisecond, "TestFunction")

		if err != nil {
			t.Errorf("期望无错误，但得到: %v", err)
		}

		if result != "hello world" {
			t.Errorf("期望结果为 'hello world'，但得到: %s", result)
		}

		if callCount != 1 {
			t.Errorf("期望调用1次，但实际调用%d次", callCount)
		}
	})

	t.Run("重试后成功", func(t *testing.T) {
		callCount := 0
		fn := func(input int) (int, error) {
			callCount++
			if callCount < 3 {
				return 0, errors.New("临时错误")
			}
			return input * 2, nil
		}

		result, err := RetryWithArgs(ctx, fn, 5, 5, time.Millisecond, "TestFunction")

		if err != nil {
			t.Errorf("期望无错误，但得到: %v", err)
		}

		if result != 10 {
			t.Errorf("期望结果为 10，但得到: %d", result)
		}

		if callCount != 3 {
			t.Errorf("期望调用3次，但实际调用%d次", callCount)
		}
	})

	t.Run("重试次数耗尽仍失败", func(t *testing.T) {
		callCount := 0
		fn := func(input bool) (bool, error) {
			callCount++
			return false, errors.New("持续错误")
		}

		result, err := RetryWithArgs(ctx, fn, true, 2, time.Millisecond, "TestFunction")

		if err == nil {
			t.Error("期望有错误，但没有得到错误")
		}

		if result != false {
			t.Errorf("期望false结果，但得到: %v", result)
		}

		if callCount != 3 { // 初始1次 + 2次重试
			t.Errorf("期望调用3次，但实际调用%d次", callCount)
		}
	})
}

func TestRetryWithCtxArgs(t *testing.T) {
	ctx := context.Background()

	t.Run("成功执行无须重试", func(t *testing.T) {
		callCount := 0
		fn := func(ctx context.Context, input string) (string, error) {
			callCount++
			return "processed " + input, nil
		}

		result, err := RetryWithCtxArgs(ctx, fn, "data", 3, time.Millisecond, "TestFunction")

		if err != nil {
			t.Errorf("期望无错误，但得到: %v", err)
		}

		if result != "processed data" {
			t.Errorf("期望结果为 'processed data'，但得到: %s", result)
		}

		if callCount != 1 {
			t.Errorf("期望调用1次，但实际调用%d次", callCount)
		}
	})

	t.Run("重试后成功", func(t *testing.T) {
		callCount := 0
		fn := func(ctx context.Context, input []int) ([]int, error) {
			callCount++
			if callCount < 2 {
				return nil, errors.New("临时错误")
			}
			return append(input, 999), nil
		}

		result, err := RetryWithCtxArgs(ctx, fn, []int{1, 2, 3}, 3, time.Millisecond, "TestFunction")

		if err != nil {
			t.Errorf("期望无错误，但得到: %v", err)
		}

		expected := []int{1, 2, 3, 999}
		if len(result) != len(expected) {
			t.Errorf("期望长度为 %d，但得到 %d", len(expected), len(result))
		} else {
			for i, v := range expected {
				if result[i] != v {
					t.Errorf("期望索引 %d 的值为 %d，但得到 %d", i, v, result[i])
				}
			}
		}

		if callCount != 2 {
			t.Errorf("期望调用2次，但实际调用%d次", callCount)
		}
	})

	t.Run("上下文超时", func(t *testing.T) {
		callCount := 0
		fn := func(ctx context.Context, input string) (string, error) {
			callCount++
			return "", errors.New("错误")
		}

		// 创建一个很快超时的上下文
		ctx, cancel := context.WithTimeout(ctx, time.Millisecond)
		defer cancel()

		result, err := RetryWithCtxArgs(ctx, fn, "test", 5, time.Millisecond*10, "TestFunction")

		if err == nil {
			t.Error("期望有错误，但没有得到错误")
		}

		if callCount != 1 {
			t.Errorf("期望调用1次，但实际调用%d次", callCount)
		}

		var zero string
		if result != zero {
			t.Errorf("期望零值结果，但得到: %s", result)
		}
	})
}
