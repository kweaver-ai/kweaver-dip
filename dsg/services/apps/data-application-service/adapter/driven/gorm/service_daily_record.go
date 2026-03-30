package gorm

import (
	"context"
	"time"

	"github.com/kweaver-ai/dsg/services/apps/data-application-service/infrastructure/repository/db"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"go.uber.org/zap"
	"gorm.io/gorm"
)

type ServiceDailyRecordRepo interface {
	BatchCreate(ctx context.Context, records []*model.ServiceDailyRecord) error
	Exists(ctx context.Context, serviceID string, recordDate time.Time) (bool, error)
	GetOnlineServices(ctx context.Context) ([]*model.Service, error)
	GetServiceStats(ctx context.Context) ([]*model.ServiceStatsInfo, error)
	GenerateDailyRecords(ctx context.Context, recordDate time.Time) error
	DeleteExpiredRecords(ctx context.Context) error
	// 批量查询相关方法
	GetExistingRecordsForDate(ctx context.Context, recordDate time.Time) (map[string]bool, error)
	// 状态变更埋点相关方法
	UpdateOnlineCountOnStatusChange(ctx context.Context, serviceID, oldStatus, newStatus string) error
	EnsureTodayRecordExists(ctx context.Context, serviceID string) error
	UpdateOnlineCount(ctx context.Context, serviceID string, onlineCount int) error
	GetServiceInfo(ctx context.Context, serviceID string) (*model.Service, error)
	// 批量同步相关方法
	SyncOnlineCountWithServiceStatus(ctx context.Context) error
	GetAllServicesStatusForSync(ctx context.Context) ([]*model.Service, error)
	GetTodayRecordsForSync(ctx context.Context) ([]*model.ServiceDailyRecord, error)
	BatchUpdateOnlineCount(ctx context.Context, updates []ServiceOnlineCountUpdate) error
	BatchCreateMissingRecords(ctx context.Context, missingServices []*model.Service) error
	// 申请数量更新相关方法
	IncrementApplyCount(ctx context.Context, serviceID string) error
	// 每日统计查询相关方法
	GetDailyStatistics(ctx context.Context, departmentIDs []string, serviceType, key, startTime, endTime string) ([]*DailyStatisticsResult, error)
	// 部门信息校验相关方法
	ValidateAndFixDepartmentInfo(ctx context.Context, services []*model.Service, recordDate time.Time) error
	SyncAllRecordsDepartmentInfo(ctx context.Context) error
	SyncSingleServiceHistoryDepartmentInfo(ctx context.Context, serviceID string) error
	// 数据修复相关方法
	RepairMissingRecords(ctx context.Context, startDate, endDate time.Time) error
}

// ServiceOnlineCountUpdate 批量更新在线数量的结构体
type ServiceOnlineCountUpdate struct {
	ServiceID   string
	OnlineCount int
}

// DailyStatisticsResult 每日统计查询结果
type DailyStatisticsResult struct {
	SuccessCount int64  `json:"success_count"`
	FailCount    int64  `json:"fail_count"`
	OnlineCount  int64  `json:"online_count"`
	ApplyCount   int64  `json:"apply_count"`
	RecordDate   string `json:"record_date"`
}

type serviceDailyRecordRepo struct {
	data *db.Data
}

func NewServiceDailyRecordRepo(data *db.Data) ServiceDailyRecordRepo {
	return &serviceDailyRecordRepo{data: data}
}

func (r *serviceDailyRecordRepo) BatchCreate(ctx context.Context, records []*model.ServiceDailyRecord) error {
	if len(records) == 0 {
		return nil
	}
	return r.data.DB.WithContext(ctx).Create(&records).Error
}

func (r *serviceDailyRecordRepo) Exists(ctx context.Context, serviceID string, recordDate time.Time) (bool, error) {
	var count int64
	err := r.data.DB.WithContext(ctx).
		Model(&model.ServiceDailyRecord{}).
		Where("service_id = ? AND record_date = ?", serviceID, recordDate).
		Count(&count).Error
	return count > 0, err
}

func (r *serviceDailyRecordRepo) GetOnlineServices(ctx context.Context) ([]*model.Service, error) {
	var services []*model.Service
	err := r.data.DB.WithContext(ctx).
		Where("status = ? AND delete_time = 0", "online").
		Find(&services).Error
	if err != nil {
		log.WithContext(ctx).Error("serviceDailyRecordRepo GetOnlineServices", zap.Error(err))
		return nil, err
	}
	return services, nil
}

func (r *serviceDailyRecordRepo) GetServiceStats(ctx context.Context) ([]*model.ServiceStatsInfo, error) {
	var stats []*model.ServiceStatsInfo
	err := r.data.DB.WithContext(ctx).Find(&stats).Error
	if err != nil {
		log.WithContext(ctx).Error("serviceDailyRecordRepo GetServiceStats", zap.Error(err))
		return nil, err
	}
	return stats, nil
}

func (r *serviceDailyRecordRepo) GenerateDailyRecords(ctx context.Context, recordDate time.Time) error {
	// 1. 查询所有未删除的service（不仅仅是在线的）
	services, err := r.GetAllServicesForDailyRecord(ctx)
	if err != nil {
		return err
	}

	// 2. 查询所有service的apply_count
	stats, err := r.GetServiceStats(ctx)
	if err != nil {
		return err
	}

	// 3. 构建 serviceID -> applyNum 的映射
	applyMap := make(map[string]uint64)
	for _, s := range stats {
		applyMap[s.ServiceID] = s.ApplyNum
	}

	// 4. 批量查询已存在的记录，避免重复插入
	existingRecords, err := r.GetExistingRecordsForDate(ctx, recordDate)
	if err != nil {
		log.WithContext(ctx).Error("serviceDailyRecordRepo GenerateDailyRecords GetExistingRecordsForDate", zap.Error(err))
		return err
	}

	// 5. 组装并批量插入新记录
	var records []*model.ServiceDailyRecord
	for _, svc := range services {
		// 检查是否已存在记录，避免重复插入
		if existingRecords[svc.ServiceID] {
			continue
		}

		// 根据当前状态设置初始online_count
		onlineCount := 0
		if svc.Status == "online" {
			onlineCount = 1
		}

		record := &model.ServiceDailyRecord{
			ServiceID:             svc.ServiceID,
			ServiceName:           svc.ServiceName,
			ServiceDepartmentID:   svc.DepartmentID,
			ServiceDepartmentName: svc.DepartmentName,
			ServiceType:           svc.ServiceType,
			RecordDate:            recordDate,
			SuccessCount:          0,
			FailCount:             0,
			OnlineCount:           onlineCount, // 根据当前状态设置
			ApplyCount:            int(applyMap[svc.ServiceID]),
		}
		records = append(records, record)
	}

	if len(records) > 0 {
		err = r.BatchCreate(ctx, records)
		if err != nil {
			log.WithContext(ctx).Error("serviceDailyRecordRepo GenerateDailyRecords BatchCreate", zap.Error(err))
			return err
		}
		log.WithContext(ctx).Info("serviceDailyRecordRepo GenerateDailyRecords success", zap.Int("count", len(records)))
	} else {
		log.WithContext(ctx).Info("serviceDailyRecordRepo GenerateDailyRecords 无新记录需要创建")
	}

	return nil
}

// 删除过期的记录,过期时间为30天
func (r *serviceDailyRecordRepo) DeleteExpiredRecords(ctx context.Context) error {
	now := time.Now()
	thirtyDaysAgo := now.AddDate(0, 0, -30)

	return r.data.DB.WithContext(ctx).
		Where("record_date < ?", thirtyDaysAgo).
		Delete(&model.ServiceDailyRecord{}).Error
}

// GetAllServicesForDailyRecord 获取所有未删除且不是已变更的service用于创建每日记录
func (r *serviceDailyRecordRepo) GetAllServicesForDailyRecord(ctx context.Context) ([]*model.Service, error) {
	var services []*model.Service
	err := r.data.DB.WithContext(ctx).
		Select("service_id, service_name, department_id, department_name, service_type, status").
		Where("delete_time = 0 and (is_changed = '0' OR is_changed = '')").
		Find(&services).Error
	if err != nil {
		log.WithContext(ctx).Error("serviceDailyRecordRepo GetAllServicesForDailyRecord", zap.Error(err))
		return nil, err
	}
	return services, nil
}

// UpdateOnlineCountOnStatusChange 监听 service 状态变更并更新统计
func (r *serviceDailyRecordRepo) UpdateOnlineCountOnStatusChange(ctx context.Context, serviceID, oldStatus, newStatus string) error {
	// 只有在状态真正变更时才处理
	if oldStatus == newStatus {
		return nil
	}

	// 确保今日记录存在
	if err := r.EnsureTodayRecordExists(ctx, serviceID); err != nil {
		log.WithContext(ctx).Error("serviceDailyRecordRepo UpdateOnlineCountOnStatusChange EnsureTodayRecordExists", zap.Error(err))
		return err
	}

	var onlineCount int
	// 判断状态变化逻辑
	isOldOnline := oldStatus == "online"
	isNewOnline := newStatus == "online"

	if !isOldOnline && isNewOnline {
		// 从非online变为online：online_count = 1
		onlineCount = 1
	} else if isOldOnline && !isNewOnline {
		// 从online变为非online：online_count = 0
		onlineCount = 0
	} else {
		// 其他情况不需要更新
		return nil
	}

	return r.UpdateOnlineCount(ctx, serviceID, onlineCount)
}

// ValidateAndFixDepartmentInfo 校验并修复服务每日记录的部门信息
func (r *serviceDailyRecordRepo) ValidateAndFixDepartmentInfo(ctx context.Context, services []*model.Service, recordDate time.Time) error {
	if len(services) == 0 {
		return nil
	}

	// 构建 serviceID -> service 的映射
	serviceMap := make(map[string]*model.Service)
	for _, svc := range services {
		serviceMap[svc.ServiceID] = svc
	}

	// 查询指定日期的所有记录
	var existingRecords []*model.ServiceDailyRecord
	err := r.data.DB.WithContext(ctx).
		Select("service_id, service_department_id, service_department_name").
		Where("record_date = ?", recordDate).
		Find(&existingRecords).Error
	if err != nil {
		log.WithContext(ctx).Error("serviceDailyRecordRepo ValidateAndFixDepartmentInfo query", zap.Error(err))
		return err
	}

	var needUpdateRecords []string
	for _, record := range existingRecords {
		if service, exists := serviceMap[record.ServiceID]; exists {
			// 校验部门信息是否一致
			if record.ServiceDepartmentID != service.DepartmentID || record.ServiceDepartmentName != service.DepartmentName {
				needUpdateRecords = append(needUpdateRecords, record.ServiceID)
				log.WithContext(ctx).Info("serviceDailyRecordRepo ValidateAndFixDepartmentInfo 发现部门信息不一致",
					zap.String("serviceID", record.ServiceID),
					zap.String("recordDeptID", record.ServiceDepartmentID),
					zap.String("serviceDeptID", service.DepartmentID),
					zap.String("recordDeptName", record.ServiceDepartmentName),
					zap.String("serviceDeptName", service.DepartmentName))
			}
		}
	}

	// 批量更新部门信息不一致的记录
	if len(needUpdateRecords) > 0 {
		err = r.batchUpdateDepartmentInfo(ctx, serviceMap, needUpdateRecords, recordDate)
		if err != nil {
			log.WithContext(ctx).Error("serviceDailyRecordRepo ValidateAndFixDepartmentInfo batchUpdate", zap.Error(err))
			return err
		}
		log.WithContext(ctx).Info("serviceDailyRecordRepo ValidateAndFixDepartmentInfo 批量修复部门信息完成",
			zap.Int("count", len(needUpdateRecords)),
			zap.Strings("serviceIDs", needUpdateRecords))
	}

	return nil
}

// batchUpdateDepartmentInfo 批量更新部门信息
func (r *serviceDailyRecordRepo) batchUpdateDepartmentInfo(ctx context.Context, serviceMap map[string]*model.Service, serviceIDs []string, recordDate time.Time) error {
	return r.data.DB.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		for _, serviceID := range serviceIDs {
			if service, exists := serviceMap[serviceID]; exists {
				result := tx.Model(&model.ServiceDailyRecord{}).
					Where("service_id = ? AND record_date = ?", serviceID, recordDate).
					Updates(map[string]interface{}{
						"service_department_id":   service.DepartmentID,
						"service_department_name": service.DepartmentName,
					})
				if result.Error != nil {
					log.WithContext(ctx).Error("serviceDailyRecordRepo batchUpdateDepartmentInfo",
						zap.String("serviceID", serviceID),
						zap.Error(result.Error))
					return result.Error
				}
			}
		}
		return nil
	})
}

// EnsureTodayRecordExists 确保今日记录存在，不存在则插入
func (r *serviceDailyRecordRepo) EnsureTodayRecordExists(ctx context.Context, serviceID string) error {
	today := time.Now()
	todayDate := time.Date(today.Year(), today.Month(), today.Day(), 0, 0, 0, 0, today.Location())

	// 检查记录是否存在
	exists, err := r.Exists(ctx, serviceID, todayDate)
	if err != nil {
		return err
	}

	// 获取 service 信息
	service, err := r.GetServiceInfo(ctx, serviceID)
	if err != nil {
		log.WithContext(ctx).Error("serviceDailyRecordRepo EnsureTodayRecordExists GetServiceInfo", zap.Error(err))
		return err
	}

	if exists {
		// 记录已存在，直接返回
		return nil
	}

	// 创建今日记录
	record := &model.ServiceDailyRecord{
		ServiceID:             serviceID,
		ServiceName:           service.ServiceName,
		ServiceDepartmentID:   service.DepartmentID,
		ServiceDepartmentName: service.DepartmentName,
		ServiceType:           service.ServiceType,
		RecordDate:            todayDate,
		SuccessCount:          0,
		FailCount:             0,
		OnlineCount:           0, // 初始为0，由调用方决定具体值
		ApplyCount:            0,
	}

	err = r.data.DB.WithContext(ctx).Create(record).Error
	if err != nil {
		log.WithContext(ctx).Error("serviceDailyRecordRepo EnsureTodayRecordExists Create", zap.Error(err))
		return err
	}

	log.WithContext(ctx).Info("serviceDailyRecordRepo EnsureTodayRecordExists created new record", zap.String("serviceID", serviceID))
	return nil
}

// validateAndFixSingleRecordDepartment 校验并修复单个记录的部门信息
func (r *serviceDailyRecordRepo) validateAndFixSingleRecordDepartment(ctx context.Context, serviceID string, service *model.Service, recordDate time.Time) error {
	// 查询当前记录的部门信息
	var currentRecord model.ServiceDailyRecord
	err := r.data.DB.WithContext(ctx).
		Select("service_department_id, service_department_name").
		Where("service_id = ? AND record_date = ?", serviceID, recordDate).
		First(&currentRecord).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil // 记录不存在，无需修复
		}
		return err
	}

	// 检查部门信息是否一致
	if currentRecord.ServiceDepartmentID != service.DepartmentID || currentRecord.ServiceDepartmentName != service.DepartmentName {
		log.WithContext(ctx).Info("serviceDailyRecordRepo validateAndFixSingleRecordDepartment 发现部门信息不一致，开始修复",
			zap.String("serviceID", serviceID),
			zap.String("recordDeptID", currentRecord.ServiceDepartmentID),
			zap.String("serviceDeptID", service.DepartmentID),
			zap.String("recordDeptName", currentRecord.ServiceDepartmentName),
			zap.String("serviceDeptName", service.DepartmentName))

		// 更新部门信息
		result := r.data.DB.WithContext(ctx).
			Model(&model.ServiceDailyRecord{}).
			Where("service_id = ? AND record_date = ?", serviceID, recordDate).
			Updates(map[string]interface{}{
				"service_department_id":   service.DepartmentID,
				"service_department_name": service.DepartmentName,
			})
		if result.Error != nil {
			log.WithContext(ctx).Error("serviceDailyRecordRepo validateAndFixSingleRecordDepartment update failed", zap.Error(result.Error))
			return result.Error
		}

		log.WithContext(ctx).Info("serviceDailyRecordRepo validateAndFixSingleRecordDepartment 部门信息修复成功",
			zap.String("serviceID", serviceID))
	}

	return nil
}

// SyncAllRecordsDepartmentInfo 同步所有记录的部门信息
func (r *serviceDailyRecordRepo) SyncAllRecordsDepartmentInfo(ctx context.Context) error {
	// 获取所有service信息
	services, err := r.GetAllServicesForDailyRecord(ctx)
	if err != nil {
		log.WithContext(ctx).Error("serviceDailyRecordRepo SyncAllRecordsDepartmentInfo GetAllServicesForDailyRecord", zap.Error(err))
		return err
	}

	if len(services) == 0 {
		log.WithContext(ctx).Info("serviceDailyRecordRepo SyncAllRecordsDepartmentInfo 无service数据")
		return nil
	}

	// 构建 serviceID -> service 的映射
	serviceMap := make(map[string]*model.Service)
	serviceIDs := make([]string, 0, len(services))
	for _, svc := range services {
		serviceMap[svc.ServiceID] = svc
		serviceIDs = append(serviceIDs, svc.ServiceID)
	}

	// 查询所有service对应的每日记录
	var allRecords []*model.ServiceDailyRecord
	err = r.data.DB.WithContext(ctx).
		Select("service_id, service_department_id, service_department_name, record_date").
		Where("service_id IN ?", serviceIDs).
		Find(&allRecords).Error
	if err != nil {
		log.WithContext(ctx).Error("serviceDailyRecordRepo SyncAllRecordsDepartmentInfo query records", zap.Error(err))
		return err
	}

	// 按日期分组需要更新的记录
	dateUpdateMap := make(map[time.Time][]string) // date -> serviceIDs
	updateCount := 0

	for _, record := range allRecords {
		if service, exists := serviceMap[record.ServiceID]; exists {
			// 校验部门信息是否一致
			if record.ServiceDepartmentID != service.DepartmentID || record.ServiceDepartmentName != service.DepartmentName {
				recordDate := record.RecordDate.Truncate(24 * time.Hour)
				if _, exists := dateUpdateMap[recordDate]; !exists {
					dateUpdateMap[recordDate] = make([]string, 0)
				}
				dateUpdateMap[recordDate] = append(dateUpdateMap[recordDate], record.ServiceID)
				updateCount++

				log.WithContext(ctx).Debug("serviceDailyRecordRepo SyncAllRecordsDepartmentInfo 发现部门信息不一致",
					zap.String("serviceID", record.ServiceID),
					zap.String("recordDate", recordDate.Format("2006-01-02")),
					zap.String("recordDeptID", record.ServiceDepartmentID),
					zap.String("serviceDeptID", service.DepartmentID))
			}
		}
	}

	if updateCount == 0 {
		log.WithContext(ctx).Info("serviceDailyRecordRepo SyncAllRecordsDepartmentInfo 所有记录部门信息一致，无需更新")
		return nil
	}

	// 按日期批量更新
	successCount := 0
	for recordDate, needUpdateServiceIDs := range dateUpdateMap {
		err = r.batchUpdateDepartmentInfo(ctx, serviceMap, needUpdateServiceIDs, recordDate)
		if err != nil {
			log.WithContext(ctx).Error("serviceDailyRecordRepo SyncAllRecordsDepartmentInfo batchUpdate failed",
				zap.String("recordDate", recordDate.Format("2006-01-02")),
				zap.Error(err))
			continue // 继续处理其他日期的数据
		}
		successCount += len(needUpdateServiceIDs)
	}

	log.WithContext(ctx).Info("serviceDailyRecordRepo SyncAllRecordsDepartmentInfo 批量同步部门信息完成",
		zap.Int("totalNeedUpdate", updateCount),
		zap.Int("successCount", successCount),
		zap.Int("totalServices", len(services)),
		zap.Int("totalRecords", len(allRecords)))

	return nil
}

// SyncSingleServiceHistoryDepartmentInfo 同步指定service的所有历史记录的部门信息
func (r *serviceDailyRecordRepo) SyncSingleServiceHistoryDepartmentInfo(ctx context.Context, serviceID string) error {
	// 获取service最新信息
	service, err := r.GetServiceInfo(ctx, serviceID)
	if err != nil {
		log.WithContext(ctx).Error("serviceDailyRecordRepo SyncSingleServiceHistoryDepartmentInfo GetServiceInfo",
			zap.String("serviceID", serviceID),
			zap.Error(err))
		return err
	}

	// 直接批量更新该service的所有历史记录部门信息
	result := r.data.DB.WithContext(ctx).
		Model(&model.ServiceDailyRecord{}).
		Where("service_id = ?", serviceID).
		Updates(map[string]interface{}{
			"service_department_id":   service.DepartmentID,
			"service_department_name": service.DepartmentName,
		})

	if result.Error != nil {
		log.WithContext(ctx).Error("serviceDailyRecordRepo SyncSingleServiceHistoryDepartmentInfo 批量更新失败",
			zap.String("serviceID", serviceID),
			zap.String("departmentID", service.DepartmentID),
			zap.String("departmentName", service.DepartmentName),
			zap.Error(result.Error))
		return result.Error
	}

	log.WithContext(ctx).Info("serviceDailyRecordRepo SyncSingleServiceHistoryDepartmentInfo 同步部门信息完成",
		zap.String("serviceID", serviceID),
		zap.String("departmentID", service.DepartmentID),
		zap.String("departmentName", service.DepartmentName),
		zap.Int64("affectedRows", result.RowsAffected))

	return nil
}

// UpdateOnlineCount 更新指定服务今日的 online_count
func (r *serviceDailyRecordRepo) UpdateOnlineCount(ctx context.Context, serviceID string, onlineCount int) error {
	today := time.Now()
	todayDate := time.Date(today.Year(), today.Month(), today.Day(), 0, 0, 0, 0, today.Location())

	result := r.data.DB.WithContext(ctx).
		Model(&model.ServiceDailyRecord{}).
		Where("service_id = ? AND record_date = ?", serviceID, todayDate).
		Update("online_count", onlineCount)

	if result.Error != nil {
		log.WithContext(ctx).Error("serviceDailyRecordRepo UpdateOnlineCount", zap.Error(result.Error))
		return result.Error
	}

	log.WithContext(ctx).Info("serviceDailyRecordRepo UpdateOnlineCount success",
		zap.String("serviceID", serviceID),
		zap.Int("onlineCount", onlineCount))

	return nil
}

// GetServiceInfo 获取 service 基本信息
func (r *serviceDailyRecordRepo) GetServiceInfo(ctx context.Context, serviceID string) (*model.Service, error) {
	var service model.Service
	err := r.data.DB.WithContext(ctx).
		Select("service_id, service_name, department_id, department_name, service_type").
		Where("service_id = ? AND delete_time = 0", serviceID).
		First(&service).Error

	if err != nil {
		log.WithContext(ctx).Error("serviceDailyRecordRepo GetServiceInfo", zap.Error(err))
		return nil, err
	}

	return &service, nil
}

// SyncOnlineCountWithServiceStatus 批量同步 service_daily_record 的 online_count 与 service 表的 status 状态
func (r *serviceDailyRecordRepo) SyncOnlineCountWithServiceStatus(ctx context.Context) error {
	// 1. 获取所有 service 的 status 状态
	services, err := r.GetAllServicesStatusForSync(ctx)
	if err != nil {
		log.WithContext(ctx).Error("serviceDailyRecordRepo SyncOnlineCountWithServiceStatus GetAllServicesStatusForSync", zap.Error(err))
		return err
	}

	// 2. 获取今日所有 service_daily_record 记录
	todayRecords, err := r.GetTodayRecordsForSync(ctx)
	if err != nil {
		log.WithContext(ctx).Error("serviceDailyRecordRepo SyncOnlineCountWithServiceStatus GetTodayRecordsForSync", zap.Error(err))
		return err
	}

	// 3. 构建今日记录的映射
	recordMap := make(map[string]*model.ServiceDailyRecord)
	for _, record := range todayRecords {
		recordMap[record.ServiceID] = record
	}

	// 4. 分析需要更新和创建的记录
	var updates []ServiceOnlineCountUpdate
	var missingServices []*model.Service

	for _, service := range services {
		expectedOnlineCount := 0
		if service.Status == "online" {
			expectedOnlineCount = 1
		}

		if record, exists := recordMap[service.ServiceID]; exists {
			// 记录存在，检查是否需要更新
			if record.OnlineCount != expectedOnlineCount {
				updates = append(updates, ServiceOnlineCountUpdate{
					ServiceID:   service.ServiceID,
					OnlineCount: expectedOnlineCount,
				})
			}
		} else {
			// 记录不存在，需要创建
			missingServices = append(missingServices, service)
		}
	}

	// 5. 批量更新已存在的记录
	if len(updates) > 0 {
		if err := r.BatchUpdateOnlineCount(ctx, updates); err != nil {
			log.WithContext(ctx).Error("serviceDailyRecordRepo SyncOnlineCountWithServiceStatus BatchUpdateOnlineCount", zap.Error(err))
			return err
		}
		log.WithContext(ctx).Info("serviceDailyRecordRepo SyncOnlineCountWithServiceStatus 批量更新完成", zap.Int("count", len(updates)))
	}

	// 6. 批量创建缺失的记录
	if len(missingServices) > 0 {
		if err := r.BatchCreateMissingRecords(ctx, missingServices); err != nil {
			log.WithContext(ctx).Error("serviceDailyRecordRepo SyncOnlineCountWithServiceStatus BatchCreateMissingRecords", zap.Error(err))
			return err
		}
		log.WithContext(ctx).Info("serviceDailyRecordRepo SyncOnlineCountWithServiceStatus 批量创建完成", zap.Int("count", len(missingServices)))
	}

	log.WithContext(ctx).Info("serviceDailyRecordRepo SyncOnlineCountWithServiceStatus 同步完成",
		zap.Int("totalServices", len(services)),
		zap.Int("updatedRecords", len(updates)),
		zap.Int("createdRecords", len(missingServices)))

	return nil
}

// GetAllServicesStatusForSync 获取所有 service 的基本信息和状态用于同步
func (r *serviceDailyRecordRepo) GetAllServicesStatusForSync(ctx context.Context) ([]*model.Service, error) {
	var services []*model.Service
	err := r.data.DB.WithContext(ctx).
		Select("service_id, service_name, department_id, department_name, service_type, status").
		Where("delete_time = 0").
		Find(&services).Error
	if err != nil {
		log.WithContext(ctx).Error("serviceDailyRecordRepo GetAllServicesStatusForSync", zap.Error(err))
		return nil, err
	}
	return services, nil
}

// GetTodayRecordsForSync 获取今日所有 service_daily_record 记录用于同步
func (r *serviceDailyRecordRepo) GetTodayRecordsForSync(ctx context.Context) ([]*model.ServiceDailyRecord, error) {
	today := time.Now()
	todayDate := time.Date(today.Year(), today.Month(), today.Day(), 0, 0, 0, 0, today.Location())

	var records []*model.ServiceDailyRecord
	err := r.data.DB.WithContext(ctx).
		Select("service_id, online_count").
		Where("record_date = ?", todayDate).
		Find(&records).Error
	if err != nil {
		log.WithContext(ctx).Error("serviceDailyRecordRepo GetTodayRecordsForSync", zap.Error(err))
		return nil, err
	}
	return records, nil
}

// BatchUpdateOnlineCount 批量更新 online_count
func (r *serviceDailyRecordRepo) BatchUpdateOnlineCount(ctx context.Context, updates []ServiceOnlineCountUpdate) error {
	if len(updates) == 0 {
		return nil
	}

	today := time.Now()
	todayDate := time.Date(today.Year(), today.Month(), today.Day(), 0, 0, 0, 0, today.Location())

	// 使用事务批量更新
	return r.data.DB.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		for _, update := range updates {
			result := tx.Model(&model.ServiceDailyRecord{}).
				Where("service_id = ? AND record_date = ?", update.ServiceID, todayDate).
				Update("online_count", update.OnlineCount)

			if result.Error != nil {
				log.WithContext(ctx).Error("serviceDailyRecordRepo BatchUpdateOnlineCount",
					zap.String("serviceID", update.ServiceID),
					zap.Error(result.Error))
				return result.Error
			}
		}
		return nil
	})
}

// BatchCreateMissingRecords 批量创建缺失的记录
func (r *serviceDailyRecordRepo) BatchCreateMissingRecords(ctx context.Context, missingServices []*model.Service) error {
	if len(missingServices) == 0 {
		return nil
	}

	today := time.Now()
	todayDate := time.Date(today.Year(), today.Month(), today.Day(), 0, 0, 0, 0, today.Location())

	var records []*model.ServiceDailyRecord
	for _, service := range missingServices {
		onlineCount := 0
		if service.Status == "online" {
			onlineCount = 1
		}

		record := &model.ServiceDailyRecord{
			ServiceID:             service.ServiceID,
			ServiceName:           service.ServiceName,
			ServiceDepartmentID:   service.DepartmentID,
			ServiceDepartmentName: service.DepartmentName,
			ServiceType:           service.ServiceType,
			RecordDate:            todayDate,
			SuccessCount:          0,
			FailCount:             0,
			OnlineCount:           onlineCount,
			ApplyCount:            0, // 创建时默认为0，后续统计时会更新
		}
		records = append(records, record)
	}

	err := r.BatchCreate(ctx, records)
	if err != nil {
		log.WithContext(ctx).Error("serviceDailyRecordRepo BatchCreateMissingRecords", zap.Error(err))
		return err
	}

	return nil
}

// IncrementApplyCount 更新指定服务的 apply_count，先确保今日记录存在
func (r *serviceDailyRecordRepo) IncrementApplyCount(ctx context.Context, serviceID string) error {
	// 1. 确保今日记录存在
	if err := r.EnsureTodayRecordExists(ctx, serviceID); err != nil {
		log.WithContext(ctx).Error("serviceDailyRecordRepo IncrementApplyCount EnsureTodayRecordExists", zap.Error(err))
		return err
	}

	// 2. 更新 apply_count
	today := time.Now()
	todayDate := time.Date(today.Year(), today.Month(), today.Day(), 0, 0, 0, 0, today.Location())

	result := r.data.DB.WithContext(ctx).
		Model(&model.ServiceDailyRecord{}).
		Where("service_id = ? AND record_date = ?", serviceID, todayDate).
		Update("apply_count", gorm.Expr("apply_count + 1"))

	if result.Error != nil {
		log.WithContext(ctx).Error("serviceDailyRecordRepo IncrementApplyCount", zap.Error(result.Error))
		return result.Error
	}

	if result.RowsAffected == 0 {
		log.WithContext(ctx).Warn("serviceDailyRecordRepo IncrementApplyCount no rows affected",
			zap.String("serviceID", serviceID))
	}

	log.WithContext(ctx).Info("serviceDailyRecordRepo IncrementApplyCount success",
		zap.String("serviceID", serviceID))

	return nil
}

// GetDailyStatistics 获取每日统计查询结果
func (r *serviceDailyRecordRepo) GetDailyStatistics(ctx context.Context, departmentIDs []string, serviceType, key, startTime, endTime string) ([]*DailyStatisticsResult, error) {
	var results []*DailyStatisticsResult

	tx := r.data.DB.WithContext(ctx).Model(&model.ServiceDailyRecord{}).
		Select("SUM(success_count) AS success_count, SUM(fail_count) AS fail_count, SUM(online_count) AS online_count, SUM(apply_count) AS apply_count, DATE_FORMAT(record_date, '%Y-%m-%d') AS record_date")

	// 添加时间范围过滤
	if startTime != "" && endTime != "" {
		tx = tx.Where("record_date BETWEEN ? AND ?", startTime, endTime)
	} else if startTime != "" {
		tx = tx.Where("record_date >= ?", startTime)
	} else if endTime != "" {
		tx = tx.Where("record_date <= ?", endTime)
	}

	// 添加部门过滤 - 支持多个部门
	if len(departmentIDs) > 0 {
		// 如果 departmentIDs 包含 '00000000-0000-0000-0000-000000000000'，则查询 department_id 为 NULL 或 ''
		includeNullDept := false
		for _, id := range departmentIDs {
			if id == "00000000-0000-0000-0000-000000000000" {
				includeNullDept = true
				break
			}
		}
		if includeNullDept {
			// 存在特殊ID，查找 department_id 为 NULL 或 '',对于其他ID，则查询 department_id IN ?
			tx = tx.Where("service_department_id IS NULL OR service_department_id = '' OR service_department_id IN ?", departmentIDs)
		} else {
			tx = tx.Where("service_department_id IN ?", departmentIDs)
		}
	}

	// 添加服务类型过滤
	if serviceType != "" {
		tx = tx.Where("service_type = ?", serviceType)
	}

	// 添加关键字过滤（匹配服务名称）
	if key != "" {
		tx = tx.Where("service_name LIKE ?", "%"+key+"%")
	}

	err := tx.Group("DATE(record_date)").
		Order("record_date ASC").
		Find(&results).Error

	if err != nil {
		log.WithContext(ctx).Error("serviceDailyRecordRepo GetDailyStatistics", zap.Error(err))
		return nil, err
	}

	log.WithContext(ctx).Info("serviceDailyRecordRepo GetDailyStatistics success",
		zap.Int("resultCount", len(results)),
		zap.Strings("departmentIDs", departmentIDs),
		zap.String("serviceType", serviceType),
		zap.String("key", key),
		zap.String("startTime", startTime),
		zap.String("endTime", endTime))

	return results, nil
}

// RepairMissingRecords 修复指定日期范围内缺失的记录
func (r *serviceDailyRecordRepo) RepairMissingRecords(ctx context.Context, startDate, endDate time.Time) error {
	log.WithContext(ctx).Info("serviceDailyRecordRepo RepairMissingRecords 开始修复缺失记录",
		zap.String("startDate", startDate.Format("2006-01-02")),
		zap.String("endDate", endDate.Format("2006-01-02")))

	// 获取所有service信息
	services, err := r.GetAllServicesForDailyRecord(ctx)
	if err != nil {
		log.WithContext(ctx).Error("serviceDailyRecordRepo RepairMissingRecords GetAllServicesForDailyRecord", zap.Error(err))
		return err
	}

	if len(services) == 0 {
		log.WithContext(ctx).Info("serviceDailyRecordRepo RepairMissingRecords 无service数据")
		return nil
	}

	// 构建serviceID列表
	serviceIDs := make([]string, 0, len(services))
	for _, svc := range services {
		serviceIDs = append(serviceIDs, svc.ServiceID)
	}

	totalRepaired := 0
	currentDate := startDate

	// 逐日检查并修复
	for !currentDate.After(endDate) {
		log.WithContext(ctx).Info("serviceDailyRecordRepo RepairMissingRecords 检查日期",
			zap.String("date", currentDate.Format("2006-01-02")))

		// 查询该日期已存在的记录
		var existingRecords []*model.ServiceDailyRecord
		err = r.data.DB.WithContext(ctx).
			Select("service_id").
			Where("record_date = ? AND service_id IN ?", currentDate, serviceIDs).
			Find(&existingRecords).Error
		if err != nil {
			log.WithContext(ctx).Error("serviceDailyRecordRepo RepairMissingRecords query existing",
				zap.String("date", currentDate.Format("2006-01-02")),
				zap.Error(err))
			currentDate = currentDate.Add(24 * time.Hour)
			continue
		}

		// 构建已存在记录的serviceID映射
		existingServiceMap := make(map[string]bool)
		for _, record := range existingRecords {
			existingServiceMap[record.ServiceID] = true
		}

		// 找出缺失的service记录
		var missingServices []*model.Service
		for _, service := range services {
			if !existingServiceMap[service.ServiceID] {
				missingServices = append(missingServices, service)
			}
		}

		// 为缺失的service创建记录
		if len(missingServices) > 0 {
			dayRepaired, err := r.createMissingRecordsForDate(ctx, missingServices, currentDate)
			if err != nil {
				log.WithContext(ctx).Error("serviceDailyRecordRepo RepairMissingRecords createMissingRecordsForDate",
					zap.String("date", currentDate.Format("2006-01-02")),
					zap.Error(err))
			} else {
				totalRepaired += dayRepaired
				log.WithContext(ctx).Info("serviceDailyRecordRepo RepairMissingRecords 日期修复完成",
					zap.String("date", currentDate.Format("2006-01-02")),
					zap.Int("repairedCount", dayRepaired))
			}
		}

		// 移动到下一天
		currentDate = currentDate.Add(24 * time.Hour)
	}

	log.WithContext(ctx).Info("serviceDailyRecordRepo RepairMissingRecords 修复完成",
		zap.String("startDate", startDate.Format("2006-01-02")),
		zap.String("endDate", endDate.Format("2006-01-02")),
		zap.Int("totalRepaired", totalRepaired))

	return nil
}

// createMissingRecordsForDate 为指定日期创建缺失的service记录
func (r *serviceDailyRecordRepo) createMissingRecordsForDate(ctx context.Context, missingServices []*model.Service, recordDate time.Time) (int, error) {
	if len(missingServices) == 0 {
		return 0, nil
	}

	// 获取service统计信息用于apply_count
	stats, err := r.GetServiceStats(ctx)
	if err != nil {
		log.WithContext(ctx).Error("serviceDailyRecordRepo createMissingRecordsForDate GetServiceStats", zap.Error(err))
		// 即使获取stats失败，也继续创建记录，apply_count设为0
		stats = []*model.ServiceStatsInfo{}
	}

	// 构建 serviceID -> applyNum 的映射
	applyMap := make(map[string]uint64)
	for _, s := range stats {
		applyMap[s.ServiceID] = s.ApplyNum
	}

	var records []*model.ServiceDailyRecord
	for _, service := range missingServices {
		// 对于历史记录，online_count设为0，因为无法准确知道历史状态
		record := &model.ServiceDailyRecord{
			ServiceID:             service.ServiceID,
			ServiceName:           service.ServiceName,
			ServiceDepartmentID:   service.DepartmentID,
			ServiceDepartmentName: service.DepartmentName,
			ServiceType:           service.ServiceType,
			RecordDate:            recordDate,
			SuccessCount:          0,
			FailCount:             0,
			OnlineCount:           0, // 历史记录设为0
			ApplyCount:            int(applyMap[service.ServiceID]),
		}
		records = append(records, record)
	}

	err = r.BatchCreate(ctx, records)
	if err != nil {
		log.WithContext(ctx).Error("serviceDailyRecordRepo createMissingRecordsForDate BatchCreate", zap.Error(err))
		return 0, err
	}

	log.WithContext(ctx).Info("serviceDailyRecordRepo createMissingRecordsForDate 创建成功",
		zap.String("date", recordDate.Format("2006-01-02")),
		zap.Int("count", len(records)))

	return len(records), nil
}

// GetExistingRecordsForDate 批量获取指定日期已存在的记录
func (r *serviceDailyRecordRepo) GetExistingRecordsForDate(ctx context.Context, recordDate time.Time) (map[string]bool, error) {
	var records []*model.ServiceDailyRecord
	err := r.data.DB.WithContext(ctx).
		Select("service_id").
		Where("record_date = ?", recordDate).
		Find(&records).Error
	if err != nil {
		log.WithContext(ctx).Error("serviceDailyRecordRepo GetExistingRecordsForDate", zap.Error(err))
		return nil, err
	}

	// 构建 serviceID -> exists 的映射
	existingMap := make(map[string]bool)
	for _, record := range records {
		existingMap[record.ServiceID] = true
	}

	return existingMap, nil
}
