package domain

import (
	"context"

	"go.uber.org/zap"

	"github.com/kweaver-ai/dsg/services/apps/data-application-service/common/constant"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/infrastructure/repository/db/model"
	callback_register "github.com/kweaver-ai/idrm-go-common/callback/data_application_service/register"
	"github.com/kweaver-ai/idrm-go-frame/core/errorx/agcodes"
	"github.com/kweaver-ai/idrm-go-frame/core/errorx/agerrors"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
)

type DataApplicationServiceCallback struct {
	Client callback_register.UserServiceClient
}

func NewDataApplicationServiceCallback(client callback_register.UserServiceClient) *DataApplicationServiceCallback {
	return &DataApplicationServiceCallback{
		Client: client,
	}
}

// 创建接口回调
func (c *DataApplicationServiceCallback) OnCreateService(ctx context.Context, service *model.Service) (serviceCallback *model.Service, err error) {
	createRequest, err := c.genCreateCallbackEvent(service)
	if err != nil {
		return nil, err
	}
	if result, err := c.Client.Create(ctx, createRequest); err != nil {
		return nil, err
	} else {
		service.SyncFlag = &result.SyncFlag
		service.SyncMsg = &result.Msg
	}
	return service, nil
}

// 生成创建接口事件
func (c *DataApplicationServiceCallback) genCreateCallbackEvent(service *model.Service) (*callback_register.CreateRequest, error) {
	log.Info("genCreateCallbackEvent", zap.Any("service", service))

	//校验PaasId是否存在
	paasId := *service.PaasID
	if paasId == "" {
		message := "请确保接口所属应用存在"
		log.Error("genCreateCallbackEvent"+message, zap.Any("paasId", paasId))
		return nil, agerrors.NewCode(agcodes.New(errorcode.ServiceIDNotExist, "接口所属应用不存在", "", message, "", ""))
	}

	//校验ServiceID是否存在
	serviceId := service.ServiceID
	if serviceId == "" {
		message := "请确保接口存在"
		log.Error("genCreateCallbackEvent"+message, zap.Any("serviceId", serviceId))
		return nil, agerrors.NewCode(agcodes.New(errorcode.ServiceIDNotExist, "接口不存在", "", message, "", ""))
	}

	//校验ServiceName是否存在
	serviceName := service.ServiceName
	if serviceName == "" {
		message := "请确保接口名称存在"
		log.Error("genCreateCallbackEvent"+message, zap.Any("serviceName", serviceName))
		return nil, agerrors.NewCode(agcodes.New(errorcode.ServiceNameNotExist, "接口名称不存在", "", message, "", ""))
	}

	var targetPath string
	if service.PrePath != nil {
		targetPath = *service.PrePath + service.ServicePath
	} else {
		targetPath = service.ServicePath
	}
	var IsOldSvc bool
	if service.SourceType == 1 {
		IsOldSvc = true
	} else {
		IsOldSvc = false
	}
	createRequest := &callback_register.CreateRequest{
		PaasId:        *service.PaasID,
		SvcId:         service.ServiceID,
		SvcName:       service.ServiceName,
		TargetPath:    targetPath,
		PubPath:       constant.CallbackPrePath + "/" + *service.PaasID + targetPath,
		TargetIsHttps: true,
		Description:   *service.Description,
		SvcCode:       service.ServiceCode,
		IsOldSvc:      IsOldSvc,
	}

	log.Info("genCreateCallbackEvent", zap.Any("createRequest", createRequest))
	return createRequest, nil
}

// 更新接口回调
func (c *DataApplicationServiceCallback) OnUpdateService(ctx context.Context, service *model.Service) (serviceCallback *model.Service, err error) {
	updateRequest, err := c.genUpdateCallbackEvent(service)
	if err != nil {
		return nil, err
	}
	if result, err := c.Client.Update(ctx, updateRequest); err != nil {
		return nil, err
	} else {
		service.UpdateFlag = &result.SyncFlag
		service.UpdateMsg = &result.Msg
	}
	return service, nil
}

// 生成更新接口事件
func (c *DataApplicationServiceCallback) genUpdateCallbackEvent(service *model.Service) (*callback_register.UpdateRequest, error) {
	log.Info("genUpdateCallbackEvent", zap.Any("service", service))

	//校验PaasId是否存在
	paasId := *service.PaasID
	if paasId == "" {
		message := "请确保接口所属应用存在"
		log.Error("genUpdateCallbackEvent"+message, zap.Any("paasId", paasId))
		return nil, agerrors.NewCode(agcodes.New(errorcode.ServiceIDNotExist, "接口所属应用不存在", "", message, "", ""))
	}

	//校验ServiceID是否存在
	serviceId := service.ServiceID
	if serviceId == "" {
		message := "请确保接口存在"
		log.Error("genUpdateCallbackEvent"+message, zap.Any("serviceId", serviceId))
		return nil, agerrors.NewCode(agcodes.New(errorcode.ServiceIDNotExist, "接口不存在", "", message, "", ""))
	}

	//校验ServiceName是否存在
	serviceName := service.ServiceName
	if serviceName == "" {
		message := "请确保接口名称存在"
		log.Error("genUpdateCallbackEvent"+message, zap.Any("serviceName", serviceName))
		return nil, agerrors.NewCode(agcodes.New(errorcode.ServiceNameNotExist, "接口名称不存在", "", message, "", ""))
	}

	var targetPath string
	if service.PrePath != nil {
		targetPath = *service.PrePath + service.ServicePath
	} else {
		targetPath = service.ServicePath
	}
	var IsOldSvc bool
	if service.SourceType == 1 {
		IsOldSvc = true
	} else {
		IsOldSvc = false
	}
	updateRequest := &callback_register.UpdateRequest{
		PaasId:        *service.PaasID,
		SvcId:         service.ServiceID,
		SvcName:       service.ServiceName,
		TargetPath:    targetPath,
		PubPath:       constant.CallbackPrePath + "/" + *service.PaasID + targetPath,
		TargetIsHttps: true,
		Description:   *service.Description,
		SvcCode:       service.ServiceCode,
		IsOldSvc:      IsOldSvc,
	}

	log.Info("genUpdateCallbackEvent", zap.Any("updateRequest", updateRequest))
	return updateRequest, nil
}

// 接口状态修改回调
func (c *DataApplicationServiceCallback) OnServiceStatusUpdate(ctx context.Context, service *model.Service, status string) (serviceCallback *model.Service, err error) {
	updateStatusRequest, err := c.genServiceStatusUpdateCallbackEvent(service, status)
	if err != nil {
		return nil, err
	}
	if _, err := c.Client.StatusUpdate(ctx, updateStatusRequest); err != nil {
		return nil, err
	} else {
		//暂不启用
	}
	return service, nil
}

// 生成更新接口状态事件
func (c *DataApplicationServiceCallback) genServiceStatusUpdateCallbackEvent(service *model.Service, status string) (*callback_register.StatusUpdateRequest, error) {
	log.Info("genUpdateStatusCallbackEvent", zap.Any("service", service))

	//校验PaasId是否存在
	paasId := *service.PaasID
	if paasId == "" {
		message := "请确保接口所属应用存在"
		log.Error("genUpdateCallbackEvent"+message, zap.Any("paasId", paasId))
		return nil, agerrors.NewCode(agcodes.New(errorcode.ServiceIDNotExist, "接口所属应用不存在", "", message, "", ""))
	}

	//校验ServiceID是否存在
	serviceId := service.ServiceID
	if serviceId == "" {
		message := "请确保接口存在"
		log.Error("genUpdateCallbackEvent"+message, zap.Any("serviceId", serviceId))
		return nil, agerrors.NewCode(agcodes.New(errorcode.ServiceIDNotExist, "接口不存在", "", message, "", ""))
	}
	var IsOldSvc bool
	if service.SourceType == 1 {
		IsOldSvc = true
	} else {
		IsOldSvc = false
	}

	updateStatusRequest := &callback_register.StatusUpdateRequest{
		PaasId:   *service.PaasID,
		SvcId:    service.ServiceID,
		Status:   status,
		SvcCode:  service.ServiceCode,
		IsOldSvc: IsOldSvc,
	}

	log.Info("genServiceStatusUpdateCallbackEvent", zap.Any("updateStatusRequest", updateStatusRequest))
	return updateStatusRequest, nil
}
