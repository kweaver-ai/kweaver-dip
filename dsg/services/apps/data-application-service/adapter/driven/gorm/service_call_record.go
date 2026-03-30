package gorm

import (
	"context"
	"fmt"
	"strings"
	"time"

	"go.uber.org/zap"

	"github.com/kweaver-ai/dsg/services/apps/data-application-service/adapter/driven/microservice"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/common/dto"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/infrastructure/repository/db"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/infrastructure/repository/db/model"
	configuration_center "github.com/kweaver-ai/idrm-go-common/rest/configuration_center"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
)

type ServiceCallRecordRepo interface {
	MonitorList(ctx context.Context, req *dto.MonitorListReq) (res []*dto.MonitorRecord, count int64, err error)
	DeleteExpiredRecords(ctx context.Context) error
}

type serviceCallRecordRepo struct {
	data                      *db.Data
	configurationCenterRepo   microservice.ConfigurationCenterRepo
	configurationCenterDriven configuration_center.Driven
	userManagementRepo        microservice.UserManagementRepo
}

func NewServiceCallRecordRepo(
	data *db.Data,
	configurationCenterRepo microservice.ConfigurationCenterRepo,
	configurationCenterDriven configuration_center.Driven,
	userManagementRepo microservice.UserManagementRepo,
) ServiceCallRecordRepo {
	return &serviceCallRecordRepo{
		data:                      data,
		configurationCenterRepo:   configurationCenterRepo,
		configurationCenterDriven: configurationCenterDriven,
		userManagementRepo:        userManagementRepo,
	}
}

func (r *serviceCallRecordRepo) MonitorList(ctx context.Context, req *dto.MonitorListReq) (res []*dto.MonitorRecord, totalCount int64, err error) {
	tx := r.data.DB.WithContext(ctx).Model(&model.ServiceCallRecord{})
	// 查询1：获取库表总数量
	// err = tx.Count(&totalCount).Error
	// if err != nil {
	// 	log.WithContext(ctx).Error("MonitorList Total Count", zap.Error(err))
	// 	return nil, 0, err
	// }
	// 根据ServiceID过滤
	if req.ServiceID != "" {
		// 以逗号分割ServiceID
		serviceIDs := strings.Split(req.ServiceID, ",")
		tx = tx.Where("service_id IN ?", serviceIDs)
	}

	// 根据关键词过滤（服务名称）
	if req.Keyword != "" {
		// 先查询匹配关键词的服务ID
		var serviceIDs []string
		serviceQuery := r.data.DB.WithContext(ctx).Model(&model.Service{}).Scopes(Undeleted()).
			Where("service_name LIKE ?", EscapeLike("%", req.Keyword, "%")).
			Pluck("service_id", &serviceIDs)
		if serviceQuery.Error != nil {
			log.WithContext(ctx).Error("MonitorList service query failed", zap.Error(serviceQuery.Error))
			return nil, 0, serviceQuery.Error
		}
		if len(serviceIDs) > 0 {
			tx = tx.Where("service_id IN ?", serviceIDs)
		} else {
			// 如果没有找到匹配的服务，直接返回空结果
			return []*dto.MonitorRecord{}, 0, nil
		}
	}

	// 根据服务部门ID过滤
	if req.ServiceDepartmentID != "" {
		if req.ServiceDepartmentID == "00000000-0000-0000-0000-000000000000" {
			tx = tx.Where("service_department_id IS NULL OR service_department_id = ''")
		} else {
			tx = tx.Where("service_department_id = ?", req.ServiceDepartmentID)
		}
	}

	// 根据调用部门ID过滤
	if req.CallDepartmentID != "" {
		if req.CallDepartmentID == "00000000-0000-0000-0000-000000000000" {
			tx = tx.Where("call_department_id IS NULL OR call_department_id = ''")
		} else {
			tx = tx.Where("call_department_id = ?", req.CallDepartmentID)
		}
	}

	// 根据调用信息系统ID过滤
	if req.CallInfoSystemID != "" {
		tx = tx.Where("call_info_system_id = ?", req.CallInfoSystemID)
	}

	// 根据调用应用ID过滤
	if req.CallAppID != "" {
		tx = tx.Where("call_app_id = ?", req.CallAppID)
	}

	// 根据调用状态过滤
	if req.Status != "" {
		var callStatus int
		switch req.Status {
		case "success":
			callStatus = 1
		case "fail":
			callStatus = 0
		default:
			callStatus = 2 // 未知状态
		}
		tx = tx.Where("call_status = ?", callStatus)
	}

	// 根据调用开始时间过滤
	if req.StartTime != "" {
		tx = tx.Where("call_start_time >= ?", req.StartTime)
	}

	// 根据调用结束时间过滤
	if req.EndTime != "" {
		tx = tx.Where("call_start_time <= ?", req.EndTime)
	}

	err = tx.Count(&totalCount).Error
	if err != nil {
		log.WithContext(ctx).Error("MonitorList Total Count", zap.Error(err))
		return nil, 0, err
	}

	// 排序
	if req.Sort != "" {
		// 处理排序字段映射
		sortField := req.Sort
		switch req.Sort {
		case "call_time":
			sortField = "call_start_time"
		case "call_start_time":
			sortField = "call_start_time"
		case "call_end_time":
			sortField = "call_end_time"
		}
		tx = tx.Order(sortField + " " + req.Direction)
	} else {
		// 默认按调用开始时间倒序
		tx = tx.Order("call_start_time desc")
	}

	// 分页查询
	var records []*model.ServiceCallRecord
	tx = tx.Scopes(Paginate(req.Offset, req.Limit)).Find(&records)
	if tx.Error != nil {
		log.WithContext(ctx).Error("MonitorList Find", zap.Error(tx.Error))
		return nil, 0, tx.Error
	}

	// 添加 nil 检查，确保 records 不为 nil
	if records == nil {
		records = []*model.ServiceCallRecord{}
	}

	res = []*dto.MonitorRecord{}

	for _, record := range records {
		// 获取服务信息
		serviceName := ""
		if record.ServiceID != "" {
			service, err := r.getServiceInfo(ctx, record.ServiceID)
			if err != nil {
				log.WithContext(ctx).Warn("MonitorList getServiceInfo failed",
					zap.String("serviceID", record.ServiceID), zap.Error(err))
			} else {
				serviceName = service.ServiceName
			}
		}

		// 获取服务部门信息
		serviceDepartmentName := ""
		serviceDepartmentPath := ""
		if record.ServiceDepartmentID != "" {
			department, err := r.configurationCenterRepo.DepartmentGet(ctx, record.ServiceDepartmentID)
			if err != nil {
				log.WithContext(ctx).Warn("MonitorList getServiceDepartment failed",
					zap.String("departmentID", record.ServiceDepartmentID), zap.Error(err))
			} else {
				serviceDepartmentName = department.Name
				serviceDepartmentPath = department.Path
			}
		}

		// 获取调用部门信息
		// callDepartmentName := ""
		// callDepartmentPath := ""
		// if record.CallDepartmentID != "" {
		// 	department, err := r.configurationCenterRepo.DepartmentGet(ctx, record.CallDepartmentID)
		// 	if err != nil {
		// 		log.WithContext(ctx).Warn("MonitorList getCallDepartment failed",
		// 			zap.String("departmentID", record.CallDepartmentID), zap.Error(err))
		// 	} else {
		// 		callDepartmentName = department.Name
		// 		callDepartmentPath = department.Path
		// 	}
		// }

		// 获取调用系统信息
		// callSystemName := ""
		// if record.CallInfoSystemID != "" {
		// 	infoSystem, err := r.configurationCenterRepo.GetInfoSystem(ctx, record.CallInfoSystemID)
		// 	if err != nil {
		// 		log.WithContext(ctx).Warn("MonitorList getCallSystem failed",
		// 			zap.String("systemID", record.CallInfoSystemID), zap.Error(err))
		// 	} else {
		// 		callSystemName = infoSystem.Name
		// 	}
		// }

		// 获取调用应用信息
		callAppName := ""
		if record.CallAppID != "" {
			app, err := r.userManagementRepo.GetAppsById(ctx, record.CallAppID)
			if err != nil {
				log.WithContext(ctx).Warn("MonitorList getCallApp failed",
					zap.String("appID", record.CallAppID), zap.Error(err))
			} else {
				callAppName = app.Name
			}
		}

		// 构建调用IP及端口列表
		callHostAndPort := ""
		if record.RemoteAddress != "" {
			callHostAndPort = record.RemoteAddress
		}
		if record.ForwardFor != "" {
			// X-Forward-For可能包含多个IP，取第一个
			ips := strings.Split(record.ForwardFor, ",")
			if len(ips) > 0 {
				firstIP := strings.TrimSpace(ips[0])
				if firstIP != "" {
					callHostAndPort = firstIP
				}
			}
		}

		// 计算调用时长
		callDuration := ""
		if record.CallEndTime != nil {
			duration := record.CallEndTime.Sub(record.CallStartTime)
			callDuration = formatDuration(duration)
		}

		// 确定状态
		status := "unknown"
		switch record.CallStatus {
		case 1:
			status = "success"
		case 0:
			status = "fail"
		}

		monitorRecord := &dto.MonitorRecord{
			ServiceID:             record.ServiceID,
			ServiceName:           serviceName,
			ServiceDepartmentID:   record.ServiceDepartmentID,
			ServiceDepartmentName: serviceDepartmentName,
			ServiceDepartmentPath: serviceDepartmentPath,
			// CallDepartmentName:    callDepartmentName,
			// CallDepartmentPath:    callDepartmentPath,
			// CallSystemName:        callSystemName,
			CallAppName:     callAppName,
			CallHostAndPort: callHostAndPort,
			CallTime:        record.CallStartTime.Format("2006-01-02 15:04:05"),
			CallDuration:    callDuration,
			Status:          status,
		}

		res = append(res, monitorRecord)
	}

	return res, totalCount, nil
}

// getServiceInfo 获取服务信息
func (r *serviceCallRecordRepo) getServiceInfo(ctx context.Context, serviceID string) (*model.Service, error) {
	var service model.Service
	err := r.data.DB.WithContext(ctx).Scopes(Undeleted()).
		Where("service_id = ?", serviceID).
		First(&service).Error
	if err != nil {
		return nil, err
	}
	return &service, nil
}

// formatDuration 格式化时间间隔
func formatDuration(d time.Duration) string {
	if d < time.Millisecond {
		return "0ms"
	}
	if d < time.Second {
		return d.String()
	}
	if d < time.Minute {
		seconds := int(d.Seconds())
		milliseconds := int((d % time.Second).Milliseconds())
		if milliseconds == 0 {
			return fmt.Sprintf("%ds", seconds)
		}
		return fmt.Sprintf("%ds%dms", seconds, milliseconds)
	}
	if d < time.Hour {
		minutes := int(d.Minutes())
		seconds := int((d % time.Minute).Seconds())
		if seconds == 0 {
			return fmt.Sprintf("%dm", minutes)
		}
		return fmt.Sprintf("%dm%ds", minutes, seconds)
	}
	hours := int(d.Hours())
	minutes := int((d % time.Hour).Minutes())
	if minutes == 0 {
		return fmt.Sprintf("%dh", hours)
	}
	return fmt.Sprintf("%dh%dm", hours, minutes)
}

// DeleteExpiredRecords 删除过期的记录,过期时间为90天
func (r *serviceCallRecordRepo) DeleteExpiredRecords(ctx context.Context) error {
	now := time.Now()
	ninetyDaysAgo := now.AddDate(0, 0, -90)

	return r.data.DB.WithContext(ctx).
		Where("call_start_time < ?", ninetyDaysAgo).
		Delete(&model.ServiceCallRecord{}).Error
}
