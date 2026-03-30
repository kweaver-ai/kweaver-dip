package domain

import (
	"context"
	"errors"

	"github.com/kweaver-ai/dsg/services/apps/data-application-service/adapter/driven/gorm"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/adapter/driven/microservice"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/common/dto"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"go.uber.org/zap"
)

// ServiceCallRecordDomain 服务调用记录领域服务
type ServiceCallRecordDomain struct {
	repo                     gorm.ServiceCallRecordRepo
	gatewayCollectionLogRepo gorm.GatewayCollectionLogRepo
	configurationCenterRepo  microservice.ConfigurationCenterRepo
}

// NewServiceCallRecordDomain 创建服务调用记录领域服务
func NewServiceCallRecordDomain(
	repo gorm.ServiceCallRecordRepo,
	gatewayCollectionLogRepo gorm.GatewayCollectionLogRepo,
	configurationCenterRepo microservice.ConfigurationCenterRepo,
) *ServiceCallRecordDomain {
	return &ServiceCallRecordDomain{
		repo:                     repo,
		gatewayCollectionLogRepo: gatewayCollectionLogRepo,
		configurationCenterRepo:  configurationCenterRepo,
	}
}

// MonitorList 列表查询服务调用记录
func (d *ServiceCallRecordDomain) MonitorList(ctx context.Context, req *dto.MonitorListReq) (res []*dto.MonitorRecord, count int64, err error) {

	// 获取配置中心配置，如果配置中心配置cssjj为true，则使用第三方服务调用记录
	cv, err := d.configurationCenterRepo.GetConfigValue(ctx, microservice.ConfigValueKeyCSSJJ)
	if err != nil {
		log.WithContext(ctx).Error("ServiceCallRecordDomain MonitorList GetConfigValue", zap.Error(err))
		return nil, 0, err
	}
	if cv.Value == microservice.ConfigValueValueTrue {
		// 使用第三方服务调用记录
		if d.gatewayCollectionLogRepo == nil {
			log.WithContext(ctx).Error("ServiceCallRecordDomain MonitorList gatewayCollectionLogRepo is nil", zap.Error(ErrNilRepository))
			return nil, 0, ErrNilRepository
		}

		// 转换请求参数
		gatewayReq := convertMonitorListReqToGatewayCollectionLogReq(req)

		// 调用第三方服务调用记录查询
		gatewayLogs, totalCount, err := d.gatewayCollectionLogRepo.List(ctx, gatewayReq)
		if err != nil {
			log.WithContext(ctx).Error("ServiceCallRecordDomain MonitorList GatewayCollectionLogRepo.List", zap.Error(err))
			return nil, 0, err
		}

		// 转换结果
		res = make([]*dto.MonitorRecord, 0, len(gatewayLogs))
		for _, gatewayLog := range gatewayLogs {
			monitorRecord := convertGatewayCollectionLogToMonitorRecord(gatewayLog)
			res = append(res, monitorRecord)
		}

		return res, totalCount, nil
	} else {
		// 使用本地服务调用记录
		if d == nil || d.repo == nil {
			log.WithContext(ctx).Error("ServiceCallRecordDomain MonitorList repo is nil", zap.Error(ErrNilRepository))
			return nil, 0, ErrNilRepository
		}

		records, total, err := d.repo.MonitorList(ctx, req)
		if err != nil {
			log.WithContext(ctx).Error("ServiceCallRecordDomain MonitorList", zap.Error(err))
			return nil, 0, err
		}
		return records, total, nil
	}
}

// ErrNilRepository 用于标识仓储未注入的错误
var ErrNilRepository = errors.New("repository is nil")

// convertMonitorListReqToGatewayCollectionLogReq 将MonitorListReq转换为GatewayCollectionLogReq
func convertMonitorListReqToGatewayCollectionLogReq(req *dto.MonitorListReq) *dto.GatewayCollectionLogReq {
	return &dto.GatewayCollectionLogReq{
		SvcID:           req.ServiceID,
		Keyword:         req.Keyword,
		SvcBelongDeptID: req.ServiceDepartmentID,
		InvokeSvcDeptID: req.CallDepartmentID,
		InvokeSystemID:  req.CallInfoSystemID,
		InvokeAppID:     req.CallAppID,
		StartTime:       req.StartTime,
		EndTime:         req.EndTime,
		Offset:          req.Offset,
		Limit:           req.Limit,
		Sort:            req.Sort,
		Direction:       req.Direction,
	}
}

// convertGatewayCollectionLogToMonitorRecord 将GatewayCollectionLog转换为MonitorRecord
func convertGatewayCollectionLogToMonitorRecord(log *dto.GatewayCollectionLog) *dto.MonitorRecord {
	return &dto.MonitorRecord{
		ServiceID:               log.SvcID,
		ServiceName:             log.SvcName,
		ServiceDepartmentID:     log.SvcBelongDeptID,
		ServiceDepartmentName:   log.SvcBelongDeptName,
		ServiceDepartmentPath:   log.SvcBelongDeptPath,
		CallDepartmentID:        log.InvokeSvcDeptID,
		CallDepartmentName:      log.InvokeSvcDeptName,
		CallDepartmentPath:      log.InvokeSvcDeptPath,
		CallSystemID:            log.InvokeSystemID,
		CallSystemName:          log.InvokeSystemName,
		CallAppID:               log.InvokeAppID,
		CallAppName:             log.InvokeAppName,
		CallHostAndPort:         log.InvokeIPPort,
		CallNum:                 log.InvokeNum,
		CallAverageCallDuration: log.InvokeAverageCallDuration,
		// 注意：GatewayCollectionLog中没有调用时间和调用时长字段，需要根据实际情况处理
		// CallTime 和 CallDuration 字段在GatewayCollectionLog中不存在，可能需要从其他地方获取或设置为默认值
	}
}
