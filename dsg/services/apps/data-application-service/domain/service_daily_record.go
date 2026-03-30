package domain

import (
	"context"
	"fmt"
	"strings"
	"time"

	"sync"

	"github.com/kweaver-ai/dsg/services/apps/data-application-service/adapter/driven/gorm"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"go.uber.org/zap"
)

// ServiceDailyRecordDomain 每日统计记录领域服务
type ServiceDailyRecordDomain struct {
	dailyRecordRepo gorm.ServiceDailyRecordRepo
	callRecordRepo  gorm.ServiceCallRecordRepo
	stopChan        chan struct{} // 停止信号
	isRunning       bool          // 运行状态
	mu              sync.RWMutex  // 保护状态变量
}

// start GetDailyStatistic
type GetDailyStatisticsReq struct {
	DepartmentID string `form:"department_id"`
	ServiceType  string `form:"service_type"`
	Key          string `form:"key"`
	StartTime    string `form:"start_time"` //格式：2025-01-01
	EndTime      string `form:"end_time"`   //格式：2025-01-01
}

type GetDailyStatisticsRes struct {
	DailyStatistics []*DailyStatistics `json:"daily_statistics"`
}

type DailyStatistics struct {
	SuccessCount int64  `json:"success_count"`
	FailCount    int64  `json:"fail_count"`
	OnlineCount  int64  `json:"online_count"`
	ApplyCount   int64  `json:"apply_count"`
	RecordDate   string `json:"record_date"`
}

// end GetDailyStatistics

// NewServiceDailyRecordDomain 创建每日统计记录领域服务
func NewServiceDailyRecordDomain(dailyRecordRepo gorm.ServiceDailyRecordRepo, callRecordRepo gorm.ServiceCallRecordRepo) *ServiceDailyRecordDomain {
	return &ServiceDailyRecordDomain{
		dailyRecordRepo: dailyRecordRepo,
		callRecordRepo:  callRecordRepo,
		stopChan:        make(chan struct{}),
		isRunning:       false,
		mu:              sync.RWMutex{},
	}
}

// StartDailyRecordJob 启动定时任务，每天00:00:00为当天创建基础统计记录
func (d *ServiceDailyRecordDomain) StartDailyRecordJob() {
	// 检查是否已经在运行
	d.mu.Lock()
	if d.isRunning {
		d.mu.Unlock()
		log.Warn("StartDailyRecordJob 已经在运行中")
		return
	}
	d.isRunning = true
	d.stopChan = make(chan struct{})
	d.mu.Unlock()

	// 添加空指针检查
	if d == nil {
		log.Error("StartDailyRecordJob: ServiceDailyRecordDomain is nil")
		return
	}
	if d.dailyRecordRepo == nil {
		log.Error("StartDailyRecordJob: dailyRecordRepo is nil")
		return
	}

	log.Info("StartDailyRecordJob 定时任务已启动")

	// 记录当前时区和时间信息，便于排查问题
	now := time.Now()
	utcNow := now.UTC()
	log.Info("StartDailyRecordJob 时区信息",
		zap.String("localTime", now.Format("2006-01-02 15:04:05 MST")),
		zap.String("utcTime", utcNow.Format("2006-01-02 15:04:05 MST")),
		zap.String("location", now.Location().String()))

	// 启动时先检查并创建今天的记录（如果缺失的话）
	ctx := context.Background()
	today := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
	log.WithContext(ctx).Info("StartDailyRecordJob 启动时检查当天记录", zap.String("date", today.Format("2006-01-02")))

	err := d.dailyRecordRepo.GenerateDailyRecords(ctx, today)
	if err != nil {
		log.WithContext(ctx).Error("StartDailyRecordJob 启动时创建当天记录失败", zap.Error(err))
	} else {
		log.WithContext(ctx).Info("StartDailyRecordJob 启动时检查当天记录完成", zap.String("date", today.Format("2006-01-02")))
	}

	// 删除过期的记录
	err = d.dailyRecordRepo.DeleteExpiredRecords(ctx)
	if err != nil {
		log.WithContext(ctx).Error("StartDailyRecordJob 启动时删除过期记录失败", zap.Error(err))
	} else {
		log.WithContext(ctx).Info("StartDailyRecordJob 启动时删除过期记录完成")
	}

	// 删除过期的服务调用记录
	if d.callRecordRepo != nil {
		err = d.callRecordRepo.DeleteExpiredRecords(ctx)
		if err != nil {
			log.WithContext(ctx).Error("StartDailyRecordJob 启动时删除过期服务调用记录失败", zap.Error(err))
		} else {
			log.WithContext(ctx).Info("StartDailyRecordJob 启动时删除过期服务调用记录完成")
		}
	}

	// 启动时同步所有记录的部门信息
	log.WithContext(ctx).Info("StartDailyRecordJob 启动时同步历史部门信息")
	err = d.dailyRecordRepo.SyncAllRecordsDepartmentInfo(ctx)
	if err != nil {
		log.WithContext(ctx).Error("StartDailyRecordJob 启动时同步历史部门信息失败", zap.Error(err))
	} else {
		log.WithContext(ctx).Info("StartDailyRecordJob 启动时同步历史部门信息完成")
	}

	// 启动定时任务goroutine
	go d.runScheduledJob()
}

// runScheduledJob 运行定时任务的核心逻辑
func (d *ServiceDailyRecordDomain) runScheduledJob() {
	// 添加panic恢复机制
	defer func() {
		if r := recover(); r != nil {
			log.Error("StartDailyRecordJob panic recovered",
				zap.Any("panic", r))
		}

		// 确保状态被正确重置
		d.mu.Lock()
		d.isRunning = false
		d.mu.Unlock()

		log.Info("StartDailyRecordJob goroutine已退出")
	}()

	for {
		// 检查是否收到停止信号
		select {
		case <-d.stopChan:
			log.Info("StartDailyRecordJob 收到停止信号，退出循环")
			return
		default:
			// 继续执行
		}

		now := time.Now()
		// 计算下一个00:00:00的时间，确保使用固定时区（避免时区问题）
		var next time.Time

		// 方案1: 使用当前时间的下一个午夜（如果已经过了今天00:00:00，则计算明天00:00:00）
		today := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
		if now.After(today) || now.Equal(today) {
			// 已经是今天00:00:00之后，计算明天00:00:00
			tomorrow := today.Add(24 * time.Hour)
			next = tomorrow
		} else {
			// 理论上不会到这里，但为了安全起见
			next = today
		}

		duration := next.Sub(now)
		log.Info("StartDailyRecordJob 下次执行时间",
			zap.String("currentTime", now.Format("2006-01-02 15:04:05 MST")),
			zap.String("nextTime", next.Format("2006-01-02 15:04:05 MST")),
			zap.Duration("waitDuration", duration),
			zap.String("location", now.Location().String()))

		// 添加最小等待时间限制，避免异常情况下的忙等待
		if duration < time.Minute {
			log.Warn("StartDailyRecordJob 等待时间过短，调整为1小时后重试",
				zap.Duration("originalDuration", duration))
			duration = time.Hour
			next = now.Add(duration)
		}

		// 使用select机制改进timer管理
		timer := time.NewTimer(duration)
		select {
		case <-timer.C:
			timer.Stop() // 确保timer被停止
		case <-d.stopChan:
			timer.Stop() // 确保timer被停止
			log.Info("StartDailyRecordJob 在等待期间收到停止信号")
			return
		}

		// 执行定时任务，增加重试机制
		d.executeWithRetry()
	}
}

// StopDailyRecordJob 停止定时任务
func (d *ServiceDailyRecordDomain) StopDailyRecordJob() {
	d.mu.Lock()
	defer d.mu.Unlock()

	if d.isRunning {
		close(d.stopChan)
		d.isRunning = false
		log.Info("StartDailyRecordJob 已停止")
	} else {
		log.Info("StartDailyRecordJob 当前未在运行")
	}
}

// IsRunning 检查定时任务是否正在运行
func (d *ServiceDailyRecordDomain) IsRunning() bool {
	d.mu.RLock()
	defer d.mu.RUnlock()
	return d.isRunning
}

// executeWithRetry 执行定时任务，包含重试机制
func (d *ServiceDailyRecordDomain) executeWithRetry() {
	// 添加超时控制
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Minute)
	defer cancel()

	maxRetries := 3

	for attempt := 1; attempt <= maxRetries; attempt++ {
		// 检查是否收到停止信号
		select {
		case <-d.stopChan:
			log.Info("executeWithRetry 收到停止信号，退出重试")
			return
		default:
			// 继续执行
		}

		// 执行时为当天创建基础记录
		now := time.Now()
		today := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())

		log.WithContext(ctx).Info("StartDailyRecordJob 开始为当天创建基础统计记录",
			zap.String("date", today.Format("2006-01-02")),
			zap.Int("attempt", attempt),
			zap.Int("maxRetries", maxRetries))

		// 再次检查dailyRecordRepo是否为nil
		if d.dailyRecordRepo == nil {
			log.WithContext(ctx).Error("StartDailyRecordJob: dailyRecordRepo is nil during execution")
			return
		}

		// 使用带超时的context执行任务
		err := d.dailyRecordRepo.GenerateDailyRecords(ctx, today)
		if err != nil {
			log.WithContext(ctx).Error("StartDailyRecordJob failed",
				zap.Error(err),
				zap.Int("attempt", attempt),
				zap.Int("maxRetries", maxRetries))

			if attempt < maxRetries {
				// 等待一段时间后重试，使用指数退避
				retryDelay := time.Duration(attempt) * time.Minute
				log.WithContext(ctx).Info("StartDailyRecordJob 将在一段时间后重试",
					zap.Duration("retryDelay", retryDelay))

				// 使用select等待，支持提前退出
				select {
				case <-time.After(retryDelay):
					// 继续重试
				case <-d.stopChan:
					log.Info("executeWithRetry 在重试等待期间收到停止信号")
					return
				case <-ctx.Done():
					log.Warn("executeWithRetry 执行超时，退出重试")
					return
				}
				continue
			} else {
				log.WithContext(ctx).Error("StartDailyRecordJob 达到最大重试次数，放弃执行")
				return
			}
		}

		// 生成成功后，删除过期记录
		err = d.dailyRecordRepo.DeleteExpiredRecords(ctx)
		if err != nil {
			log.WithContext(ctx).Error("StartDailyRecordJob 删除过期记录失败",
				zap.Error(err),
				zap.Int("attempt", attempt),
				zap.Int("maxRetries", maxRetries))

			if attempt < maxRetries {
				retryDelay := time.Duration(attempt) * time.Minute
				log.WithContext(ctx).Info("StartDailyRecordJob 将在一段时间后重试",
					zap.Duration("retryDelay", retryDelay))

				select {
				case <-time.After(retryDelay):
					// 继续重试
				case <-d.stopChan:
					log.Info("executeWithRetry 在重试等待期间收到停止信号")
					return
				case <-ctx.Done():
					log.Warn("executeWithRetry 执行超时，退出重试")
					return
				}
				continue
			} else {
				log.WithContext(ctx).Error("StartDailyRecordJob 达到最大重试次数，放弃执行")
				return
			}
		}

		// 删除过期的服务调用记录
		if d.callRecordRepo != nil {
			err = d.callRecordRepo.DeleteExpiredRecords(ctx)
			if err != nil {
				log.WithContext(ctx).Error("StartDailyRecordJob 删除过期服务调用记录失败",
					zap.Error(err),
					zap.Int("attempt", attempt),
					zap.Int("maxRetries", maxRetries))
				// 服务调用记录删除失败不影响主流程，只记录错误
			} else {
				log.WithContext(ctx).Info("StartDailyRecordJob 删除过期服务调用记录完成")
			}
		}

		log.WithContext(ctx).Info("StartDailyRecordJob completed successfully",
			zap.String("date", today.Format("2006-01-02")),
			zap.Int("attempt", attempt))
		return
	}
}

func (d *ServiceDailyRecordDomain) GetDailyStatistics(ctx context.Context, req *GetDailyStatisticsReq) (res *GetDailyStatisticsRes, err error) {
	// 处理默认时间范围：如果没有传时间参数，默认展示最近7天数据
	startTime := req.StartTime
	endTime := req.EndTime

	if endTime == "" {
		// 如果没有传EndTime，设置为今天
		endTime = time.Now().Format("2006-01-02")
	}

	if startTime == "" {
		// 如果没有传StartTime，设置为6天前（连同今天共7天）
		sixDaysAgo := time.Now().AddDate(0, 0, -6)
		startTime = sixDaysAgo.Format("2006-01-02")
	}

	// 处理多个departmentID：按逗号拆分
	var departmentIDs []string
	if req.DepartmentID != "" {
		departmentIDs = strings.Split(req.DepartmentID, ",")
		// 去除空字符串和前后空格
		var validDepartmentIDs []string
		for _, id := range departmentIDs {
			trimmedID := strings.TrimSpace(id)
			if trimmedID != "" {
				validDepartmentIDs = append(validDepartmentIDs, trimmedID)
			}
		}
		departmentIDs = validDepartmentIDs
	}

	// 调用数据库查询方法
	results, err := d.dailyRecordRepo.GetDailyStatistics(ctx, departmentIDs, req.ServiceType, req.Key, startTime, endTime)
	if err != nil {
		log.WithContext(ctx).Error("ServiceDailyRecordDomain GetDailyStatistics", zap.Error(err))
		return nil, err
	}

	// 转换为响应格式
	var dailyStatistics []*DailyStatistics
	for _, result := range results {
		dailyStatistics = append(dailyStatistics, &DailyStatistics{
			SuccessCount: result.SuccessCount,
			FailCount:    result.FailCount,
			OnlineCount:  result.OnlineCount,
			ApplyCount:   result.ApplyCount,
			RecordDate:   result.RecordDate, // 数据库查询中使用DATE()函数已确保格式为'yyyy-mm-dd'
		})
	}

	res = &GetDailyStatisticsRes{
		DailyStatistics: dailyStatistics,
	}

	log.WithContext(ctx).Info("ServiceDailyRecordDomain GetDailyStatistics success",
		zap.Int("recordCount", len(dailyStatistics)),
		zap.Strings("departmentIDs", departmentIDs),
		zap.String("startTime", startTime),
		zap.String("endTime", endTime))

	return res, nil
}

// RepairMissingDailyRecords 修复缺失的每日记录
func (d *ServiceDailyRecordDomain) RepairMissingDailyRecords(ctx context.Context, startDateStr, endDateStr string) error {
	// 解析日期参数
	startDate, err := time.Parse("2006-01-02", startDateStr)
	if err != nil {
		log.WithContext(ctx).Error("ServiceDailyRecordDomain RepairMissingDailyRecords 开始日期格式错误", zap.Error(err))
		return err
	}

	endDate, err := time.Parse("2006-01-02", endDateStr)
	if err != nil {
		log.WithContext(ctx).Error("ServiceDailyRecordDomain RepairMissingDailyRecords 结束日期格式错误", zap.Error(err))
		return err
	}

	// 验证日期范围
	if startDate.After(endDate) {
		log.WithContext(ctx).Error("ServiceDailyRecordDomain RepairMissingDailyRecords 开始日期不能大于结束日期")
		return fmt.Errorf("开始日期不能大于结束日期")
	}

	// 限制修复范围，避免修复过多数据导致性能问题
	daysDiff := int(endDate.Sub(startDate).Hours() / 24)
	maxDays := 30 // 最多修复30天的数据
	if daysDiff > maxDays {
		log.WithContext(ctx).Error("ServiceDailyRecordDomain RepairMissingDailyRecords 修复范围过大",
			zap.Int("daysDiff", daysDiff),
			zap.Int("maxDays", maxDays))
		return fmt.Errorf("修复范围不能超过%d天", maxDays)
	}

	log.WithContext(ctx).Info("ServiceDailyRecordDomain RepairMissingDailyRecords 开始修复",
		zap.String("startDate", startDateStr),
		zap.String("endDate", endDateStr),
		zap.Int("daysDiff", daysDiff))

	// 调用数据库修复方法
	err = d.dailyRecordRepo.RepairMissingRecords(ctx, startDate, endDate)
	if err != nil {
		log.WithContext(ctx).Error("ServiceDailyRecordDomain RepairMissingDailyRecords", zap.Error(err))
		return err
	}

	log.WithContext(ctx).Info("ServiceDailyRecordDomain RepairMissingDailyRecords 修复完成")
	return nil
}
