package impl

import (
	"context"
	"fmt"
	"time"

	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"

	"go.uber.org/zap"
)

// RunDailyStatisticsTask 启动一个 goroutine，每天凌晨 1 点执行 SaveStatistics
func (uc *UseCase) RunDailyStatisticsTask() {
	go func() {
		for {
			log.Info("--------------------------------->定时任务开始")
			now := time.Now()

			// 设置目标时间为明天凌晨 1:00
			nextRun := time.Date(now.Year(), now.Month(), now.Day()+1, 1, 0, 0, 0, now.Location())

			// 计算距离下次执行的等待时间
			duration := nextRun.Sub(now)

			log.Info(fmt.Sprintf("⏰ 下次定时任务将在 %s 执行", nextRun.Format("2006-01-02 15:04:05")),
				zap.Duration("wait_time", duration))

			// 等待到执行时间
			time.Sleep(duration)

			// 执行任务
			log.Info("🔄 开始执行每日统计任务 SaveStatistics")

			err := uc.SaveStatistics(context.Background())
			if err != nil {
				log.Error("❌ 定时任务 SaveStatistics 执行失败", zap.Error(err))
			} else {
				log.Error("✅ 定时任务 SaveStatistics 成功完成")
			}
		}
	}()
}

// RunSyncTableCountTask 启动一个 goroutine，每5分钟执行一次 SyncTableCount
func (uc *UseCase) RunSyncTableCountTask() {
	go func() {
		for {
			log.Info("--------------------------------->同步表计数定时任务开始")
			now := time.Now()

			// 设置目标时间为明天凌晨 0:00
			nextRun := time.Date(now.Year(), now.Month(), now.Day()+1, 0, 0, 0, 0, now.Location())

			// 计算距离下次执行的等待时间
			duration := nextRun.Sub(now)

			log.Info(fmt.Sprintf("⏰ 下次同步表计数任务将在 %s 执行", nextRun.Format("2006-01-02 15:04:05")),
				zap.Duration("wait_time", duration))

			// 等待到执行时间
			time.Sleep(duration)

			// 执行任务
			log.Info("🔄 开始执行同步表计数任务 SyncTableCount")

			err := uc.SyncTableCount(context.Background())
			if err != nil {
				log.Error("❌ 定时任务 SyncTableCount 执行失败", zap.Error(err))
			} else {
				log.Error("✅ 定时任务 SyncTableCount 成功完成")
			}
		}
	}()
}
