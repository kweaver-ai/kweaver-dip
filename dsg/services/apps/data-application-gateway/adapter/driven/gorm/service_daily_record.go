package gorm

import (
	"context"
	"time"

	"github.com/kweaver-ai/dsg/services/apps/data-application-gateway/infrastructure/repository/db"
	"github.com/kweaver-ai/dsg/services/apps/data-application-gateway/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"go.uber.org/zap"
	"gorm.io/gorm"
)

type DataApplicationServiceRepo interface {
	IncrementSuccessCount(ctx context.Context, serviceID string) error
	IncrementFailCount(ctx context.Context, serviceID string) error
	EnsureTodayRecordExists(ctx context.Context, serviceID string) error
	// 辅助方法
	Exists(ctx context.Context, serviceID string, recordDate time.Time) (bool, error)
	GetServiceInfo(ctx context.Context, serviceID string) (*model.Service, error)
}

type dataApplicationServiceRepo struct {
	data *db.Data
}

func NewDataApplicationServiceRepo(data *db.Data) DataApplicationServiceRepo {
	return &dataApplicationServiceRepo{data: data}
}

func (r *dataApplicationServiceRepo) IncrementSuccessCount(ctx context.Context, serviceID string) error {
	today := time.Now().Format("2006-01-02")

	// 确保今日记录存在
	if err := r.EnsureTodayRecordExists(ctx, serviceID); err != nil {
		log.WithContext(ctx).Error("dataApplicationServiceRepo IncrementSuccessCount ensureRecordExists", zap.Error(err))
		return err
	}

	// 增加成功次数
	result := r.data.DB.WithContext(ctx).
		Model(&model.ServiceDailyRecord{}).
		Where("service_id = ? AND record_date = ?", serviceID, today).
		UpdateColumn("success_count", gorm.Expr("success_count + ?", 1))

	if result.Error != nil {
		log.WithContext(ctx).Error("dataApplicationServiceRepo IncrementSuccessCount", zap.Error(result.Error))
		return result.Error
	}

	return nil
}

func (r *dataApplicationServiceRepo) IncrementFailCount(ctx context.Context, serviceID string) error {
	today := time.Now().Format("2006-01-02")

	// 确保今日记录存在
	if err := r.EnsureTodayRecordExists(ctx, serviceID); err != nil {
		log.WithContext(ctx).Error("dataApplicationServiceRepo IncrementFailCount ensureRecordExists", zap.Error(err))
		return err
	}

	// 增加失败次数
	result := r.data.DB.WithContext(ctx).
		Model(&model.ServiceDailyRecord{}).
		Where("service_id = ? AND record_date = ?", serviceID, today).
		UpdateColumn("fail_count", gorm.Expr("fail_count + ?", 1))

	if result.Error != nil {
		log.WithContext(ctx).Error("dataApplicationServiceRepo IncrementFailCount", zap.Error(result.Error))
		return result.Error
	}

	return nil
}

// EnsureTodayRecordExists 确保今日记录存在，不存在则插入
func (r *dataApplicationServiceRepo) EnsureTodayRecordExists(ctx context.Context, serviceID string) error {
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
		log.WithContext(ctx).Error("dataApplicationServiceRepo EnsureTodayRecordExists GetServiceInfo", zap.Error(err))
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
		log.WithContext(ctx).Error("dataApplicationServiceRepo EnsureTodayRecordExists Create", zap.Error(err))
		return err
	}

	log.WithContext(ctx).Info("dataApplicationServiceRepo EnsureTodayRecordExists created new record", zap.String("serviceID", serviceID))
	return nil
}

func (r *dataApplicationServiceRepo) Exists(ctx context.Context, serviceID string, recordDate time.Time) (bool, error) {
	var count int64
	err := r.data.DB.WithContext(ctx).
		Model(&model.ServiceDailyRecord{}).
		Where("service_id = ? AND record_date = ?", serviceID, recordDate).
		Count(&count).Error
	return count > 0, err
}

// GetServiceInfo 获取 service 基本信息
func (r *dataApplicationServiceRepo) GetServiceInfo(ctx context.Context, serviceID string) (*model.Service, error) {
	var service model.Service
	err := r.data.DB.WithContext(ctx).
		Select("service_id, service_name, department_id, department_name, service_type").
		Where("service_id = ? AND delete_time = 0", serviceID).
		First(&service).Error

	if err != nil {
		log.WithContext(ctx).Error("dataApplicationServiceRepo GetServiceInfo", zap.Error(err))
		return nil, err
	}

	return &service, nil
}

// validateAndFixSingleRecordDepartment 校验并修复单个记录的部门信息
func (r *dataApplicationServiceRepo) validateAndFixSingleRecordDepartment(ctx context.Context, serviceID string, service *model.Service, recordDate time.Time) error {
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
		log.WithContext(ctx).Info("dataApplicationServiceRepo validateAndFixSingleRecordDepartment 发现部门信息不一致，开始修复",
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
			log.WithContext(ctx).Error("dataApplicationServiceRepo validateAndFixSingleRecordDepartment update failed", zap.Error(result.Error))
			return result.Error
		}

		log.WithContext(ctx).Info("dataApplicationServiceRepo validateAndFixSingleRecordDepartment 部门信息修复成功",
			zap.String("serviceID", serviceID))
	}

	return nil
}
