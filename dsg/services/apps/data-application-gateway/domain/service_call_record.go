package domain

import (
	"context"
	"time"

	"github.com/kweaver-ai/dsg/services/apps/data-application-gateway/adapter/driven/gorm"
	"github.com/kweaver-ai/dsg/services/apps/data-application-gateway/adapter/driven/microservice"
	"github.com/kweaver-ai/dsg/services/apps/data-application-gateway/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-application-gateway/infrastructure/repository/db/model"
	v1 "github.com/kweaver-ai/idrm-go-common/api/auth-service/v1"
	"github.com/kweaver-ai/idrm-go-common/interception"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"go.uber.org/zap"
)

type ServiceCallRecordDomain struct {
	serviceCallRecordRepo      gorm.ServiceCallRecordRepo
	serviceRepo                gorm.ServiceRepo
	configurationCenterRepo    microservice.ConfigurationCenterRepo
	dataApplicationServiceRepo gorm.DataApplicationServiceRepo
}

func NewServiceCallRecordDomain(
	serviceCallRecordRepo gorm.ServiceCallRecordRepo,
	serviceRepo gorm.ServiceRepo,
	configurationCenterRepo microservice.ConfigurationCenterRepo,
	dataApplicationServiceRepo gorm.DataApplicationServiceRepo,
) *ServiceCallRecordDomain {
	return &ServiceCallRecordDomain{
		serviceRepo:                serviceRepo,
		serviceCallRecordRepo:      serviceCallRecordRepo,
		configurationCenterRepo:    configurationCenterRepo,
		dataApplicationServiceRepo: dataApplicationServiceRepo,
	}
}

// RecordServiceCall 记录服务调用信息
func (s *ServiceCallRecordDomain) RecordServiceCall(ctx context.Context, req *RecordServiceCallReq) error {

	// 从 context 获取接调用者的信息，如果获取失败或调用者不是一个应用则禁止调用
	subject, err := interception.AuthServiceSubjectFromContext(ctx)
	log.WithContext(ctx).Warn("subject Info:", zap.Any("subject", subject))
	if err != nil || subject.Type != v1.SubjectAPP {
		return errorcode.Desc(errorcode.ServiceApplyNotPass)
	}
	req.UserIdentification = subject.ID
	req.CallAppID = subject.ID

	// if subject != nil {
	// 	app, err := s.configurationCenterRepo.AppsGetById(ctx, &microservice.AppsID{Id: subject.ID})
	// 	if err != nil {
	// 		return err
	// 	}
	// 	req.CallAppID = app.ID
	// 	req.CallInfoSystemID = app.InfoSystem.ID
	// 	req.UserIdentification = app.AccountID
	// 	uid := app.ApplicationDeveloper.UID
	// 	if uid != "" {
	// 		userDepart, err := s.configurationCenterRepo.GetUserIdDepart(ctx, uid)
	// 		// 打印userDepart
	// 		log.WithContext(ctx).Warn("userDepart Info:", zap.Any("userDepart", userDepart))
	// 		if err != nil {
	// 			return err
	// 		}
	// 		if len(userDepart) > 0 {
	// 			//拼接部门id
	// 			departmentID := ""
	// 			for _, depart := range userDepart {
	// 				departmentID += depart.ID + ","
	// 			}
	// 			//去掉最后一个逗号
	// 			if departmentID != "" {
	// 				departmentID = departmentID[:len(departmentID)-1]
	// 			}
	// 			req.CallDepartmentID = departmentID
	// 		}
	// 	}
	// }

	service, err := s.serviceRepo.ServiceGet(ctx, req.ServiceID)
	if err != nil {
		return err
	}

	if service != nil {
		req.ServiceDepartmentID = service.DepartmentID
	}

	record := &model.ServiceCallRecord{
		ServiceID:           service.ServiceID,
		ServiceDepartmentID: req.ServiceDepartmentID,
		ServiceSystemID:     req.ServiceSystemID,
		ServiceAppID:        req.ServiceAppID,
		RemoteAddress:       req.RemoteAddress,
		ForwardFor:          req.ForwardFor,
		UserIdentification:  req.UserIdentification,
		CallDepartmentID:    req.CallDepartmentID,
		CallInfoSystemID:    req.CallInfoSystemID,
		CallAppID:           req.CallAppID,
		CallStartTime:       req.CallStartTime,
		CallEndTime:         req.CallEndTime,
		CallHTTPCode:        req.CallHTTPCode,
		CallStatus:          req.CallStatus,
		ErrorMessage:        req.ErrorMessage,
		CallOtherMessage:    req.CallOtherMessage,
		RecordTime:          time.Now(),
	}

	// 记录服务调用详情
	if err := s.serviceCallRecordRepo.Create(ctx, record); err != nil {
		return err
	}

	// 根据调用状态统计成功或失败次数
	if req.CallStatus == 1 {
		// 调用成功，增加成功次数
		if err := s.dataApplicationServiceRepo.IncrementSuccessCount(ctx, service.ServiceID); err != nil {
			log.WithContext(ctx).Error("记录成功调用次数失败", zap.Error(err), zap.String("serviceID", req.ServiceID))
			// 不返回错误，避免影响主流程
		}
	} else {
		// 调用失败，增加失败次数
		if err := s.dataApplicationServiceRepo.IncrementFailCount(ctx, service.ServiceID); err != nil {
			log.WithContext(ctx).Error("记录失败调用次数失败", zap.Error(err), zap.String("serviceID", req.ServiceID))
			// 不返回错误，避免影响主流程
		}
	}

	return nil
}

// RecordServiceCallReq 记录服务调用请求参数
type RecordServiceCallReq struct {
	ServiceID           string     `json:"service_id"`
	ServiceDepartmentID string     `json:"service_department_id"`
	ServiceSystemID     string     `json:"service_system_id"`
	ServiceAppID        string     `json:"service_app_id"`
	RemoteAddress       string     `json:"remote_address"`
	ForwardFor          string     `json:"forward_for"`
	UserIdentification  string     `json:"user_identification"`
	CallDepartmentID    string     `json:"call_department_id"`
	CallInfoSystemID    string     `json:"call_info_system_id"`
	CallAppID           string     `json:"call_app_id"`
	CallStartTime       time.Time  `json:"call_start_time"`
	CallEndTime         *time.Time `json:"call_end_time"`
	CallHTTPCode        *int       `json:"call_http_code"`
	CallStatus          int        `json:"call_status"`
	ErrorMessage        string     `json:"error_message"`
	CallOtherMessage    string     `json:"call_other_message"`
}
