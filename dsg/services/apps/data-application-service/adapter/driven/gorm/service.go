package gorm

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"path"
	"strconv"
	"strings"
	"time"

	"github.com/samber/lo"

	"github.com/google/uuid"
	"go.uber.org/zap"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"

	"github.com/kweaver-ai/dsg/services/apps/data-application-service/adapter/driven/microservice"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/adapter/driven/mq"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/common/constant"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/common/dto"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/common/enum"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/common/settings"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/common/util"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/infrastructure/repository/db"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-common/callback"
	callback_register "github.com/kweaver-ai/idrm-go-common/callback/data_application_service/register"
	configuration_center "github.com/kweaver-ai/idrm-go-common/rest/configuration_center"
	"github.com/kweaver-ai/idrm-go-common/util/sets"
	"github.com/kweaver-ai/idrm-go-common/workflow"
	"github.com/kweaver-ai/idrm-go-common/workflow/common"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
)

type ServiceRepo interface {
	ServiceCreate(ctx context.Context, req *dto.ServiceCreateOrTempReq, isCreate bool) (res *dto.ServiceCreateRes, err error)
	ServiceList(ctx context.Context, req *dto.ServiceListReq) (res []*dto.ServiceInfoAndDraftFlag, count int64, err error)
	GetByOwnerID(ctx context.Context, OwnerId string) (serviceID []string, err error)
	ServiceGet(ctx context.Context, serviceID string) (res *dto.ServiceGetRes, err error)
	ServiceGetName(ctx context.Context, serviceID string) (serviceName string, err error)
	UpdateAuthedUsers(ctx context.Context, id string, users []string) error
	RemoveAuthedUsers(ctx context.Context, id string, userID string) error
	UserCanAuthService(ctx context.Context, userID string, viewID string) (can bool, err error)
	UserAuthedServices(ctx context.Context, userID string, serviceID ...string) (ds []*model.ServiceAuthedUser, err error)
	GetSubServices(ctx context.Context, serviceID ...string) (sd map[string]*model.SubService, err error)
	GetSubService(ctx context.Context, subServiceID string) (data *model.SubService, err error)
	ServiceGetFields(ctx context.Context, serviceID string, fields []string) (service *model.Service, err error)
	ServicesGetByDataViewId(ctx context.Context, dataViewId string) (res []*model.Service, err error)
	ServicesDataViewID(ctx context.Context, serviceID string) (dataViewIds []string, err error)
	ServiceUpdate(ctx context.Context, req *dto.ServiceUpdateReqOrTemp, isCheckStatus bool) (err error)
	ServiceDelete(ctx context.Context, serviceID string) (err error)
	ServiceFormToScript(ctx context.Context, req *dto.ServiceFormToSqlReq) (res *dto.ServiceFormToSqlRes, err error)
	IsServiceNameExist(ctx context.Context, serviceName, serviceID string) (exist bool, err error)
	IsServicePathExist(ctx context.Context, servicePath, serviceID string) (exist bool, err error)
	IsServiceIDExist(ctx context.Context, serviceID string) (exist bool, err error)
	IsServiceIDStatusExist(ctx context.Context, serviceID, status string) (exist bool, err error)
	IsServiceIDInStatusesExist(ctx context.Context, serviceID string, statuses []string) (exist bool, err error)
	IsServiceIDPublishStatusExist(ctx context.Context, serviceID, publishStatus string) (exist bool, err error)
	ServiceIsComplete(ctx context.Context, serviceID string) (complete bool, err error)
	ServiceESIndexCreate(ctx context.Context, service *model.Service) (err error)
	ServiceESIndexDelete(ctx context.Context, service *model.Service) (err error)
	ServiceESIndex(ctx context.Context, service *model.Service, indexType string) (err error)
	AuditProcessInstanceCreate(ctx context.Context, serviceID string, audit *model.Service) (err error)
	IsExistAuditing(ctx context.Context, serviceID string) (exist bool, err error)
	GetSubjectDomainIdsByUserId(ctx context.Context, userId string) (subjectDomainIds []string, err error)
	ConsumerWorkflowAuditResultPublish(ctx context.Context, msg *common.AuditResultMsg) error
	ConsumerWorkflowAuditResultChange(ctx context.Context, msg *common.AuditResultMsg) error
	ConsumerWorkflowAuditResultOffline(ctx context.Context, msg *common.AuditResultMsg) error
	ConsumerWorkflowAuditResultOnline(ctx context.Context, msg *common.AuditResultMsg) error
	ConsumerWorkflowAuditMsg(ctx context.Context, msg *common.AuditProcessMsg) error
	ConsumerWorkflowAuditProcDeletePublish(ctx context.Context, msg *common.AuditProcDefDelMsg) error
	ConsumerWorkflowAuditProcDeleteChange(ctx context.Context, msg *common.AuditProcDefDelMsg) error
	ConsumerWorkflowAuditProcDeleteOffline(ctx context.Context, msg *common.AuditProcDefDelMsg) error
	ConsumerWorkflowAuditProcDeleteOnline(ctx context.Context, msg *common.AuditProcDefDelMsg) error
	ServiceVersionBack(ctx context.Context, serviceID string) (resp *dto.ServiceIdRes, err error)
	ServiceUpdateStatus(ctx context.Context, serviceID string, lineStatus string) (resp *dto.ServiceIdRes, err error)
	// 更新指定接口服务的上线状态 status 和发布状态 publish_status 为指定值
	ServiceUpdateStatusAndPublishStatus(ctx context.Context, status, publishStatus string, opts ServiceUpdateOptions) error
	UndoChangeAuditToUpdateService(ctx context.Context, serviceID string) (resp *dto.ServiceIdRes, err error)
	UpdateServicePublishStatus(ctx context.Context, serviceID string, publishStatus string) (resp *dto.ServiceIdRes, err error)
	ServiceChangeInPublished(ctx context.Context, req *dto.ServiceChangeReq) (resp *dto.ServiceIdRes, err error)
	ServiceChangeInChangeAuditReject(ctx context.Context, req *dto.ServiceChangeReq) (resp *dto.ServiceIdRes, err error)
	GetDraftService(ctx context.Context, serviceID string) (resp *dto.ServiceGetRes, err error)
	IsExistDraftService(ctx context.Context, serviceID string) (exist bool, err error)
	RecoverToPublished(ctx context.Context, serviceID string) (resp *dto.ServiceIdRes, err error)
	GetAllUndeleteServiceByOffset(ctx context.Context, offset int, limit int) (services []*model.Service, err error)
	GetAllUndeleteServiceByServices(ctx context.Context, servicesIds ...string) (Services []*model.Service, err error)
	GetAllUndeleteServiceCount(ctx context.Context) (count int64, err error)
	GetAllUndeleteService(ctx context.Context) (Services []*model.Service, err error)
	GetIdByPublishedId(ctx context.Context, publishedId string) (serviceId string, err error)
	GetTempServiceId(ctx context.Context, serviceId string) (sid string, err error)
	// 获取指定接口服务的 OwnerID
	GetOwnerID(ctx context.Context, id string) (string, error)
	GetServicesMaxResponse(ctx context.Context, req *dto.GetServicesMaxResponseReq) (res []*model.ServiceParam, err error)
	PushCatalogMessage(ctx context.Context, serviceId string, t string) error
	// 状态统计相关方法
	GetStatusStatistics(ctx context.Context, serviceType string) (*ServiceStatusStatistics, error)
	// 部门统计相关方法
	GetDepartmentStatistics(ctx context.Context, top int) ([]*DepartmentStatisticsResult, error)
	// 更新服务回调信息
	UpdateServiceCallbackInfo(ctx context.Context, serviceID string, updateData map[string]interface{}) error
	// 服务同步回调
	ServiceSyncCallback(ctx context.Context, serviceID string) (*ServiceSyncCallbackRes, error)
	// 通过接口ID列表获取接口列表
	GetServicesByIDs(ctx context.Context, ids []string) (res []*dto.ServiceInfoAndDraftFlag, err error)
	// 处理回调事件
	HandleCallbackEvent(ctx context.Context, serviceID string) error
}

// ServiceStatusStatistics 服务状态统计结果
type ServiceStatusStatistics struct {
	ServiceCount     int64 `json:"service_count"`
	UnpublishedCount int64 `json:"unpublished_count"`
	PublishedCount   int64 `json:"published_count"`
	NotlineCount     int64 `json:"notline_count"`
	OnLineCount      int64 `json:"online_count"`
	OfflineCount     int64 `json:"offline_count"`

	// 发布审核相关统计
	AfDataApplicationPublishAuditingCount int64 `json:"af_data_application_publish_auditing_count"`
	AfDataApplicationPublishRejectCount   int64 `json:"af_data_application_publish_reject_count"`
	AfDataApplicationPublishPassCount     int64 `json:"af_data_application_publish_pass_count"`

	// 上线审核相关统计
	AfDataApplicationOnlineAuditingCount int64 `json:"af_data_application_online_auditing_count"`
	AfDataApplicationOnlinePassCount     int64 `json:"af_data_application_online_pass_count"`
	AfDataApplicationOnlineRejectCount   int64 `json:"af_data_application_online_reject_count"`

	// 下线审核相关统计
	AfDataApplicationOfflineAuditingCount int64 `json:"af_data_application_offline_auditing_count"`
	AfDataApplicationOfflinePassCount     int64 `json:"af_data_application_offline_pass_count"`
	AfDataApplicationOfflineRejectCount   int64 `json:"af_data_application_offline_reject_count"`
}

// DepartmentStatisticsResult 部门统计结果
type DepartmentStatisticsResult struct {
	DepartmentID   string `json:"department_id"`   // 部门ID
	DepartmentName string `json:"department_name"` // 部门名称
	TotalCount     int64  `json:"total_count"`     // 总数量
	PublishedCount int64  `json:"published_count"` // 已发布数量
}

type ServiceSyncCallbackRes struct {
	Result string `json:"result"`
	Msg    string `json:"msg"`
}

type serviceRepo struct {
	data                        *db.Data
	dataViewRepo                microservice.DataViewRepo
	configurationCenterRepo     microservice.ConfigurationCenterRepo
	userManagementRepo          microservice.UserManagementRepo
	DataSubjectRepo             microservice.DataSubjectRepo
	serviceDailyRecordRepo      ServiceDailyRecordRepo
	serviceCategoryRelationRepo ServiceCategoryRelationRepo
	dataCatalogRepo             microservice.DataCatalogRepo // 新增字段
	mq                          *mq.MQ
	wf                          workflow.WorkflowInterface
	callback                    callback.Interface // callback 客户端
	configurationCenterDriven   configuration_center.Driven
}

func (r *serviceRepo) ServiceESIndexCreate(ctx context.Context, service *model.Service) (err error) {
	return r.ServiceESIndex(ctx, service, "create")
}

func (r *serviceRepo) ServiceESIndexDelete(ctx context.Context, service *model.Service) (err error) {
	return r.ServiceESIndex(ctx, service, "delete")
}

func NewServiceRepo(
	data *db.Data,
	dataViewRepo microservice.DataViewRepo,
	configurationCenterRepo microservice.ConfigurationCenterRepo,
	userManagementRepo microservice.UserManagementRepo,
	DataSubjectRepo microservice.DataSubjectRepo,
	serviceDailyRecordRepo ServiceDailyRecordRepo,
	serviceCategoryRelationRepo ServiceCategoryRelationRepo,
	dataCatalogRepo microservice.DataCatalogRepo, // 新增参数
	mq *mq.MQ,
	wf workflow.WorkflowInterface,
	callback callback.Interface, // 新增参数
	configurationCenterDriven configuration_center.Driven,
) ServiceRepo {
	return &serviceRepo{
		data:                        data,
		dataViewRepo:                dataViewRepo,
		configurationCenterRepo:     configurationCenterRepo,
		userManagementRepo:          userManagementRepo,
		DataSubjectRepo:             DataSubjectRepo,
		serviceDailyRecordRepo:      serviceDailyRecordRepo,
		dataCatalogRepo:             dataCatalogRepo, // 新增赋值
		serviceCategoryRelationRepo: serviceCategoryRelationRepo,
		mq:                          mq,
		wf:                          wf,
		callback:                    callback, // 新增赋值
		configurationCenterDriven:   configurationCenterDriven,
	}
}

func (r *serviceRepo) ServiceCreate(ctx context.Context, req *dto.ServiceCreateOrTempReq, isCreate bool) (res *dto.ServiceCreateRes, err error) {
	if isCreate {
		//检查接口名称唯一性
		exist, err := r.IsServiceNameExist(ctx, req.ServiceInfo.ServiceName, "")
		if err != nil {
			log.WithContext(ctx).Error("ServiceCreate", zap.Error(err))
			return nil, err
		}
		if exist {
			log.WithContext(ctx).Error("ServiceCreate", zap.Error(errorcode.Desc(errorcode.ServiceNameExist)))
			return nil, errorcode.Desc(errorcode.ServiceNameExist)
		}

		//检查接口路径唯一性
		exist, err = r.IsServicePathExist(ctx, req.ServiceInfo.ServicePath, "")
		if err != nil {
			log.WithContext(ctx).Error("ServiceCreate", zap.Error(err))
			return nil, err
		}
		if exist {
			log.WithContext(ctx).Error("ServiceCreate", zap.Error(errorcode.Desc(errorcode.ServicePathExist)))
			return nil, errorcode.Desc(errorcode.ServicePathExist)
		}
	}

	ownerIDs := make([]string, 0, len(req.ServiceInfo.Owners))
	ownerNames := make([]string, 0, len(req.ServiceInfo.Owners))
	// 对Owners进行去重
	uniqueOwners := make([]dto.Owners, 0, len(req.ServiceInfo.Owners))
	seen := make(map[string]bool)
	for _, owner := range req.ServiceInfo.Owners {
		if !seen[owner.OwnerId] {
			seen[owner.OwnerId] = true
			uniqueOwners = append(uniqueOwners, owner)
		}
	}
	req.ServiceInfo.Owners = uniqueOwners
	// 数据owner
	for index, owner := range req.ServiceInfo.Owners {
		if owner.OwnerId != "" {
			userInfo, err := r.userManagementRepo.GetUserById(ctx, owner.OwnerId)
			if ee := new(microservice.UserNotFoundError); errors.As(err, &ee) {
				return nil, errorcode.Detail(errorcode.ServiceOwnerNotFound, ee)
			} else if err != nil {
				return nil, err
			}
			req.ServiceInfo.Owners[index].OwnerName = userInfo.Name
			ownerIDs = append(ownerIDs, owner.OwnerId)
			ownerNames = append(ownerNames, userInfo.Name)
		}
	}
	req.ServiceInfo.OwnerId = strings.Join(ownerIDs, ",")
	req.ServiceInfo.OwnerName = strings.Join(ownerNames, ",")

	//检查部门id
	var departmentName string
	if req.ServiceInfo.Department.ID != "" {
		departmentGet, err := r.configurationCenterRepo.DepartmentGet(ctx, req.ServiceInfo.Department.ID)
		if err != nil {
			return nil, errorcode.Desc(errorcode.DepartmentIdNotExist)
		}

		departmentName = departmentGet.Path
	}

	//检查主题域id
	var subjectDomainName string
	if req.ServiceInfo.SubjectDomainId != "" {
		dataSubjectGet, err := r.DataSubjectRepo.DataSubjectGet(ctx, req.ServiceInfo.SubjectDomainId)
		if err != nil {
			return nil, errorcode.Desc(errorcode.SubjectDomainIdNotExist)
		}
		//只能绑定L2或者L3
		if !(len(strings.Split(dataSubjectGet.PathId, "/")) == 2 || len(strings.Split(dataSubjectGet.PathId, "/")) == 3) {
			return nil, errorcode.Desc(errorcode.SubjectDomainIdNotL3)
		}

		subjectDomainName = dataSubjectGet.PathName
	}

	//检查数据视图id
	var dataViewGetRes = &microservice.DataViewGetRes{}
	if req.ServiceParam.DataViewId != "" && req.ServiceInfo.ServiceType == "service_generate" {
		dataViewGetRes, err = r.dataViewRepo.DataViewGet(ctx, req.ServiceParam.DataViewId)
		if err != nil {
			return nil, errorcode.Desc(errorcode.DataViewIdNotExist)
		}
		if dataViewGetRes.LastPublishTime == 0 {
			return nil, errorcode.Desc(errorcode.DataViewIdNotPublish)
		}
	}

	//检查数据源id
	var datasourceResRes = &microservice.DatasourceResRes{}
	if dataViewGetRes.DatasourceID != "" && req.ServiceInfo.ServiceType == "service_generate" {
		datasourceResRes, err = r.configurationCenterRepo.DatasourceGet(ctx, dataViewGetRes.DatasourceID)
		if err != nil {
			return nil, errorcode.Desc(errorcode.DatasourceIdNotExist)
		}
	}

	//生成接口编码
	serviceCode := ""
	codeGeneration, err := r.configurationCenterRepo.CodeGeneration(ctx, microservice.CodeGenerationRuleApiID, 1)
	if err != nil {
		serviceCode = util.GetUniqueString()
		//return nil, errorcode.Detail(errorcode.ServiceCodeGenerationError, err)
	} else {
		serviceCode = codeGeneration.Entries[0]
	}
	user := util.GetUser(ctx)
	//接口表
	serviceID := uuid.New().String()

	service := &model.Service{
		ServiceName:       req.ServiceInfo.ServiceName,
		ServiceID:         serviceID,
		ServiceCode:       serviceCode,
		ServicePath:       req.ServiceInfo.ServicePath,
		DepartmentID:      req.ServiceInfo.Department.ID,
		DepartmentName:    departmentName,
		OwnerID:           req.ServiceInfo.OwnerId,
		OwnerName:         req.ServiceInfo.OwnerName,
		SubjectDomainID:   req.ServiceInfo.SubjectDomainId,
		SubjectDomainName: subjectDomainName,
		InfoSystemID:      lo.EmptyableToPtr(req.ServiceInfo.InfoSystemId),
		AppsID:            lo.EmptyableToPtr(req.ServiceInfo.AppsId),
		PaasID:            &req.ServiceInfo.PaasID,
		PrePath:           &req.ServiceInfo.PrePath,
		CreateModel:       req.ServiceParam.CreateModel,
		HTTPMethod:        req.ServiceInfo.HTTPMethod,
		ReturnType:        "json",
		Protocol:          "http",
		Description:       &req.ServiceInfo.Description,
		DeveloperID:       req.ServiceInfo.Developer.ID,
		DeveloperName:     req.ServiceInfo.Developer.Name,
		RateLimiting:      uint32(req.ServiceInfo.RateLimiting),
		Timeout:           uint32(req.ServiceInfo.Timeout),
		ServiceType:       req.ServiceInfo.ServiceType,
		PublishStatus:     req.ServiceInfo.PublishStatus, //这里create加入发布状态没有安全问题，Service层已重新赋值控制
		AuditType:         req.ServiceInfo.AuditType,
		IsChanged:         req.ServiceInfo.IsChanged,
		ChangedServiceId:  req.ServiceInfo.ChangedServiceId,
		CreatedBy:         user.Id,
		CreateTime:        time.Now(),
	}

	if req.ServiceInfo.ServiceType == "service_register" {
		service.BackendServiceHost = req.ServiceInfo.BackendServiceHost
		service.BackendServicePath = req.ServiceInfo.BackendServicePath
		service.FileID = req.ServiceInfo.File.FileID
	}

	//检查类目信息
	log.WithContext(ctx).Info("ServiceCreate", zap.Any("req.CategoryInfo", req.CategoryInfo))
	if req.ServiceInfo.CategoryInfo != nil {
		req.CategoryInfo = req.ServiceInfo.CategoryInfo
	}
	if len(req.CategoryInfo) > 0 {
		for _, category := range req.CategoryInfo {
			log.WithContext(ctx).Info("ServiceCreate", zap.Any("category", category))
			if category.CategoryId == "" {
				return nil, errorcode.Desc(errorcode.PublicInvalidParameter) // 类目ID为空
			}
			// 调用 dataCatalogRepo.CategoryTreeGet 方法检查该类目是否存在
			_, err := r.dataCatalogRepo.CategoryTreeGet(ctx, category.CategoryId)
			if err != nil {
				return nil, errorcode.Desc(errorcode.CategoryIdNotExist) // 类目不存在
			}
		}
		// 批量插入 ServiceCategoryRelation 记录
		relations := make([]*model.ServiceCategoryRelation, 0, len(req.CategoryInfo))
		log.WithContext(ctx).Info("ServiceCreate", zap.Any("relations", relations))
		for _, category := range req.CategoryInfo {
			relations = append(relations, &model.ServiceCategoryRelation{
				ServiceID:      serviceID,
				CategoryID:     category.CategoryId,
				CategoryNodeID: category.CategoryNodeID,
			})
		}
		if err := r.serviceCategoryRelationRepo.BatchCreate(ctx, relations); err != nil {
			log.WithContext(ctx).Error("ServiceCreate", zap.Error(err))
			return nil, err
		}
	}

	//接口参数配置表
	var serviceParams []*model.ServiceParam
	for _, p := range req.ServiceParam.DataTableRequestParams {
		m := &model.ServiceParam{
			ServiceID:    serviceID,
			ParamType:    "request",
			CnName:       p.CNName,
			EnName:       p.EnName,
			Description:  p.Description,
			DataType:     p.DataType,
			Required:     p.Required,
			DefaultValue: p.DefaultValue,
		}

		if req.ServiceInfo.ServiceType == "service_generate" {
			m.Operator = p.Operator
		}

		serviceParams = append(serviceParams, m)
	}
	if req.ServiceInfo.ServiceType == "service_generate" {
		for _, p := range req.ServiceParam.DataTableResponseParams {
			m := &model.ServiceParam{
				ServiceID:   serviceID,
				ParamType:   "response",
				CnName:      p.CNName,
				EnName:      p.EnName,
				Description: p.Description,
				DataType:    p.DataType,
				Sequence:    uint32(p.Sequence),
				Sort:        p.Sort,
				Masking:     p.Masking,
			}
			serviceParams = append(serviceParams, m)
		}
	}

	//接口脚本模型表
	serviceScriptModel := &model.ServiceScriptModel{
		ServiceID: serviceID,
	}

	//示例数据长度不能超过 TEXT 类型的最大长度 65535 字节
	if len(req.ServiceTest.RequestExample) < 65535 {
		serviceScriptModel.RequestExample = &req.ServiceTest.RequestExample
	}
	if len(req.ServiceTest.ResponseExample) < 65535 {
		serviceScriptModel.ResponseExample = &req.ServiceTest.ResponseExample
	}

	if req.ServiceInfo.ServiceType == "service_generate" {
		serviceScriptModel.Script = &req.ServiceParam.Script
		serviceScriptModel.Page = req.ServiceResponse.Page
		serviceScriptModel.PageSize = uint32(req.ServiceResponse.PageSize)
	}

	err = r.data.DB.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(service).Error; err != nil {
			log.WithContext(ctx).Error("ServiceCreate", zap.Error(err))
			return err
		}

		//只有接口生成模式 有数据源配置
		if req.ServiceInfo.ServiceType == "service_generate" {
			//接口数据源表
			catalogName, schemaName := r.dataViewRepo.ParseViewSourceCatalogName(dataViewGetRes.ViewSourceCatalogName)
			dataSource := &model.ServiceDataSource{
				ServiceID:      serviceID,
				DataViewID:     req.ServiceParam.DataViewId,
				DataViewName:   dataViewGetRes.BusinessName,
				CatalogName:    catalogName,
				DataSourceID:   req.ServiceParam.DatasourceId,
				DataSourceName: datasourceResRes.Name,
				DataSchemaName: schemaName,
				DataTableName:  dataViewGetRes.TechnicalName,
			}

			if err := tx.Create(dataSource).Error; err != nil {
				log.WithContext(ctx).Error("ServiceCreate", zap.Error(err))
				return err
			}
		}

		if len(serviceParams) > 0 {
			if err := tx.Create(serviceParams).Error; err != nil {
				log.WithContext(ctx).Error("ServiceCreate", zap.Error(err))
				return err
			}
		}

		//只有接口生成模式 有返回结果过滤
		if req.ServiceInfo.ServiceType == "service_generate" {
			//接口返回结果过滤配置表
			var serviceResponseFilters []*model.ServiceResponseFilter
			if len(req.ServiceResponse.Rules) > 0 {
				for _, filter := range req.ServiceResponse.Rules {
					if filter.Param == "" {
						continue
					}
					serviceResponse := &model.ServiceResponseFilter{
						ServiceID: serviceID,
						Param:     filter.Param,
						Operator:  filter.Operator,
						Value:     filter.Value,
					}
					serviceResponseFilters = append(serviceResponseFilters, serviceResponse)
				}
			}
			if len(serviceResponseFilters) > 0 {
				if err := tx.Create(serviceResponseFilters).Error; err != nil {
					log.WithContext(ctx).Error("ServiceCreate", zap.Error(err))
					return err
				}
			}
		}

		if err := tx.Create(serviceScriptModel).Error; err != nil {
			log.WithContext(ctx).Error("ServiceCreate", zap.Error(err))
			return err
		}

		return nil
	})

	if err != nil {
		log.WithContext(ctx).Error("ServiceCreate", zap.Error(err))
		return nil, err
	}

	//创建、暂存时，索引入队，后续审核通过后，会有消费逻辑再更新索引，草稿状态不创建索引
	if isCreate {
		err := r.ServiceESIndexCreate(ctx, service)
		if err != nil {
			log.Info("ServiceCreate  --> 索引入队失败，ServiceId："+service.ServiceID, zap.Error(err))
			return nil, err
		}
	}

	/*if err = r.PushCatalogMessage(ctx, service.ServiceID, "create"); err != nil { //创建、暂存
		return nil, err
	}*/

	res = &dto.ServiceCreateRes{
		ServiceID: serviceID,
	}
	return res, err
}
func (r *serviceRepo) PushCatalogMessage(ctx context.Context, serviceID string, t string) error {
	var message []byte
	var err error
	switch t {
	case "create", "update":
		service, err := r.ServiceGet(ctx, serviceID)
		if err != nil {
			return err
		}
		message, err = json.Marshal(&CatalogMessage{
			ServiceID:        service.ServiceInfo.ServiceID,
			Type:             t,
			PublishStatus:    service.ServiceInfo.PublishStatus,
			PublishTime:      service.ServiceInfo.PublishTime,
			DataViewId:       service.ServiceParam.DataViewId,
			ServiceName:      service.ServiceInfo.ServiceName,
			ServiceCode:      service.ServiceInfo.ServiceCode,
			DepartmentId:     service.ServiceInfo.Department.ID,
			SubjectDomainId:  service.ServiceInfo.SubjectDomainId,
			ChangedServiceId: service.ServiceInfo.ChangedServiceId,
		})
	case "delete":
		message, err = json.Marshal(&CatalogMessage{
			ServiceID: serviceID,
			Type:      t,
		})
	}
	if err != nil {
		return err
	}
	if err = r.mq.KafkaClient.Pub("af.interface-svc.catalog", message); err != nil {
		log.WithContext(ctx).Error("PushCatalogMessage KafkaClient.Pub Error : "+string(message), zap.Error(err))
		return err
	}
	return nil
}

type CatalogMessage struct {
	ServiceID        string `json:"service_id"`
	Type             string `json:"type"`
	PublishStatus    string `json:"publish_status"`         // 发布状态
	PublishTime      string `json:"publish_time"`           // 发布时间
	DataViewId       string `json:"data_view_id"`           // 数据视图Id
	ServiceName      string `json:"service_name,omitempty"` // 接口名称
	ServiceCode      string `json:"service_code,omitempty"` // 编码
	DepartmentId     string `json:"department_id"`          // 部门ID
	SubjectDomainId  string `json:"subject_domain_id"`      // 主题域id
	ChangedServiceId string `json:"changed_service_id"`
}

func (r *serviceRepo) ServiceFormToScript(ctx context.Context, req *dto.ServiceFormToSqlReq) (res *dto.ServiceFormToSqlRes, err error) {
	//检查数据视图id
	var dataViewGetRes = &microservice.DataViewGetRes{}
	if req.DataViewId != "" {
		dataViewGetRes, err = r.dataViewRepo.DataViewGet(ctx, req.DataViewId)
		if err != nil {
			return nil, errorcode.Desc(errorcode.DataViewIdNotExist)
		}
	}
	if dataViewGetRes.LastPublishTime == 0 {
		return nil, errorcode.Desc(errorcode.DataViewIdNotPublish)
	}

	tx := r.data.DB.WithContext(ctx).Session(&gorm.Session{DryRun: true}).Table(dataViewGetRes.TechnicalName)

	var selects []string
	for _, p := range req.DataTableRequestParams {
		//sql字段名增加反引号
		quote := util.Quote(tx, p.EnName)
		switch p.Operator {
		case "=":
			tx = tx.Where(fmt.Sprintf("%s %s ${%s}", quote, "=", p.EnName))
		case "!=":
			tx = tx.Where(fmt.Sprintf("%s %s ${%s}", quote, "!=", p.EnName))
		case ">":
			tx = tx.Where(fmt.Sprintf("%s %s ${%s}", quote, ">", p.EnName))
		case ">=":
			tx = tx.Where(fmt.Sprintf("%s %s ${%s}", quote, ">=", p.EnName))
		case "<":
			tx = tx.Where(fmt.Sprintf("%s %s ${%s}", quote, "<", p.EnName))
		case "<=":
			tx = tx.Where(fmt.Sprintf("%s %s ${%s}", quote, "<=", p.EnName))
		case "like":
			tx = tx.Where(fmt.Sprintf("%s %s ${%s}", quote, "like", p.EnName))
		case "in":
			tx = tx.Where(fmt.Sprintf("%s %s (${%s})", quote, "in", p.EnName))
		case "not in":
			tx = tx.Where(fmt.Sprintf("%s %s (${%s})", quote, "not in", p.EnName))
		}
	}

	for _, p := range req.DataTableResponseParams {
		quote := util.Quote(tx, p.EnName)
		selects = append(selects, quote)
		switch p.Sort {
		case "asc":
			tx = tx.Order(quote + " asc")
		case "desc":
			tx = tx.Order(quote + " desc")
		}
	}

	tx = tx.Select(strings.Join(selects, ","))

	tx.Find(nil)

	sql := tx.Dialector.Explain(tx.Statement.SQL.String(), tx.Statement.Vars...)

	res = &dto.ServiceFormToSqlRes{
		SQL: sql,
	}

	return res, nil
}

func UnChanged() func(db *gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		return db.Where("(is_changed = '0' OR is_changed = '')")
	} //is_changed是0，为默认状态。为1，代表是草稿，List接口不返回
}

// expandDepartmentWithSubDepartments 扩展单个部门ID，返回该部门及其所有子部门的ID列表
// 如果获取子部门失败或没有子部门，则只返回当前部门ID
func expandDepartmentWithSubDepartments(ctx context.Context, configurationCenterRepo microservice.ConfigurationCenterRepo, departmentID string) ([]string, error) {
	if departmentID == "" {
		return nil, nil
	}

	subDepartmentGetRes, err := configurationCenterRepo.SubDepartmentGet(ctx, departmentID)
	if err != nil || subDepartmentGetRes == nil || len(subDepartmentGetRes.Entries) == 0 {
		// 没有子部门或获取失败，只返回当前部门
		return []string{departmentID}, nil
	}

	// 有子部门，返回当前部门 + 所有子部门
	departmentIDs := make([]string, 0, len(subDepartmentGetRes.Entries)+1)
	departmentIDs = append(departmentIDs, departmentID)
	for _, d := range subDepartmentGetRes.Entries {
		departmentIDs = append(departmentIDs, d.Id)
	}
	return departmentIDs, nil
}

// filterDirectDepartmentsAndExpand 从用户部门列表中过滤掉父部门，只保留最底层部门，并扩展为这些部门及其子部门
// 返回：扩展后的部门ID列表（包含最底层部门及其所有子部门，不包含上级部门）
func (r *serviceRepo) filterDirectDepartmentsAndExpand(ctx context.Context, userDepartmentIDs []string) ([]string, error) {
	// 过滤掉空值
	validUserDepartmentIDs := make([]string, 0, len(userDepartmentIDs))
	for _, depID := range userDepartmentIDs {
		if depID != "" {
			validUserDepartmentIDs = append(validUserDepartmentIDs, depID)
		}
	}

	if len(validUserDepartmentIDs) == 0 {
		return nil, nil
	}

	// 如果只有一个部门，直接返回该部门及其子部门
	if len(validUserDepartmentIDs) == 1 {
		return expandDepartmentWithSubDepartments(ctx, r.configurationCenterRepo, validUserDepartmentIDs[0])
	}

	// 多个部门时，需要过滤父部门
	// 步骤1：收集所有用户部门的所有子部门ID，用于识别父部门
	departmentToSubDepartments := make(map[string][]string) // 部门ID -> 其子部门ID列表

	for _, depID := range validUserDepartmentIDs {
		subDepartmentGetRes, err := r.configurationCenterRepo.SubDepartmentGet(ctx, depID)
		if err == nil && subDepartmentGetRes != nil {
			subDeptIDs := make([]string, 0, len(subDepartmentGetRes.Entries))
			for _, d := range subDepartmentGetRes.Entries {
				subDeptIDs = append(subDeptIDs, d.Id)
			}
			departmentToSubDepartments[depID] = subDeptIDs
		}
	}

	// 步骤2：过滤掉父部门，只保留最底层的部门
	// 如果某个部门的子部门列表包含其他用户部门，则该部门是父部门，需要过滤掉
	directDepartmentIDs := make([]string, 0, len(validUserDepartmentIDs))
	for _, depID := range validUserDepartmentIDs {
		isParentDepartment := false
		subDeptIDs, hasSubDepts := departmentToSubDepartments[depID]
		if hasSubDepts {
			for _, subDeptID := range subDeptIDs {
				// 如果子部门ID在用户部门列表中，说明当前部门是父部门
				for _, otherUserDeptID := range validUserDepartmentIDs {
					if otherUserDeptID != depID && subDeptID == otherUserDeptID {
						isParentDepartment = true
						break
					}
				}
				if isParentDepartment {
					break
				}
			}
		}
		// 只保留非父部门（最底层部门）
		if !isParentDepartment {
			directDepartmentIDs = append(directDepartmentIDs, depID)
		}
	}

	// 步骤3：对最底层部门，扩展为：当前部门以及其所有子部门
	expandedDepartmentIDs := make([]string, 0)
	seen := map[string]struct{}{}
	for _, depID := range directDepartmentIDs {
		deptIDs, err := expandDepartmentWithSubDepartments(ctx, r.configurationCenterRepo, depID)
		if err != nil {
			log.WithContext(ctx).Warn("filterDirectDepartmentsAndExpand expandDepartmentWithSubDepartments failed",
				zap.String("departmentID", depID), zap.Error(err))
			continue
		}
		for _, deptID := range deptIDs {
			if _, ok := seen[deptID]; !ok {
				expandedDepartmentIDs = append(expandedDepartmentIDs, deptID)
				seen[deptID] = struct{}{}
			}
		}
	}

	return expandedDepartmentIDs, nil
}

// 支持的发布状态
var supportedPublishStatuses = sets.New(
	enum.PublishStatusUnPublished,
	enum.PublishStatusPubAuditing,
	enum.PublishStatusPublished,
	enum.PublishStatusPubReject,
	enum.PublishStatusChangeAuditing,
	enum.PublishStatusChangeReject,
)

// 支持的上下线状态
var supportedLineStatuses = sets.New(
	enum.LineStatusNotLine,
	enum.LineStatusOnLine,
	enum.LineStatusOffLine,
	enum.LineStatusUpAuditing,
	enum.LineStatusDownAuditing,
	enum.LineStatusUpReject,
	enum.LineStatusDownReject,
)

// forServiceStatusesString 根据指定的 Service Status 添加约束，包括发布状态和上线状态
func forServiceStatusesString(statuses string) func(db *gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		// 未指定发布状态或上线状态，不添加任何约束条件
		if statuses == "" {
			return db
		}

		// 将 statuses 分为发布状态、上线状态
		var publishStatuses, lineStatuses []any
		for _, s := range strings.Split(statuses, ",") {
			switch {
			// 发布状态
			case supportedPublishStatuses.Has(s):
				publishStatuses = append(publishStatuses, s)
			// 上线状态
			case supportedLineStatuses.Has(s):
				lineStatuses = append(lineStatuses, s)
			// 忽略不属于发布状态或上线状态
			default:
				continue
			}
		}

		// 根据指定的发布状态、上线状态生成的约束条件列表
		var expressions []clause.Expression
		// 如果指定了发布状态，则添加 publish_status 约束
		if publishStatuses != nil {
			expressions = append(expressions, clause.IN{Column: "publish_status", Values: publishStatuses})
		}
		// 如果指定了上线状态，则添加 status 约束
		if lineStatuses != nil {
			expressions = append(expressions, clause.IN{Column: "status", Values: lineStatuses})
		}

		// 指定了发布状态或上线状态，添加一个约束条件
		if len(expressions) == 1 {
			return db.Where(expressions[0])
		}

		// 同时指定了发布状态和上线状态，多个约束条件取并集
		return db.Where(clause.Or(expressions...))
	}
}

func (r *serviceRepo) GetByOwnerID(ctx context.Context, OwnerId string) (serviceID []string, err error) {
	tx := r.data.DB.WithContext(ctx).Table(model.TableNameService)
	tx = tx.Select("service_id")
	tx = tx.Where("owner_id LIKE ? ", "%"+OwnerId+"%")
	err = tx.Find(&serviceID).Error
	return serviceID, err
}

func (r *serviceRepo) ServiceList(ctx context.Context, req *dto.ServiceListReq) (res []*dto.ServiceInfoAndDraftFlag, count int64, err error) {
	tx := r.data.DB.WithContext(ctx).Model(&model.Service{}).Scopes(Undeleted(), UnChanged())

	if req.ServiceKeyword != "" {
		tx = tx.Where("(service_name like ? or service_code like ?) ", EscapeLike("%", req.ServiceKeyword, "%"), EscapeLike("%", req.ServiceKeyword, "%"))
	}

	// 如果IsUserDep为true，获取用户部门ID并添加到过滤条件
	var userDepartmentIDs []string
	if req.IsUserDep == "true" {
		//  通过GetUserInfo获取用户ID
		userInfo, err := util.GetUserInfo(ctx)
		if err != nil {
			log.WithContext(ctx).Error("ServiceList GetUserInfo failed", zap.Error(err))
			return nil, 0, err
		}
		// 取用户主部门及子部门ID集合
		userDepartmentIDs, err = r.configurationCenterDriven.GetMainDepartIdsByUserID(ctx, userInfo.ID)
		if err != nil {
			return nil, 0, err
		}
	}

	// 部门过滤
	if req.MyDepartmentResource {
		// 获取当前用户所属部门ID列表（若前面未取到，则此处补充获取）
		if len(userDepartmentIDs) == 0 {

			//  通过GetUserInfo获取用户ID
			userInfo, err := util.GetUserInfo(ctx)
			if err != nil {
				log.WithContext(ctx).Error("ServiceList GetUserInfo failed", zap.Error(err))
				return nil, 0, err
			}
			// 取用户主部门及子部门ID集合
			userDepartmentIDs, err = r.configurationCenterDriven.GetMainDepartIdsByUserID(ctx, userInfo.ID)
			if err != nil {
				return nil, 0, err
			}
		}
		if len(userDepartmentIDs) > 0 {
			tx = tx.Where("department_id in ?", userDepartmentIDs)
		} else {
			// 如果没有扩展的部门ID，返回空结果
			return []*dto.ServiceInfoAndDraftFlag{}, 0, nil
		}
	}
	// 原有按请求参数 DepartmentID / IsAll 的部门过滤
	switch req.DepartmentID {
	case enum.ServiceUncategory:
		// 查询未设置部门的接口
		tx = tx.Where("department_id = ''")
	default:
		if req.DepartmentID != "" {
			// 使用复用函数：获取部门及其子部门
			if req.IsAll == "false" {
				// 不包含子部门，只查自己
				tx = tx.Where("department_id = ?", req.DepartmentID)
			} else {
				// 包含子部门，使用复用函数
				departmentIDs, err := expandDepartmentWithSubDepartments(ctx, r.configurationCenterRepo, req.DepartmentID)
				if err != nil {
					log.WithContext(ctx).Warn("ServiceList expandDepartmentWithSubDepartments failed",
						zap.String("departmentID", req.DepartmentID), zap.Error(err))
					// 获取失败时降级为只查当前部门
					tx = tx.Where("department_id = ?", req.DepartmentID)
				} else {
					if len(departmentIDs) == 1 {
						tx = tx.Where("department_id = ?", departmentIDs[0])
					} else {
						tx = tx.Where("department_id in ?", departmentIDs)
					}
				}
			}
		}

		// 根据用户的部门ID增加过滤（IsUserDep 模式，不包含子部门）
		if req.IsUserDep == "true" && len(userDepartmentIDs) > 0 {
			// 若已设置 DepartmentID 则取交集（通过重复 where 实现）
			tx = tx.Where("department_id in ?", userDepartmentIDs)
		}
	}

	// 信息系统id过滤
	if req.InfoSystemId != "" && req.InfoSystemId != "uncategory" {
		tx = tx.Where("info_system_id = ?", req.InfoSystemId)
	}

	if req.InfoSystemId == "uncategory" {
		tx = tx.Where("info_system_id = '' or info_system_id is null")
	}

	//主题域
	switch req.SubjectDomainId {
	case enum.ServiceUncategory:
		//查询未设置主题域的接口
		tx = tx.Where("subject_domain_id = ''")
	default:
		if req.SubjectDomainId != "" {
			//查询主题域下所有的子域
			dataSubjectList, err := r.DataSubjectRepo.DataSubjectList(ctx, req.SubjectDomainId, "")
			//没有子域 只查自己
			if err != nil || dataSubjectList == nil || len(dataSubjectList.Entries) == 0 || req.IsAll == "false" {
				tx = tx.Where("subject_domain_id = ?", req.SubjectDomainId)
			} else {
				// 有子域 查自己和子域
				var ids = []string{req.SubjectDomainId}
				for _, d := range dataSubjectList.Entries {
					ids = append(ids, d.Id)
				}
				tx = tx.Where("subject_domain_id in ?", ids)
			}
		}
	}

	if req.OwnerId != "" {
		ownerLike := EscapeLike("%", req.OwnerId, "%")
		if req.IsAuthed {
			tx = tx.Where(" service_id in  ? ", req.ServiceIDSlice)
			if req.DataOwner != "" { //我可授权的，过滤数据owner
				tx = tx.Where("owner_id LIKE ?", EscapeLike("%", req.DataOwner, "%"))
			}
		} else {
			tx = tx.Where("owner_id LIKE ?", ownerLike)
		}
	}

	// 支持多上线状态查询（优先使用 online_statuses，如果同时指定了 Status 和 OnlineStatuses，则 OnlineStatuses 优先级更高）
	if req.OnlineStatuses != "" {
		// 解析逗号分隔的状态值
		statusList := strings.Split(req.OnlineStatuses, ",")
		// 过滤并验证状态值，只保留有效的上线状态
		validStatuses := make([]string, 0, len(statusList))
		for _, s := range statusList {
			s = strings.TrimSpace(s) // 去除空格
			if s != "" && supportedLineStatuses.Has(s) {
				validStatuses = append(validStatuses, s)
			}
		}
		// 根据有效状态值数量选择查询方式
		if len(validStatuses) == 1 {
			// 单个状态值使用 = 查询，更语义化
			tx = tx.Where("status = ?", validStatuses[0])
		} else if len(validStatuses) > 1 {
			// 多个状态值使用 IN 查询
			tx = tx.Where("status IN ?", validStatuses)
		}
	} else if req.Status != "" {
		// TODO: 使用 forServiceStatuses(req.Statuses) 替代这个
		// 如果没有指定 OnlineStatuses，则使用单值 Status（向后兼容）
		tx = tx.Where("status = ?", req.Status)
	}

	// TODO: 使用 forServiceStatuses(req.Statuses) 替代这个
	if req.PublishStatus != "" {
		tx = tx.Where("publish_status = ?", req.PublishStatus)
	}

	// 根据指定的发布状态、上线状态添加约束条件
	tx = tx.Scopes(forServiceStatusesString(req.PublishAndOnlineStatuses))

	// 类目过滤逻辑
	if req.CategoryId != "" {
		categoryTreeGetRes, err := r.dataCatalogRepo.CategoryTreeGet(ctx, req.CategoryId)
		if err != nil {
			log.WithContext(ctx).Error("ServiceList CategoryTreeGet failed", zap.Error(err))
			return nil, 0, err
		}

		if req.CategoryNodeId != "" && req.CategoryNodeId != "uncategory" {
			// 1. 通过GetOneByCategoryNodeID方法获取ServiceCategoryRelation
			serviceCategoryRelation, err := r.serviceCategoryRelationRepo.GetOneByCategoryNodeID(ctx, req.CategoryNodeId)
			if err != nil {
				log.WithContext(ctx).Error("ServiceList GetOneByCategoryNodeID failed", zap.Error(err))
				return nil, 0, err
			}

			if serviceCategoryRelation != nil {
				// 2. 根据CategoryTreeGetRes.TreeNode，遍历树型结构获得category_node_id及其所有子节点，组成数组categoryNodeIDs
				categoryNodeIDs := r.collectCategoryNodeIDs(categoryTreeGetRes.TreeNode, req.CategoryNodeId)

				// 3. 通过GetByCategoryNodeIDs方法获取数组serviceCategoryRelations
				serviceCategoryRelations, err := r.serviceCategoryRelationRepo.GetByCategoryNodeIDs(ctx, categoryNodeIDs)
				if err != nil {
					log.WithContext(ctx).Error("ServiceList GetByCategoryNodeIDs failed", zap.Error(err))
					return nil, 0, err
				}

				// 4. 根据ServiceCategoryRelation的ServiceID属性组成新数组serviceIDs
				serviceIDs := make([]string, 0, len(serviceCategoryRelations))
				for _, relation := range serviceCategoryRelations {
					serviceIDs = append(serviceIDs, relation.ServiceID)
				}

				// 5. 对serviceIDs进行去重
				serviceIDs = r.removeDuplicateServiceIDs(serviceIDs)

				// 6. 如果serviceIDs不为空，将serviceIDs加入ServiceList方法的过滤条件
				if len(serviceIDs) > 0 {
					tx = tx.Where("service_id IN ?", serviceIDs)
				} else {
					// 如果没有找到匹配的服务，直接返回空结果
					return []*dto.ServiceInfoAndDraftFlag{}, 0, nil
				}
			} else {
				// 如果没有找到对应的类目关系，直接返回空结果
				return []*dto.ServiceInfoAndDraftFlag{}, 0, nil
			}
		}

		if req.CategoryNodeId == "uncategory" {
			// 获取CategoryID匹配但CategoryNodeID为空的服务
			serviceCategoryRelations, err := r.serviceCategoryRelationRepo.GetByCategoryIDAndEmptyNodeID(ctx, req.CategoryId)
			if err != nil {
				log.WithContext(ctx).Error("ServiceList GetByCategoryIDAndEmptyNodeID failed", zap.Error(err))
				return nil, 0, err
			}

			serviceIDs := make([]string, 0, len(serviceCategoryRelations))
			for _, relation := range serviceCategoryRelations {
				serviceIDs = append(serviceIDs, relation.ServiceID)
			}

			serviceIDs = r.removeDuplicateServiceIDs(serviceIDs)

			if len(serviceIDs) > 0 {
				tx = tx.Where("service_id IN ?", serviceIDs)
			} else {
				return []*dto.ServiceInfoAndDraftFlag{}, 0, nil
			}
		}

	}

	if req.AuditType != "" {
		tx = tx.Where("audit_type = ?", req.AuditType)
	}

	if req.AuditStatus != "" {
		tx = tx.Where("audit_status = ?", req.AuditStatus)
	}

	if req.StartTime != "" {
		tx = tx.Where("create_time >= ?", req.StartTime)
	}

	if req.EndTime != "" {
		tx = tx.Where("create_time <= ?", req.EndTime)
	}

	if req.ServiceType != "" {
		tx = tx.Where("service_type = ?", req.ServiceType)
	}

	if req.Sort != "" {
		if req.Sort == "name" {
			req.Sort = "service_name"
			tx = tx.Order(fmt.Sprintf(" CONVERT(`service_name` USING gbk) %s", req.Direction))
		} else {
			tx = tx.Order(req.Sort + " " + req.Direction)
		}
	}

	tx.Count(&count)
	if tx.Error != nil {
		log.WithContext(ctx).Error("ServiceList", zap.Error(tx.Error))
		return nil, 0, tx.Error
	}

	var services []*model.ServiceAssociations
	tx = tx.Scopes(Paginate(req.Offset, req.Limit)).
		Preload("ServiceDataSource", "delete_time = 0").
		Find(&services)
	if tx.Error != nil {
		log.WithContext(ctx).Error("ServiceList", zap.Error(tx.Error))
		return nil, 0, tx.Error
	}

	// 添加 nil 检查，确保 services 不为 nil
	if services == nil {
		services = []*model.ServiceAssociations{}
	}

	res = []*dto.ServiceInfoAndDraftFlag{}

	serviceIDs := make([]string, 0, len(services))
	for _, s := range services {
		serviceIDs = append(serviceIDs, s.ServiceID)
	}
	batchCheckDraftServices, err := r.batchCheckDraftServices(ctx, serviceIDs)
	if err != nil {
		log.WithContext(ctx).Error("ServiceList batchCheckDraftServices failed", zap.Error(err))
		return nil, 0, err
	}
	var catalogMaps map[string]*Catalogs
	var catalogDepartmentPaths map[string]string
	var invokeMaps map[string]*Invokes
	if req.MyDepartmentResource {
		catalogs := make([]*Catalogs, 0)
		sql := `SELECT r.resource_id, c.id, c.title AS name, c.apply_num, c.department_id FROM af_data_catalog.t_data_resource r INNER JOIN af_data_catalog.t_data_catalog c ON r.catalog_id = c.id WHERE r.type = 2 AND r.resource_id IN ?`
		if err = r.data.DB.WithContext(ctx).Raw(sql, serviceIDs).Scan(&catalogs).Error; err != nil {
			return nil, 0, err
		}
		catalogMaps = make(map[string]*Catalogs)
		catalogDepartmentPaths = make(map[string]string)
		for _, c := range catalogs {
			catalogMaps[c.ResourceID] = c
			if c.DepartmentID == "" {
				continue
			}
			if _, ok := catalogDepartmentPaths[c.DepartmentID]; ok {
				continue
			}
			departmentInfo, depErr := r.configurationCenterRepo.DepartmentGet(ctx, c.DepartmentID)
			if depErr != nil {
				log.WithContext(ctx).Warn("ServiceList DepartmentGet failed", zap.Error(depErr), zap.String("department_id", c.DepartmentID))
				continue
			}
			catalogDepartmentPaths[c.DepartmentID] = departmentInfo.Path
		}
		invokes := make([]*Invokes, 0)
		sql2 := `SELECT service_id, SUM(success_count) AS invoke_num FROM service_daily_record WHERE service_id IN ? GROUP BY service_id`
		if err = r.data.DB.WithContext(ctx).Raw(sql2, serviceIDs).Scan(&invokes).Error; err != nil {
			return nil, 0, err
		}
		invokeMaps = make(map[string]*Invokes)
		for _, c := range invokes {
			invokeMaps[c.ServiceID] = c
		}

	}

	for _, s := range services {
		exist := batchCheckDraftServices[s.ServiceID]
		if err != nil {
			log.WithContext(ctx).Error("ServiceList", zap.Error(err))
			//continue
			return nil, 0, err
		}
		// 主题域、组织架构改成实时查询，对应服务调不通或数据被删ID不存在时，返回空，不影响接口响应
		if s.SubjectDomainID != "" {
			dataSubjectInfo, err := r.DataSubjectRepo.DataSubjectGet(ctx, s.SubjectDomainID)
			if err != nil {
				s.SubjectDomainName = ""
			} else {
				s.SubjectDomainName = dataSubjectInfo.PathName
			}
		}
		if s.DepartmentID != "" {
			departmentInfo, err := r.configurationCenterRepo.DepartmentGet(ctx, s.DepartmentID)
			if err != nil {
				s.DepartmentName = ""
			} else {
				s.DepartmentName = departmentInfo.Path
			}
		}
		owners := []dto.Owners{}
		if s.OwnerID != "" && s.OwnerName != "" {
			ownerIDs := strings.Split(s.OwnerID, ",")
			ownerNames := strings.Split(s.OwnerName, ",")
			for i := 0; i < len(ownerIDs); i++ {
				if i < len(ownerNames) && strings.TrimSpace(ownerIDs[i]) != "" {
					owners = append(owners, dto.Owners{
						OwnerId:   ownerIDs[i],
						OwnerName: ownerNames[i],
					})
				}
			}
		}
		serviceInfo := &dto.ServiceInfoAndDraftFlag{
			ServiceInfo: dto.ServiceInfo{
				ServiceID:          s.ServiceID,
				ServiceCode:        s.ServiceCode,
				PublishStatus:      s.PublishStatus,
				Status:             s.Status,
				AuditType:          s.AuditType,
				AuditStatus:        s.AuditStatus,
				AuditAdvice:        s.AuditAdvice,
				OnlineAuditAdvice:  s.OnlineAuditAdvice,
				SubjectDomainId:    s.SubjectDomainID,
				SubjectDomainName:  s.SubjectDomainName,
				ServiceType:        s.ServiceType,
				ServiceName:        s.ServiceName,
				Department:         dto.Department{ID: s.DepartmentID, Name: s.DepartmentName},
				SyncFlag:           util.PtrToValue(s.SyncFlag),
				SyncMsg:            util.PtrToValue(s.SyncMsg),
				UpdateFlag:         util.PtrToValue(s.UpdateFlag),
				UpdateMsg:          util.PtrToValue(s.UpdateMsg),
				Owners:             owners,
				ServicePath:        s.ServicePath,
				BackendServiceHost: s.BackendServiceHost,
				BackendServicePath: s.BackendServicePath,
				HTTPMethod:         s.HTTPMethod,
				ReturnType:         s.ReturnType,
				Protocol:           s.Protocol,
				Description:        util.PtrToValue(s.Description),
				Developer:          dto.Developer{ID: s.DeveloperID},
				RateLimiting:       int64(s.RateLimiting),
				Timeout:            int64(s.Timeout),
				PublishTime:        util.TimeFormat(s.PublishTime),
				OnlineTime:         util.TimeFormat(s.OnlineTime),
				CreateTime:         util.TimeFormat(&s.CreateTime),
				UpdateTime:         util.TimeFormat(&s.UpdateTime),
			},
			HasDraft: exist,
		}
		if req.MyDepartmentResource {
			if catalog := catalogMaps[s.ServiceID]; catalog != nil {
				serviceInfo.DataCatalogID = strconv.FormatUint(catalog.ID, 10)
				serviceInfo.DataCatalogName = catalog.Name
				if path := catalogDepartmentPaths[catalog.DepartmentID]; path != "" {
					serviceInfo.CatalogProvider = path
				} else {
					serviceInfo.CatalogProvider = ""
				}
			}
		}
		if req.MyDepartmentResource && invokeMaps[s.ServiceID] != nil {
			serviceInfo.InvokeNum = int(invokeMaps[s.ServiceID].InvokeNum)
		}
		// 联调修改：变更审核中、变更审核未通过的时候，返回的id仍然是已发布版本的id
		if s.PublishStatus == enum.PublishStatusChangeAuditing || s.PublishStatus == enum.PublishStatusChangeReject {
			serviceInfo.ServiceID = s.ChangedServiceId
		}
		res = append(res, serviceInfo)
	}

	return
}

type Catalogs struct {
	ID           uint64 `gorm:"column:id" json:"id"`
	ResourceID   string `gorm:"column:resource_id" json:"resource_id"`
	Name         string `gorm:"column:name"  json:"name"`
	ApplyNum     uint64 `gorm:"column:apply_num" json:"apply_num"`
	DepartmentID string `gorm:"column:department_id" json:"department_id"`
}
type Invokes struct {
	ServiceID string `gorm:"column:service_id" json:"service_id"`
	InvokeNum int64  `gorm:"column:invoke_num" json:"invoke_num"`
}

// 批量查询草稿状态
func (r *serviceRepo) batchCheckDraftServices(ctx context.Context, serviceIDs []string) (map[string]bool, error) {
	if len(serviceIDs) == 0 {
		return make(map[string]bool), nil
	}

	var draftServices []*model.Service
	err := r.data.DB.WithContext(ctx).Scopes(Undeleted()).
		Model(&model.Service{}).
		Select("changed_service_id").
		Where("changed_service_id IN ? AND is_changed = ?", serviceIDs, "1").
		Find(&draftServices).Error

	if err != nil {
		return nil, err
	}

	draftMap := make(map[string]bool)
	for _, draft := range draftServices {
		draftMap[draft.ChangedServiceId] = true
	}

	return draftMap, nil
}

// collectCategoryNodeIDs 递归遍历树形结构，收集指定节点及其所有子节点的category_node_id
func (r *serviceRepo) collectCategoryNodeIDs(treeNode []*microservice.CategoryTreeSummaryInfo, targetNodeID string) []string {
	var categoryNodeIDs []string

	// 递归遍历函数
	var traverse func(nodes []*microservice.CategoryTreeSummaryInfo)
	traverse = func(nodes []*microservice.CategoryTreeSummaryInfo) {
		for _, node := range nodes {
			// 如果找到目标节点，收集该节点及其所有子节点
			if node.CategoryNodeID == targetNodeID {
				categoryNodeIDs = append(categoryNodeIDs, node.CategoryNodeID)
				// 递归收集所有子节点
				if len(node.Children) > 0 {
					collectAllChildren(node.Children, &categoryNodeIDs)
				}
				return
			}
			// 继续遍历子节点
			if len(node.Children) > 0 {
				traverse(node.Children)
			}
		}
	}

	traverse(treeNode)
	return categoryNodeIDs
}

// collectAllChildren 递归收集所有子节点的category_node_id
func collectAllChildren(nodes []*microservice.CategoryTreeSummaryInfo, categoryNodeIDs *[]string) {
	for _, node := range nodes {
		*categoryNodeIDs = append(*categoryNodeIDs, node.CategoryNodeID)
		if len(node.Children) > 0 {
			collectAllChildren(node.Children, categoryNodeIDs)
		}
	}
}

// removeDuplicateServiceIDs 对serviceIDs进行去重
func (r *serviceRepo) removeDuplicateServiceIDs(serviceIDs []string) []string {
	if len(serviceIDs) == 0 {
		return serviceIDs
	}

	// 使用map进行去重
	seen := make(map[string]bool)
	result := make([]string, 0, len(serviceIDs))

	for _, id := range serviceIDs {
		if !seen[id] {
			seen[id] = true
			result = append(result, id)
		}
	}

	return result
}

// GetServiceIdByChangedId 查找changed_service_id == service_id的数据的service_id，方便复用Service详情方法查询Vn+1版本数据
func (r *serviceRepo) GetServiceIdByChangedId(ctx context.Context, serviceID string) (serviceId string, err error) {
	var Service model.Service
	tx := r.data.DB.WithContext(ctx).Scopes(Undeleted()).
		Model(&model.Service{}).
		Where(&model.Service{ChangedServiceId: serviceID}).
		Find(&Service)
	if tx.Error != nil {
		log.Error("GetServiceIdByChangedId Query Service", zap.Error(tx.Error))
		return "", tx.Error
	}
	return Service.ServiceID, nil
}

func (r *serviceRepo) ServiceGet(ctx context.Context, serviceID string) (res *dto.ServiceGetRes, err error) {
	exist, err := r.IsServiceIDExist(ctx, serviceID)
	if err != nil {
		log.WithContext(ctx).Error("ServiceGet", zap.Error(err))
		return nil, err
	}

	if !exist {
		log.WithContext(ctx).Error("ServiceGet", zap.Error(errorcode.Desc(errorcode.ServiceIDNotExist)))
		return nil, errorcode.Desc(errorcode.ServiceIDNotExist)
	}

	var s = &model.ServiceAssociations{}
	tx := r.data.DB.WithContext(ctx).Model(&model.Service{}).Scopes(Undeleted()).
		Preload("Developer", "delete_time = 0").
		Preload("File", "delete_time = 0").
		Preload("ServiceDataSource", "delete_time = 0").
		Preload("ServiceParams", "delete_time = 0").
		Preload("ServiceResponseFilters", "delete_time = 0").
		Preload("ServiceScriptModel", "delete_time = 0").
		Preload("ServiceStatsInfo").
		Where(&model.Service{ServiceID: serviceID}).
		Find(&s)

	if tx.Error != nil {
		log.WithContext(ctx).Error("ServiceGet", zap.Error(tx.Error))
		return nil, err
	}

	var gateway = &model.ServiceGateway{}
	tx = r.data.DB.WithContext(ctx).Model(&model.ServiceGateway{}).Find(gateway)
	if tx.Error != nil {
		log.WithContext(ctx).Error("ServiceGet", zap.Error(tx.Error))
		return nil, err
	}

	// 主题域、组织架构改成实时查询，对应服务调不通或数据被删ID不存在时，返回空，不影响接口响应
	if s.SubjectDomainID != "" {
		dataSubjectInfo, err := r.DataSubjectRepo.DataSubjectGet(ctx, s.SubjectDomainID)
		if err != nil {
			s.SubjectDomainName = ""
		} else {
			s.SubjectDomainName = dataSubjectInfo.PathName
		}
	}
	if s.DepartmentID != "" {
		departmentInfo, err := r.configurationCenterRepo.DepartmentGet(ctx, s.DepartmentID)
		if err != nil {
			s.DepartmentName = ""
		} else {
			s.DepartmentName = departmentInfo.Path
		}
	}
	owners := []dto.Owners{}
	if s.OwnerID != "" && s.OwnerName != "" {
		ownerIDs := strings.Split(s.OwnerID, ",")
		ownerNames := strings.Split(s.OwnerName, ",")
		for i := range ownerIDs {
			if i < len(ownerNames) && strings.TrimSpace(ownerIDs[i]) != "" {
				owners = append(owners, dto.Owners{
					OwnerId:   ownerIDs[i],
					OwnerName: ownerNames[i],
				})
			}
		}
	}
	// 获取信息系统
	var infoSystemName string
	if s.InfoSystemID != nil && *s.InfoSystemID != "" {
		infoSystem, err := r.configurationCenterRepo.GetInfoSystem(ctx, *s.InfoSystemID)
		if err != nil {
			infoSystemName = ""
		} else {
			infoSystemName = infoSystem.Name
		}
	}

	// 如果s.DeveloperID不为空，获取开发商信息
	var developer dto.Developer
	if s.DeveloperID != "" {
		firms, err := r.configurationCenterRepo.FirmList(ctx)
		if err != nil {
			log.WithContext(ctx).Error("ServiceGet", zap.Error(err))
		} else {
			for _, firm := range firms.Entries {
				if firm.ID == s.DeveloperID {
					developer = dto.Developer{
						ID:   s.DeveloperID,
						Name: firm.Name,
					}
					break
				}
			}
		}
	}

	var appsName string
	if s.AppsID != nil && *s.AppsID != "" {
		apps, err := r.configurationCenterDriven.GetApplication(ctx, *s.AppsID)
		if err != nil {
			appsName = ""
		} else {
			appsName = apps.Name
		}
	}

	// 装配类目信息
	categoryInfo, err := r.assembleCategoryInfo(ctx, serviceID)
	if err != nil {
		return nil, err
	}

	res = &dto.ServiceGetRes{
		ServiceInfo: dto.ServiceInfo{
			ServiceID:          s.ServiceID,
			ServiceCode:        s.ServiceCode,
			ApplyNum:           s.ServiceStatsInfo.ApplyNum,
			PreviewNum:         s.ServiceStatsInfo.PreviewNum,
			Status:             s.Status,
			PublishStatus:      s.PublishStatus,
			AuditType:          s.AuditType,
			AuditStatus:        s.AuditStatus,
			AuditAdvice:        s.AuditAdvice,
			OnlineAuditAdvice:  s.OnlineAuditAdvice,
			SubjectDomainId:    s.SubjectDomainID,
			SubjectDomainName:  s.SubjectDomainName,
			ServiceType:        s.ServiceType,
			ServiceName:        s.ServiceName,
			Department:         dto.Department{ID: s.DepartmentID, Name: s.DepartmentName},
			InfoSystemId:       util.PtrToValue(s.InfoSystemID),
			InfoSystemName:     infoSystemName,
			AppsId:             util.PtrToValue(s.AppsID),
			AppsName:           appsName,
			PaasID:             util.PtrToValue(s.PaasID),
			PrePath:            util.PtrToValue(s.PrePath),
			SyncFlag:           util.PtrToValue(s.SyncFlag),
			SyncMsg:            util.PtrToValue(s.SyncMsg),
			UpdateFlag:         util.PtrToValue(s.UpdateFlag),
			UpdateMsg:          util.PtrToValue(s.UpdateMsg),
			SourceType:         s.SourceType,
			CategoryInfo:       categoryInfo,
			Owners:             owners,
			GatewayUrl:         gateway.GatewayURL,
			ServicePath:        s.ServicePath,
			BackendServiceHost: s.BackendServiceHost,
			BackendServicePath: s.BackendServicePath,
			HTTPMethod:         s.HTTPMethod,
			ReturnType:         s.ReturnType,
			Protocol:           s.Protocol,
			File: dto.File{
				FileID:   s.File.FileID,
				FileName: s.File.FileName,
			},
			Description: util.PtrToValue(s.Description),
			Developer:   developer,
			// Developer: dto.Developer{
			// 	ID:            s.DeveloperID,
			// 	Name:          s.Developer.DeveloperName,
			// 	ContactPerson: s.Developer.ContactPerson,
			// 	ContactInfo:   s.Developer.ContactInfo,
			// },
			RateLimiting: int64(s.RateLimiting),
			Timeout:      int64(s.Timeout),
			PublishTime:  util.TimeFormat(s.PublishTime),
			OnlineTime:   util.TimeFormat(s.OnlineTime),
			CreateTime:   util.TimeFormat(&s.CreateTime),
			UpdateTime:   util.TimeFormat(&s.UpdateTime),
			CreatedBy:    s.CreatedBy,
			UpdateBy:     s.UpdateBy,
		},
		ServiceTest: dto.ServiceTest{
			RequestExample:  util.PointerToString(s.ServiceScriptModel.RequestExample),
			ResponseExample: util.PointerToString(s.ServiceScriptModel.ResponseExample),
		},
		CategoryInfo: categoryInfo,
	}

	if s.ServiceType == "service_generate" {
		res.ServiceParam = dto.ServiceParamRead{
			CreateModel:             s.CreateModel,
			DatasourceId:            s.ServiceDataSource.DataSourceID,
			DatasourceName:          s.ServiceDataSource.DataSourceName,
			DataViewId:              s.ServiceDataSource.DataViewID,
			DataViewName:            s.ServiceDataSource.DataViewName,
			Script:                  util.PointerToString(s.ServiceScriptModel.Script),
			DataTableRequestParams:  nil,
			DataTableResponseParams: nil,
		}

		res.ServiceResponse = &dto.ServiceResponse{
			Page:     s.ServiceScriptModel.Page,
			PageSize: int64(s.ServiceScriptModel.PageSize),
		}

		res.ServiceResponse.Rules = make([]dto.Rule, 0)
		for _, filter := range s.ServiceResponseFilters {
			if filter.Param != "" {
				res.ServiceResponse.Rules = append(res.ServiceResponse.Rules, dto.Rule{
					Operator: filter.Operator,
					Param:    filter.Param,
					Value:    filter.Value,
				})
			}
		}
	}

	res.ServiceParam.DataTableRequestParams = make([]dto.DataTableRequestParam, 0)
	res.ServiceParam.DataTableResponseParams = make([]dto.DataTableResponseParam, 0)
	for _, p := range s.ServiceParams {
		requestParam := dto.DataTableRequestParam{
			CNName:       p.CnName,
			EnName:       p.EnName,
			DataType:     p.DataType,
			Required:     p.Required,
			Operator:     p.Operator,
			DefaultValue: p.DefaultValue,
			Description:  p.Description,
		}
		if p.ParamType == "request" {
			res.ServiceParam.DataTableRequestParams = append(res.ServiceParam.DataTableRequestParams, requestParam)
		}

		responseParam := dto.DataTableResponseParam{
			CNName:      p.CnName,
			EnName:      p.EnName,
			DataType:    p.DataType,
			Description: p.Description,
			Sort:        p.Sort,
			Masking:     p.Masking,
			Sequence:    int64(p.Sequence),
		}
		if p.ParamType == "response" {
			res.ServiceParam.DataTableResponseParams = append(res.ServiceParam.DataTableResponseParams, responseParam)
		}
	}

	return
}

// assembleCategoryInfo 装配类目与类目树信息
func (r *serviceRepo) assembleCategoryInfo(ctx context.Context, serviceID string) ([]dto.CategoryInfo, error) {
	categoryInfo := []dto.CategoryInfo{}

	// 通过serviceCategoryRelationRepo获取类目关系
	serviceCategoryRelations, err := r.serviceCategoryRelationRepo.GetByServiceID(ctx, serviceID)
	if err != nil {
		return nil, err
	}

	// 通过DataCatalogRepo获取类目树详细信息并装配
	if len(serviceCategoryRelations) > 0 {
		for _, relation := range serviceCategoryRelations {
			// 获取类目详细信息
			categoryInfo = append(categoryInfo, dto.CategoryInfo{
				CategoryId:       relation.CategoryID,
				CategoryName:     "",
				CategoryNodeID:   relation.CategoryNodeID,
				CategoryNodeName: "",
			})
		}

		mapCategoryName := make(map[string]string)
		mapCategoryNodeName := make(map[string]string)
		//对categoryInfo按CategoryId去重
		uniqueCategoryInfo := uniqueCategoryInfo(categoryInfo)

		for _, category := range uniqueCategoryInfo {
			categoryTree, err := r.dataCatalogRepo.CategoryTreeGet(ctx, category.CategoryId)
			if err != nil {
				continue // 如果获取失败则跳过该条记录
			} else {
				mapCategoryName[category.CategoryId] = categoryTree.Name
				if len(categoryTree.TreeNode) > 0 {
					// 递归遍历整个树结构来获取所有节点的名称
					r.traverseCategoryTreeNodes(categoryTree.TreeNode, mapCategoryNodeName)
				}
			}
		}
		// 使用mapCategoryName与mapCategoryNodeName，完善categoryInfo中name属性
		for i := range categoryInfo {
			if categoryName, exists := mapCategoryName[categoryInfo[i].CategoryId]; exists {
				categoryInfo[i].CategoryName = categoryName
			}
			if categoryNodeName, exists := mapCategoryNodeName[categoryInfo[i].CategoryNodeID]; exists {
				categoryInfo[i].CategoryNodeName = categoryNodeName
			}
		}
	}

	return categoryInfo, nil
}

// traverseCategoryTreeNodes 递归遍历类目树节点，收集所有节点的ID和名称映射
func (r *serviceRepo) traverseCategoryTreeNodes(nodes []*microservice.CategoryTreeSummaryInfo, mapCategoryNodeName map[string]string) {
	for _, node := range nodes {
		mapCategoryNodeName[node.CategoryNodeID] = node.Name
		// 递归遍历子节点
		if len(node.Children) > 0 {
			r.traverseCategoryTreeNodes(node.Children, mapCategoryNodeName)
		}
	}
}

// ServiceGetName implements ServiceRepo.
func (r *serviceRepo) ServiceGetName(ctx context.Context, serviceID string) (serviceName string, err error) {
	var record = model.Service{ServiceID: serviceID}
	tx := r.data.DB.WithContext(ctx)
	tx = tx.Scopes(Undeleted())
	tx = tx.Where(&record)
	tx = tx.Select("service_name")
	tx = tx.Take(&record)
	if tx.Error != nil {
		return "", tx.Error
	}
	return record.ServiceName, nil
}
func (r *serviceRepo) UpdateAuthedUsers(ctx context.Context, id string, users []string) error {
	return r.data.DB.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Where("service_id=?", id).Delete(&model.ServiceAuthedUser{}).Error; err != nil {
			return err
		}
		users = lo.Uniq(users)
		objs := lo.Times(len(users), func(index int) *model.ServiceAuthedUser {
			return &model.ServiceAuthedUser{
				ID:        uuid.NewString(),
				ServiceID: id,
				UserID:    users[index],
			}
		})
		return tx.Create(objs).Error
	})
}

func (r *serviceRepo) RemoveAuthedUsers(ctx context.Context, id string, userID string) error {
	err := r.data.DB.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		//1. 不传，删除全部访问者
		if userID == "" {
			return tx.Where("service_id=?", id).Delete(&model.ServiceAuthedUser{}).Error
		}
		//2. 传，删除指定的访问者
		return tx.Where("service_id=? and user_id=?", id, userID).Delete(&model.ServiceAuthedUser{}).Error
	})
	return err
}

func (r *serviceRepo) UserCanAuthService(ctx context.Context, userID string, serviceID string) (can bool, err error) {
	total := int64(0)
	err = r.data.DB.WithContext(ctx).Model(new(model.ServiceAuthedUser)).Where("user_id=? and service_id=?", userID, serviceID).Count(&total).Error
	return total > 0, err
}

// UserAuthedServices 查询用户是否是授权用户
func (r *serviceRepo) UserAuthedServices(ctx context.Context, userID string, serviceID ...string) (ds []*model.ServiceAuthedUser, err error) {
	err = r.data.DB.WithContext(ctx).Where("user_id=? and service_id in ? ", userID, serviceID).Find(&ds).Error
	return ds, err
}

// GetSubServices 查询子服务
func (r *serviceRepo) GetSubServices(ctx context.Context, serviceID ...string) (sd map[string]*model.SubService, err error) {
	ds := make([]*model.SubService, 0)
	err = r.data.DB.WithContext(ctx).Where("service_id in ? ", serviceID).Find(&ds).Error
	if err != nil {
		return nil, err
	}
	return lo.SliceToMap(ds, func(item *model.SubService) (string, *model.SubService) {
		return item.ID.String(), item
	}), nil
}

// GetSubService 查询子服务
func (r *serviceRepo) GetSubService(ctx context.Context, subServiceID string) (data *model.SubService, err error) {
	err = r.data.DB.WithContext(ctx).Where("id = ? ", subServiceID).First(&data).Error
	return data, err
}
func (r *serviceRepo) ServiceGetFields(ctx context.Context, serviceID string, fields []string) (service *model.Service, err error) {
	service = &model.Service{}
	tx := r.data.DB.WithContext(ctx).Scopes(Undeleted()).
		Model(&model.Service{}).
		Select(fields).
		Where(&model.Service{ServiceID: serviceID}).
		Find(service)

	return service, tx.Error
}

func (r *serviceRepo) ServicesGetByDataViewId(ctx context.Context, dataViewId string) (res []*model.Service, err error) {
	serviceIDs := []string{}
	err = r.data.DB.WithContext(ctx).Model(&model.ServiceDataSource{}).Scopes(Undeleted()).
		Where(&model.ServiceDataSource{DataViewID: dataViewId}).
		Pluck("service_id", &serviceIDs).Error

	if err != nil {
		log.WithContext(ctx).Error("serviceRepo ServicesGetByDataViewId", zap.Error(err))
		return nil, err
	}

	err = r.data.DB.WithContext(ctx).Model(&model.Service{}).Scopes(Undeleted()).
		Where("service_id in ?", serviceIDs).
		Where("publish_status = ?", enum.PublishStatusPublished).
		Find(&res).Error

	if err != nil {
		log.WithContext(ctx).Error("serviceRepo ServicesGetByDataViewId", zap.Error(err))
		return nil, err
	}

	return res, nil
}
func (r *serviceRepo) ServicesDataViewID(ctx context.Context, serviceID string) (dataViewIds []string, err error) {
	err = r.data.DB.WithContext(ctx).Model(&model.ServiceDataSource{}).Scopes(Undeleted()).
		Where(&model.ServiceDataSource{ServiceID: serviceID}).
		Pluck("data_view_id", &dataViewIds).Error
	if err != nil {
		log.WithContext(ctx).Error("serviceRepo ServicesDataViewID", zap.Error(err))
		return nil, err
	}
	return dataViewIds, nil
}

func (r *serviceRepo) ServiceUpdate(ctx context.Context, req *dto.ServiceUpdateReqOrTemp, isCheckStatus bool) (err error) {
	exist, err := r.IsServiceIDExist(ctx, req.ServiceID)
	if err != nil {
		log.WithContext(ctx).Error("ServiceUpdate", zap.Error(err))
		return err
	}

	if !exist {
		log.WithContext(ctx).Error("ServiceUpdate", zap.Error(errorcode.Desc(errorcode.ServiceIDNotExist)))
		return errorcode.Desc(errorcode.ServiceIDNotExist)
	}
	if isCheckStatus {
		//检查接口名称唯一性
		exist, err = r.IsServiceNameExist(ctx, req.ServiceInfo.ServiceName, req.ServiceID)
		if err != nil {
			log.WithContext(ctx).Error("ServiceUpdate", zap.Error(err))
			return err
		}
		if exist {
			log.WithContext(ctx).Error("ServiceUpdate", zap.Error(errorcode.Desc(errorcode.ServiceNameExist)))
			return errorcode.Desc(errorcode.ServiceNameExist)
		}

		//检查接口路径唯一性
		exist, err = r.IsServicePathExist(ctx, req.ServiceInfo.ServicePath, req.ServiceID)
		if err != nil {
			log.WithContext(ctx).Error("ServiceUpdate", zap.Error(err))
			return err
		}
		if exist {
			log.WithContext(ctx).Error("ServiceUpdate", zap.Error(errorcode.Desc(errorcode.ServicePathExist)))
			return errorcode.Desc(errorcode.ServicePathExist)
		}
	}

	//检查接口状态 只有处于[草稿]状态的接口 才能编辑
	service := &model.Service{}
	tx := r.data.DB.WithContext(ctx).
		Model(&model.Service{}).
		Select([]string{"service_type", "publish_status", "audit_type", "audit_status"}).
		Where(&model.Service{ServiceID: req.ServiceID}).
		Find(service)
	if tx.Error != nil {
		log.WithContext(ctx).Error("ServiceUpdateStatusCheck", zap.Error(err))
		return err
	}
	/*_, ok := enum.ServiceAllowedUpdateStatus[service.PublishStatus+service.AuditType+service.AuditStatus]
	if !ok {
		log.WithContext(ctx).Error("ServiceAllowedUpdateStatus", zap.Error(errorcode.Desc(errorcode.ServiceUpdateStatusCheck)))
		return errorcode.Desc(errorcode.ServiceUpdateStatusCheck)
	}*/
	//方法复用
	if isCheckStatus {
		if !(service.PublishStatus == enum.PublishStatusUnPublished || service.PublishStatus == enum.PublishStatusPubReject) {
			log.WithContext(ctx).Error("ServiceAllowedUpdateStatus", zap.Error(errorcode.Desc(errorcode.ServiceUpdateStatusCheck)))
			return errorcode.Desc(errorcode.ServiceUpdateStatusCheck)
		}
	}
	if service.ServiceType != req.ServiceInfo.ServiceType {
		log.WithContext(ctx).Error("ServiceUpdate", zap.Error(errorcode.Desc(errorcode.ServiceUpdateServiceTypeCheck)))
		return errorcode.Desc(errorcode.ServiceUpdateServiceTypeCheck)
	}

	//检查数据 owner 名称
	ownerIDs := make([]string, 0, len(req.ServiceInfo.Owners))
	ownerNames := make([]string, 0, len(req.ServiceInfo.Owners))
	// 对Owners进行去重
	uniqueOwners := make([]dto.Owners, 0, len(req.ServiceInfo.Owners))
	seen := make(map[string]bool)
	for _, owner := range req.ServiceInfo.Owners {
		if !seen[owner.OwnerId] {
			seen[owner.OwnerId] = true
			uniqueOwners = append(uniqueOwners, owner)
		}
	}
	req.ServiceInfo.Owners = uniqueOwners
	// 数据owner
	for index, owner := range req.ServiceInfo.Owners {
		if owner.OwnerId != "" {
			userInfo, err := r.userManagementRepo.GetUserById(ctx, owner.OwnerId)
			if ee := new(microservice.UserNotFoundError); errors.As(err, &ee) {
				return errorcode.Detail(errorcode.ServiceOwnerNotFound, ee)
			} else if err != nil {
				return err
			}
			req.ServiceInfo.Owners[index].OwnerName = userInfo.Name
			ownerIDs = append(ownerIDs, owner.OwnerId)
			ownerNames = append(ownerNames, userInfo.Name)
		}
	}
	req.ServiceInfo.OwnerId = strings.Join(ownerIDs, ",")
	req.ServiceInfo.OwnerName = strings.Join(ownerNames, ",")

	//检查部门id
	var departmentName string
	if req.ServiceInfo.Department.ID != "" {
		departmentGet, err := r.configurationCenterRepo.DepartmentGet(ctx, req.ServiceInfo.Department.ID)
		if err != nil {
			return errorcode.Desc(errorcode.DepartmentIdNotExist)
		}

		departmentName = departmentGet.Path
	}

	//检查主题域id
	if req.ServiceInfo.SubjectDomainId != "" {
		dataSubjectGet, err := r.DataSubjectRepo.DataSubjectGet(ctx, req.ServiceInfo.SubjectDomainId)
		if err != nil {
			return errorcode.Desc(errorcode.SubjectDomainIdNotExist)
		}
		//根据传入的subjectDomainID查Path，其Path只能有两级或者三级（只能绑定L2或者L3）
		if !(len(strings.Split(dataSubjectGet.PathId, "/")) == 2 || len(strings.Split(dataSubjectGet.PathId, "/")) == 3) {
			return errorcode.Desc(errorcode.SubjectDomainIdNotL3)
		}
	}

	//检查信息系统id
	var infoSystemIdPtr *string
	prePath := settings.Instance.Callback.PrePath
	// if prePath != "" {
	// 	if req.ServiceInfo.InfoSystemId != "" {
	// 		_, err := r.configurationCenterRepo.GetInfoSystem(ctx, req.ServiceInfo.InfoSystemId)
	// 		if err != nil {
	// 			return errorcode.Desc(errorcode.InfoSystemIdNotExist)
	// 		}
	// 		infoSystemIdPtr = &req.ServiceInfo.InfoSystemId
	// 	} else {
	// 		return errorcode.Desc(errorcode.InfoSystemIdNotExist)
	// 	}
	// }

	//检查应用id
	var appsIdPtr *string
	if prePath != "" {
		if req.ServiceInfo.AppsId != "" {
			appInfo, err := r.configurationCenterDriven.GetApplication(ctx, req.ServiceInfo.AppsId)
			if err != nil {
				return errorcode.Desc(errorcode.AppsIdNotExist)
			}
			appsIdPtr = &req.ServiceInfo.AppsId
			if appInfo.PassID != "" {
				req.ServiceInfo.PrePath = prePath
				req.ServiceInfo.PaasID = appInfo.PassID
			}
		}
		// else {
		// 	return errorcode.Desc(errorcode.AppsIdNotExist)
		// }
	}

	//检查数据视图id
	var dataViewGetRes = &microservice.DataViewGetRes{}
	if req.ServiceParam.DataViewId != "" && req.ServiceInfo.ServiceType == "service_generate" {
		dataViewGetRes, err = r.dataViewRepo.DataViewGet(ctx, req.ServiceParam.DataViewId)
		if err != nil {
			return errorcode.Desc(errorcode.DataViewIdNotExist)
		}
		if dataViewGetRes.LastPublishTime == 0 {
			return errorcode.Desc(errorcode.DataViewIdNotPublish)
		}
	}

	//检查数据源id
	var datasourceResRes = &microservice.DatasourceResRes{}
	if dataViewGetRes.DatasourceID != "" && req.ServiceInfo.ServiceType == "service_generate" {
		datasourceResRes, err = r.configurationCenterRepo.DatasourceGet(ctx, dataViewGetRes.DatasourceID)
		if err != nil {
			return errorcode.Desc(errorcode.DatasourceIdNotExist)
		}
	}

	//更新人
	userId := util.GetUser(ctx).Id

	err = r.data.DB.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		s := map[string]interface{}{
			"service_name":      req.ServiceInfo.ServiceName,
			"service_path":      req.ServiceInfo.ServicePath,
			"department_id":     req.ServiceInfo.Department.ID,
			"department_name":   departmentName,
			"info_system_id":    infoSystemIdPtr,
			"apps_id":           appsIdPtr,
			"paas_id":           req.ServiceInfo.PaasID,
			"pre_path":          req.ServiceInfo.PrePath,
			"owner_id":          req.ServiceInfo.OwnerId,
			"owner_name":        req.ServiceInfo.OwnerName,
			"subject_domain_id": req.ServiceInfo.SubjectDomainId,
			"create_model":      req.ServiceParam.CreateModel,
			"http_method":       req.ServiceInfo.HTTPMethod,
			"return_type":       "json",
			"protocol":          "http",
			"description":       req.ServiceInfo.Description,
			"developer_id":      req.ServiceInfo.Developer.ID,
			"developer_name":    req.ServiceInfo.Developer.Name,
			"rate_limiting":     uint32(req.ServiceInfo.RateLimiting),
			"publish_status":    req.ServiceInfo.PublishStatus, //更新或者编辑暂存时，维护下发布状态，该状态重新赋值过，无安全问题
			"audit_type":        req.ServiceInfo.AuditType,
			"is_changed":        req.ServiceInfo.IsChanged,
			"update_by":         userId,
		}

		if req.ServiceInfo.Timeout != 0 {
			s["timeout"] = uint32(req.ServiceInfo.Timeout)
		}

		if req.ServiceInfo.ServiceType == "service_register" {
			s["backend_service_host"] = req.ServiceInfo.BackendServiceHost
			s["backend_service_path"] = req.ServiceInfo.BackendServicePath
			s["file_id"] = req.ServiceInfo.File.FileID
		}

		//更新主表
		tx = r.data.DB.WithContext(ctx).Model(&model.Service{}).
			Where(&model.Service{ServiceID: req.ServiceID}).
			Updates(s)
		if tx.Error != nil {
			log.WithContext(ctx).Error("ServiceUpdate", zap.Error(tx.Error))
			return tx.Error
		}

		//只有接口生成模式 有数据源配置
		if req.ServiceInfo.ServiceType == "service_generate" {
			//更新 serviceDataSource 一对一
			catalogName, schemaName := r.dataViewRepo.ParseViewSourceCatalogName(dataViewGetRes.ViewSourceCatalogName)
			serviceDataSource := map[string]interface{}{
				"data_source_id":   req.ServiceParam.DatasourceId,
				"data_source_name": datasourceResRes.Name,
				"data_view_id":     req.ServiceParam.DataViewId,
				"data_view_name":   dataViewGetRes.BusinessName,
				"catalog_name":     catalogName,
				"data_schema_name": schemaName,
				"data_table_name":  dataViewGetRes.TechnicalName,
			}

			tx = r.data.DB.WithContext(ctx).Model(&model.ServiceDataSource{}).
				Where(&model.Service{ServiceID: req.ServiceID}).
				Updates(serviceDataSource)
			if tx.Error != nil {
				log.WithContext(ctx).Error("ServiceUpdate", zap.Error(tx.Error))
				return tx.Error
			}
		}

		//更新 ServiceScriptModel 一对一
		serviceScriptModel := map[string]interface{}{}

		//示例数据长度不能超过 TEXT 类型的最大长度 65535 字节
		if len(req.ServiceTest.RequestExample) < 65535 {
			serviceScriptModel["request_example"] = req.ServiceTest.RequestExample
		}
		if len(req.ServiceTest.ResponseExample) < 65535 {
			serviceScriptModel["response_example"] = req.ServiceTest.ResponseExample
		}

		if req.ServiceInfo.ServiceType == "service_generate" {
			serviceScriptModel["script"] = req.ServiceParam.Script
			serviceScriptModel["page"] = req.ServiceResponse.Page
			serviceScriptModel["page_size"] = uint32(req.ServiceResponse.PageSize)
		}
		tx = r.data.DB.WithContext(ctx).Model(&model.ServiceScriptModel{}).
			Where(&model.Service{ServiceID: req.ServiceID}).
			Updates(serviceScriptModel)
		if tx.Error != nil {
			log.WithContext(ctx).Error("ServiceUpdate", zap.Error(tx.Error))
			return tx.Error
		}

		//更新 []ServiceParam 一对多
		var ServiceParams []*model.ServiceParam
		for _, p := range req.ServiceParam.DataTableRequestParams {
			m := &model.ServiceParam{
				ServiceID:    req.ServiceID,
				ParamType:    "request",
				CnName:       p.CNName,
				EnName:       p.EnName,
				Description:  p.Description,
				DataType:     p.DataType,
				Required:     p.Required,
				DefaultValue: p.DefaultValue,
			}
			if req.ServiceInfo.ServiceType == "service_generate" {
				m.Operator = p.Operator
			}
			ServiceParams = append(ServiceParams, m)
		}
		if req.ServiceInfo.ServiceType == "service_generate" {
			for _, p := range req.ServiceParam.DataTableResponseParams {
				m := &model.ServiceParam{
					ServiceID:   req.ServiceID,
					ParamType:   "response",
					CnName:      p.CNName,
					EnName:      p.EnName,
					Description: p.Description,
					DataType:    p.DataType,
					Sequence:    uint32(p.Sequence),
					Sort:        p.Sort,
					Masking:     p.Masking,
				}
				ServiceParams = append(ServiceParams, m)
			}
		}

		tx = r.data.DB.WithContext(ctx).Model(&model.ServiceParam{}).
			Where(&model.ServiceParam{ServiceID: req.ServiceID}).
			Delete(&model.ServiceParam{})
		if tx.Error != nil {
			log.WithContext(ctx).Error("ServiceUpdate", zap.Error(tx.Error))
			return tx.Error
		}

		if len(ServiceParams) > 0 {
			tx = r.data.DB.WithContext(ctx).Model(&model.ServiceParam{}).Create(ServiceParams)
			if tx.Error != nil {
				log.WithContext(ctx).Error("ServiceUpdate", zap.Error(tx.Error))
				return tx.Error
			}
		}

		//更新 []ServiceResponseFilter 一对多
		if req.ServiceInfo.ServiceType == "service_generate" {
			tx = r.data.DB.WithContext(ctx).Model(&model.ServiceResponseFilter{}).
				Where(&model.ServiceResponseFilter{ServiceID: req.ServiceID}).
				Delete(&model.ServiceResponseFilter{})
			if tx.Error != nil {
				log.WithContext(ctx).Error("ServiceUpdate", zap.Error(tx.Error))
				return tx.Error
			}
			if len(req.ServiceResponse.Rules) > 0 {
				var ServiceResponseFilters []*model.ServiceResponseFilter
				for _, filter := range req.ServiceResponse.Rules {
					// 参数字段为空的视为无效数据
					if filter.Param != "" {
						ServiceResponseFilters = append(ServiceResponseFilters, &model.ServiceResponseFilter{
							ServiceID: req.ServiceID,
							Param:     filter.Param,
							Operator:  filter.Operator,
							Value:     filter.Value,
						})
					}
				}

				// 处理有效数据
				if len(ServiceResponseFilters) > 0 {
					tx = r.data.DB.WithContext(ctx).Model(&model.ServiceResponseFilter{}).Create(ServiceResponseFilters)
					if tx.Error != nil {
						log.WithContext(ctx).Error("ServiceUpdate", zap.Error(tx.Error))
						return tx.Error
					}
				}
			}
		}

		return nil
	})

	if err != nil {
		log.WithContext(ctx).Error("ServiceUpdate", zap.Error(err))
		return err
	}
	//更新、更新暂存时，索引入队，后续审核通过后，会有消费逻辑再更新索引，草稿状态不更新索引
	if isCheckStatus {
		esService := &model.Service{ServiceID: req.ServiceID}
		err := r.ServiceESIndexCreate(ctx, esService)
		if err != nil {
			log.Info("ServiceUpdate  --> 索引入队失败，ServiceId："+service.ServiceID, zap.Error(err))
			return err
		}
	}
	/*	if err = r.PushCatalogMessage(ctx, service.ServiceID, "create"); err != nil { //更新、更新暂存
		return err
	}*/

	// 实时同步service_daily_record的部门信息（包括历史数据）
	go func() {
		// 同步该service的所有历史记录部门信息
		if syncErr := r.serviceDailyRecordRepo.SyncSingleServiceHistoryDepartmentInfo(context.Background(), req.ServiceID); syncErr != nil {
			log.Error("ServiceUpdate 同步service_daily_record历史部门信息失败",
				zap.String("serviceID", req.ServiceID),
				zap.String("departmentID", req.ServiceInfo.Department.ID),
				zap.String("departmentName", departmentName),
				zap.Error(syncErr))
		}
	}()

	//更新类目信息
	if req.ServiceInfo.CategoryInfo != nil {
		req.CategoryInfo = req.ServiceInfo.CategoryInfo
	}
	if len(req.CategoryInfo) > 0 {
		// 验证新类目信息
		for _, category := range req.CategoryInfo {
			if category.CategoryId == "" {
				return errorcode.Desc(errorcode.PublicInvalidParameter) // 类目ID为空
			}
			// 调用 dataCatalogRepo.CategoryTreeGet 方法检查该类目是否存在
			_, err := r.dataCatalogRepo.CategoryTreeGet(ctx, category.CategoryId)
			if err != nil {
				return errorcode.Desc(errorcode.CategoryIdNotExist) // 类目不存在
			}
		}

		// 获取现有类目关系
		existingRelations, err := r.serviceCategoryRelationRepo.GetByServiceID(ctx, req.ServiceID)
		if err != nil {
			log.WithContext(ctx).Error("ServiceUpdate 获取现有类目关系失败", zap.Error(err))
			return err
		}

		// 构建新类目关系映射
		newRelationMap := make(map[string]bool)
		for _, category := range req.CategoryInfo {
			key := category.CategoryNodeID + "_" + req.ServiceID
			newRelationMap[key] = true
		}

		// 构建旧类目关系映射
		oldRelationMap := make(map[string]bool)
		for _, relation := range existingRelations {
			key := relation.CategoryNodeID + "_" + relation.ServiceID
			oldRelationMap[key] = true
		}

		// 找出需要新增的关系
		relationsToCreate := make([]*model.ServiceCategoryRelation, 0)
		for _, category := range req.CategoryInfo {
			key := category.CategoryNodeID + "_" + req.ServiceID
			if !oldRelationMap[key] {
				relationsToCreate = append(relationsToCreate, &model.ServiceCategoryRelation{
					ServiceID:      req.ServiceID,
					CategoryID:     category.CategoryId,
					CategoryNodeID: category.CategoryNodeID,
				})
			}
		}

		// 找出需要删除的关系
		relationsToDelete := make([]int64, 0)
		for _, relation := range existingRelations {
			key := relation.CategoryNodeID + "_" + relation.ServiceID
			if !newRelationMap[key] {
				relationsToDelete = append(relationsToDelete, relation.ID)
			}
		}

		// 批量创建新关系
		if len(relationsToCreate) > 0 {
			if err := r.serviceCategoryRelationRepo.BatchCreate(ctx, relationsToCreate); err != nil {
				log.WithContext(ctx).Error("ServiceUpdate 批量创建类目关系失败", zap.Error(err))
				return err
			}
		}

		// 批量删除旧关系
		if len(relationsToDelete) > 0 {
			if err := r.serviceCategoryRelationRepo.BatchDelete(ctx, relationsToDelete); err != nil {
				log.WithContext(ctx).Error("ServiceUpdate 批量删除类目关系失败", zap.Error(err))
				return err
			}
		}
	}

	return nil
}

func (r *serviceRepo) ServiceDelete(ctx context.Context, serviceID string) (err error) {
	serviceCheck, err := r.ServiceGetFields(ctx, serviceID, []string{"publish_status", "is_changed"})
	if err != nil {
		return err
	}
	if serviceCheck.PublishStatus == enum.PublishStatusPublished && serviceCheck.IsChanged == "1" {
		//List返回的是变更前已发布的版本的ID，先兑换成变更审核不通过或变更审核中的ID
		sid, err := r.GetIdByPublishedId(ctx, serviceID)
		if err != nil {
			return err
		}
		//如果是变更审核不通过，修改ID
		changeService, err := r.ServiceGetFields(ctx, sid, []string{"publish_status"})
		if err != nil {
			return err
		}
		if changeService.PublishStatus == enum.PublishStatusChangeReject {
			serviceID = sid
		}

	}
	exist, err := r.IsServiceIDExist(ctx, serviceID)
	if err != nil {
		log.WithContext(ctx).Error("ServiceDelete", zap.Error(err))
		return err
	}

	if !exist {
		log.WithContext(ctx).Error("ServiceDelete", zap.Error(errorcode.Desc(errorcode.ServiceIDNotExist)))
		return errorcode.Desc(errorcode.ServiceIDNotExist)
	}

	var service = &model.Service{}
	tx := r.data.DB.WithContext(ctx).
		Model(&model.Service{}).
		Select([]string{"service_id", "publish_status", "audit_type", "status"}).
		Where("service_id = ?", serviceID).
		Find(&service)

	if tx.Error != nil {
		log.WithContext(ctx).Error("ServiceDelete", zap.Error(tx.Error))
		return tx.Error
	}

	_, ok := enum.ServiceAllowedDeleteStatus[service.PublishStatus+service.AuditStatus]
	if !ok {
		log.WithContext(ctx).Error("ServiceAllowedDeleteStatus", zap.Error(errorcode.Desc(errorcode.ServiceDeleteStatusError)))
		return errorcode.Desc(errorcode.ServiceDeleteStatusError)
	}

	err = r.data.DB.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		t := r.data.DB.WithContext(ctx).
			Model(&model.Service{}).Scopes(Undeleted()).
			Where(&model.Service{ServiceID: serviceID}).
			Update("delete_time", time.Now().UnixMilli())
		if t.Error != nil {
			log.WithContext(ctx).Error("ServiceDelete", zap.Error(t.Error))
			return t.Error
		}

		t = r.data.DB.WithContext(ctx).
			Model(&model.ServiceDataSource{}).Scopes(Undeleted()).
			Where(&model.ServiceDataSource{ServiceID: serviceID}).
			Update("delete_time", time.Now().UnixMilli())
		if t.Error != nil {
			log.WithContext(ctx).Error("ServiceDelete", zap.Error(t.Error))
			return t.Error
		}

		t = r.data.DB.WithContext(ctx).
			Model(&model.ServiceParam{}).Scopes(Undeleted()).
			Where(&model.ServiceParam{ServiceID: serviceID}).
			Update("delete_time", time.Now().UnixMilli())
		if t.Error != nil {
			log.WithContext(ctx).Error("ServiceDelete", zap.Error(t.Error))
			return t.Error
		}

		t = r.data.DB.WithContext(ctx).
			Model(&model.ServiceResponseFilter{}).Scopes(Undeleted()).
			Where(&model.ServiceResponseFilter{ServiceID: serviceID}).
			Update("delete_time", time.Now().UnixMilli())
		if t.Error != nil {
			log.WithContext(ctx).Error("ServiceDelete", zap.Error(t.Error))
			return t.Error
		}

		t = r.data.DB.WithContext(ctx).
			Model(&model.ServiceScriptModel{}).Scopes(Undeleted()).
			Where(&model.ServiceScriptModel{ServiceID: serviceID}).
			Update("delete_time", time.Now().UnixMilli())
		if t.Error != nil {
			log.WithContext(ctx).Error("ServiceDelete", zap.Error(t.Error))
			return t.Error
		}
		//删除索引
		errDeleteIndex := r.ServiceESIndexDelete(context.Background(), service)
		if errDeleteIndex != nil {
			log.WithContext(ctx).Error("ServiceDelete --> 删除索引失败，数据库事务回滚：", zap.Error(t.Error))
			return errDeleteIndex
		}

		return nil
	})

	if err != nil {
		log.WithContext(ctx).Error("ServiceDelete", zap.Error(err))
		return err
	}

	return nil
}

func (r *serviceRepo) IsServiceNameExist(ctx context.Context, serviceName, serviceID string) (exist bool, err error) {
	if serviceName == "" {
		return false, nil
	}
	var count int64
	tx := r.data.DB.WithContext(ctx).Model(&model.Service{}).Scopes(Undeleted()).Where(&model.Service{ServiceName: serviceName})

	if serviceID != "" {
		tx = tx.Where("service_id != ?", serviceID)
	}
	var DraftService model.Service
	t := r.data.DB.WithContext(ctx).Scopes(Undeleted()).
		Model(&model.Service{}).
		Where("changed_service_id = ?", serviceID).
		Find(&DraftService)
	if t.Error != nil {
		return false, t.Error
	}
	//当前有草稿，允许草稿和其Vn版本重名
	if DraftService.ServiceID != "" {
		tx = tx.Where("service_id != ?", DraftService.ServiceID)
	}

	tx.Count(&count)
	if tx.Error != nil {
		log.WithContext(ctx).Error("IsServiceNameExist", zap.Error(tx.Error))
		return false, tx.Error
	}

	if count > 0 {
		return true, nil
	}

	return false, nil
}

func (r *serviceRepo) IsServicePathExist(ctx context.Context, servicePath, serviceID string) (exist bool, err error) {
	if servicePath == "" {
		return false, nil
	}
	var count int64
	tx := r.data.DB.WithContext(ctx).Model(&model.Service{}).Scopes(Undeleted()).Where(&model.Service{ServicePath: servicePath})

	if serviceID != "" {
		tx = tx.Where("service_id != ?", serviceID)
	}

	var DraftService model.Service
	t := r.data.DB.WithContext(ctx).Scopes(Undeleted()).
		Model(&model.Service{}).
		Where("changed_service_id = ?", serviceID).
		Find(&DraftService)
	if t.Error != nil {
		return false, t.Error
	}
	//当前有草稿，允许草稿和其Vn版本重名
	if DraftService.ServiceID != "" {
		tx = tx.Where("service_id != ?", DraftService.ServiceID)
	}

	tx.Count(&count)
	if tx.Error != nil {
		log.WithContext(ctx).Error("IsServicePathExist", zap.Error(tx.Error))
		return false, tx.Error
	}

	if count > 0 {
		return true, nil
	}

	return false, nil
}

func (r *serviceRepo) IsServiceIDExist(ctx context.Context, serviceID string) (exist bool, err error) {
	if serviceID == "" {
		return false, nil
	}

	var count int64
	tx := r.data.DB.WithContext(ctx).Model(&model.Service{}).Scopes(Undeleted()).Where(&model.Service{ServiceID: serviceID}).Count(&count)
	if tx.Error != nil {
		log.WithContext(ctx).Error("IsServiceIDExist", zap.Error(tx.Error))
		return false, tx.Error
	}

	if count > 0 {
		return true, nil
	}

	return false, nil
}

func (r *serviceRepo) IsServiceIDStatusExist(ctx context.Context, serviceID, status string) (exist bool, err error) {
	if serviceID == "" {
		return false, nil
	}

	var count int64
	tx := r.data.DB.WithContext(ctx).
		Model(&model.Service{}).
		Scopes(Undeleted()).
		Where(&model.Service{ServiceID: serviceID, Status: status}).
		Count(&count)
	if tx.Error != nil {
		log.WithContext(ctx).Error("IsServiceIDStatusExist", zap.Error(tx.Error))
		return false, tx.Error
	}

	if count > 0 {
		return true, nil
	}

	return false, nil
}

func (r *serviceRepo) IsServiceIDInStatusesExist(ctx context.Context, serviceID string, statuses []string) (exist bool, err error) {
	if serviceID == "" {
		return false, nil
	}

	var count int64
	tx := r.data.DB.WithContext(ctx).
		Model(&model.Service{}).
		Scopes(Undeleted()).
		Where(&model.Service{ServiceID: serviceID}).
		Where("status IN ?", statuses).
		Count(&count)
	if tx.Error != nil {
		log.WithContext(ctx).Error("IsServiceIDInStatusesExist", zap.Error(tx.Error))
		return false, tx.Error
	}

	return count > 0, nil
}

func (r *serviceRepo) IsServiceIDPublishStatusExist(ctx context.Context, serviceID, publishStatus string) (exist bool, err error) {
	if serviceID == "" {
		return false, nil
	}

	var count int64
	tx := r.data.DB.WithContext(ctx).
		Model(&model.Service{}).
		Scopes(Undeleted()).
		Where(&model.Service{ServiceID: serviceID, PublishStatus: publishStatus}).
		Count(&count)
	if tx.Error != nil {
		log.WithContext(ctx).Error("IsServiceIDPublishStatusExist", zap.Error(tx.Error))
		return false, tx.Error
	}

	if count > 0 {
		return true, nil
	}

	return false, nil
}

func (r *serviceRepo) ServiceIsComplete(ctx context.Context, serviceID string) (complete bool, err error) {
	//需要关联主题域或部门
	//service := &model.Service{}
	//tx := r.data.DB.WithContext(ctx).
	//	Model(&model.Service{}).
	//	Where(&model.Service{ServiceID: serviceID}).
	//	Find(service)
	//if tx.Error != nil {
	//	log.WithContext(ctx).Error("ServiceIsComplete", zap.Error(tx.Error))
	//	return false, tx.Error
	//}
	//
	//if service.DepartmentID == "" && service.SubjectDomainID == "" {
	//	return false, nil
	//}

	//需要完成接口测试，得到请求示例
	serviceScriptModel := &model.ServiceScriptModel{}
	tx := r.data.DB.WithContext(ctx).
		Model(&model.ServiceScriptModel{}).
		Select("request_example").
		Where(&model.ServiceScriptModel{ServiceID: serviceID}).
		Find(serviceScriptModel)

	if tx.Error != nil {
		log.WithContext(ctx).Error("ServiceIsComplete", zap.Error(tx.Error))
		return false, tx.Error
	}

	if serviceScriptModel.RequestExample == nil {
		return false, nil
	}

	if *serviceScriptModel.RequestExample == "" {
		return false, nil
	}

	return true, nil
}

func (r *serviceRepo) ServiceESIndex(ctx context.Context, service *model.Service, indexType string) (err error) {
	var message = dto.ServiceESMessage{}
	switch indexType {
	case "delete":
		message = dto.ServiceESMessage{
			Type: indexType,
			Body: dto.ServiceESMessageBody{
				Docid: service.ServiceID,
			},
		}
	case "create", "update":
		var s = &model.Service{}
		tx := r.data.DB.WithContext(ctx).Model(&model.Service{}).Scopes(Undeleted()).
			Where(&model.Service{ServiceID: service.ServiceID}).
			Find(&s)
		if tx.Error != nil {
			log.WithContext(ctx).Error("serviceRepo ServiceESIndex", zap.Error(tx.Error))
			return tx.Error
		}

		OnlineAt := int64(0)
		if s.OnlineTime != nil {
			OnlineAt = s.OnlineTime.UnixMilli()
		}

		PublishAt := int64(0)
		if s.PublishTime != nil {
			PublishAt = s.PublishTime.UnixMilli()
		}

		Description := ""
		if s.Description != nil {
			Description = util.PtrToValue(s.Description)
		}

		// 接口返回值的字段列表
		var responseParams []model.ServiceParam
		if tx := r.data.DB.WithContext(ctx).Scopes(Undeleted()).
			Where(&model.ServiceParam{ServiceID: service.ServiceID, ParamType: "response"}).
			Find(&responseParams); tx.Error != nil {
			log.WithContext(ctx).Error("serviceRepo ServiceESIndex", zap.Error(tx.Error))
			return tx.Error
		}

		// 接口返回值的参数列表，只需要对中文名称和英文名称创建索引
		var fields []dto.Field
		for _, p := range responseParams {
			fields = append(fields, dto.Field{FieldNameZH: p.CnName, FieldNameEN: p.EnName})
		}

		//当前类目信息先搬主题域和组织架构
		var CateInfos []dto.CateInfo

		// 接口服务所属部门的名称
		var orgName string
		// model.Service.DepartmentName 是所属部门的完整路径，所以取其最后一级作为所属部门的名称
		if s.DepartmentID != "" {
			orgName = path.Base(s.DepartmentName)
			CateInfos = append(CateInfos, dto.CateInfo{CateId: enum.OrgCateId, NodeId: s.DepartmentID, NodeName: orgName, NodePath: s.DepartmentName})
		}

		if s.SubjectDomainID != "" {
			// 主题域的名称
			// model.Service.SubjectDomainName 是所属主题域的完整路径，所以需要取其最后一级作为主题域的名称
			// var name string = path.Base(service.SubjectDomainName)
			// 主题域的名称路径
			// var path string = service.SubjectDomainName
			// model.Service.SubjectDomainName 不会再数据库中保存，一些场景下输
			// 入参数的 ServiceDomainName 也为空，所以再获取一次主题域
			// if name == "" {
			dataSubjectGet, err := r.DataSubjectRepo.DataSubjectGet(ctx, s.SubjectDomainID)
			if err != nil {
				return errorcode.Desc(errorcode.SubjectDomainIdNotExist)
			}
			//只能绑定L2或者L3
			if !(len(strings.Split(dataSubjectGet.PathId, "/")) == 2 || len(strings.Split(dataSubjectGet.PathId, "/")) == 3) {
				return errorcode.Desc(errorcode.SubjectDomainIdNotL3)
			}
			name, path := dataSubjectGet.Name, dataSubjectGet.PathName
			// }
			CateInfos = append(CateInfos, dto.CateInfo{CateId: enum.SubjectDomainCateId, NodeId: s.SubjectDomainID, NodeName: name, NodePath: path})
		}

		// 获取信息系统
		if s.InfoSystemID != nil && *s.InfoSystemID != "" {
			infoSystem, err := r.configurationCenterRepo.GetInfoSystem(ctx, *s.InfoSystemID)
			if err != nil {
				log.WithContext(ctx).Error("serviceRepo ServiceESIndex:获取信息系统失败", zap.Error(err))
			} else {
				CateInfos = append(CateInfos, dto.CateInfo{CateId: enum.InfoSystemCateId, NodeId: *s.InfoSystemID, NodeName: infoSystem.Name})
			}
		}

		categoryInfo, err := r.assembleCategoryInfo(ctx, s.ServiceID)
		if err != nil {
			return err
		}

		//如果categoryInfo不为空，则将categoryInfo添加到CateInfos中
		if len(categoryInfo) > 0 {
			for _, cateInfo := range categoryInfo {
				CateInfos = append(CateInfos, dto.CateInfo{CateId: cateInfo.CategoryId, NodeId: cateInfo.CategoryNodeID, NodeName: cateInfo.CategoryNodeName, NodePath: ""})
			}
		}

		message = dto.ServiceESMessage{
			Type: indexType,
			Body: dto.ServiceESMessageBody{
				Docid:       service.ServiceID,
				Id:          service.ServiceID,
				Code:        s.ServiceCode,
				Name:        s.ServiceName,
				Description: Description,
				UpdatedAt:   s.UpdateTime.UnixMilli(),
				OnlineAt:    OnlineAt,
				//Orgcode:               s.DepartmentID,
				//Orgname:               orgName,
				//OrgnamePath:           s.DepartmentName,
				DataOwnerId:   s.OwnerID,
				DataOwnerName: s.OwnerName,
				CateInfo:      CateInfos,
				//SubjectDomainId:       s.SubjectDomainID,
				//SubjectDomainName:     subjectDomainName,
				//SubjectDomainNamePath: s.SubjectDomainName,
				Fields:        fields,
				IsPublish:     enum.IsConsideredAsPublished(s.PublishStatus),
				ISOnline:      enum.IsConsideredAsOnline(s.Status),
				PublishedAt:   PublishAt,
				PublishStatus: s.PublishStatus,
				OnlineStatus:  s.Status,
				APIType:       s.ServiceType,
			},
		}
	}
	msg, err := json.Marshal(message)
	if err != nil {
		return err
	}

	log.Info("serviceRepo ServiceESIndex", zap.Any("msg", json.RawMessage(msg)))
	err = r.mq.KafkaClient.Pub("af.interface-svc.es-index", msg)
	if err != nil {
		log.WithContext(ctx).Error("ServiceESIndex KafkaClient.Pub Error, Service ID : "+service.ServiceID, zap.Error(err))
		return err
	}

	return nil
}

func (r *serviceRepo) AuditProcessInstanceCreate(ctx context.Context, serviceID string, audit *model.Service) (err error) {
	service := &model.Service{}
	tx := r.data.DB.WithContext(ctx).Model(&model.Service{}).
		Select([]string{"service_id", "service_code", "service_name", "changed_service_id"}).
		Where(&model.Service{ServiceID: serviceID}).Find(service)
	if tx.Error != nil {
		log.WithContext(ctx).Error("AuditProcessInstanceCreate", zap.Error(tx.Error))
		return tx.Error
	}

	err = r.data.DB.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		tx.Model(&model.Service{}).Where(&model.Service{ServiceID: serviceID}).Updates(audit)
		if tx.Error != nil {
			log.WithContext(ctx).Error("AuditProcessInstanceCreate", zap.Error(tx.Error))
			return tx.Error
		}

		audit.ServiceID = service.ServiceID
		audit.ServiceCode = service.ServiceCode
		audit.ServiceName = service.ServiceName

		//需审核的流程发送到 workflow
		if audit.AuditStatus == enum.AuditStatusAuditing {
			return r.ProduceWorkflowAuditApply(ctx, audit)
		}

		return nil
	})
	// 不需审核，直接通过，更新状态后也要发送消息更新ES索引
	if audit.AuditStatus == enum.AuditStatusPass {
		if audit.AuditType == enum.AuditTypeChange {
			err = r.HandleChangeAuditPass(ctx, audit.ApplyID)
			if err = r.ServiceESIndexCreate(ctx, &model.Service{ServiceID: service.ChangedServiceId}); err != nil {
				return err
			}
			if err = r.PushCatalogMessage(context.Background(), service.ChangedServiceId, "update"); err != nil { //update AuditInstance
				return err
			}
		} else {
			if err = r.PushCatalogMessage(context.Background(), service.ServiceID, "create"); err != nil { //Create AuditInstance
				return err
			}
			if err = r.ServiceESIndexCreate(ctx, service); err != nil {
				return err
			}
		}
	}

	return nil
}

func (r *serviceRepo) HandleChangeAuditPass(ctx context.Context, applyId string) error {
	var service model.Service
	t := r.data.DB.Model(service).Scopes(Undeleted()).
		Select([]string{"id", "service_id", "changed_service_id", "is_changed"}).
		Where(&model.Service{ApplyID: applyId}).
		Find(&service)
	//变更审核通过的时候：
	//删掉Vn版本
	err := r.ServiceDelete(ctx, service.ChangedServiceId)
	if err != nil {
		log.Error("handleChangeAuditPass Update Error ", zap.Any("applyId", fmt.Sprintf("%#v", applyId)))
		return err
	}

	//把Vn+1版本的ServiceID更新为Vn版本的ServiceID，以适配其他授权等业务
	Vn1ServiceId := service.ServiceID
	Vn1ChangeServiceID := service.ChangedServiceId
	service.ServiceID = service.ChangedServiceId
	service.ChangedServiceId = "NULL"
	t = r.data.DB.Model(service).
		Where(&model.Service{ID: service.ID}).
		Updates(service)
	//把请求与响应表的ServiceID更新为Vn版本的ServiceID
	t = r.data.DB.WithContext(ctx).
		Model(&model.ServiceDataSource{}).
		Where(&model.ServiceDataSource{ServiceID: Vn1ServiceId}).
		Update("service_id", Vn1ChangeServiceID)
	if t.Error != nil {
		log.Error("ServiceUpdate", zap.Error(t.Error))
		return t.Error
	}

	t = r.data.DB.WithContext(ctx).
		Model(&model.ServiceParam{}).
		Where(&model.ServiceParam{ServiceID: Vn1ServiceId}).
		Update("service_id", Vn1ChangeServiceID)
	if t.Error != nil {
		log.Error("ServiceUpdate", zap.Error(t.Error))
		return t.Error
	}

	t = r.data.DB.WithContext(ctx).
		Model(&model.ServiceResponseFilter{}).
		Where(&model.ServiceResponseFilter{ServiceID: Vn1ServiceId}).
		Update("service_id", Vn1ChangeServiceID)
	if t.Error != nil {
		log.Error("ServiceUpdate", zap.Error(t.Error))
		return t.Error
	}

	t = r.data.DB.WithContext(ctx).
		Model(&model.ServiceScriptModel{}).
		Where(&model.ServiceScriptModel{ServiceID: Vn1ServiceId}).
		Update("service_id", Vn1ChangeServiceID)
	if t.Error != nil {
		log.Error("handleChangeAuditPass Update Error ", zap.Any("applyId", fmt.Sprintf("%#v", applyId)))
		return t.Error
	}
	return nil
}

func (r *serviceRepo) ProduceWorkflowAuditApply(ctx context.Context, audit *model.Service) (err error) {
	user := util.GetUser(ctx)
	t := time.Now()
	msg := &common.AuditApplyMsg{
		Process: common.AuditApplyProcessInfo{
			AuditType:  audit.AuditType,
			ApplyID:    audit.ApplyID,
			UserID:     user.Id,
			UserName:   user.Name,
			ProcDefKey: audit.ProcDefKey,
		},
		Data: map[string]any{
			"service_id":     audit.ServiceID,
			"service_code":   audit.ServiceCode,
			"service_name":   audit.ServiceName,
			"submitter_id":   user.Id,
			"submitter_name": user.Name,
			"submit_time":    util.TimeFormat(&t),
		},
		Workflow: common.AuditApplyWorkflowInfo{
			TopCsf: 5,
			AbstractInfo: common.AuditApplyAbstractInfo{
				Icon: enum.AuditIconBase64,
				Text: "接口名称：" + audit.ServiceName,
			},
			Webhooks: []common.Webhook{
				{
					Webhook:     settings.Instance.Services.DataApplicationService + "/api/data-application-service/internal/v1/service/" + audit.ServiceID + "/auditors",
					StrategyTag: enum.OwnerAuditStrategyTag,
				},
			},
		},
	}

	err = r.wf.AuditApply(msg)
	if err != nil {
		log.WithContext(ctx).Error("ProduceWorkflowAuditApply", zap.Error(err), zap.Any("msg", msg))
		return err
	}
	log.Info("producer workflow msg", zap.String("topic", mq.TopicWorkflowAuditApply), zap.Any("msg", msg))
	return nil
}

func (r *serviceRepo) RequestApplyCancel(ctx context.Context, serviceID string) (err error) {
	applyIds := []string{}
	tx := r.data.DB.Model(&model.ServiceApply{}).
		Select("apply_id").
		Where(&model.ServiceApply{ServiceID: serviceID, AuditStatus: enum.AuditStatusAuditing}).
		Pluck("apply_id", &applyIds)

	if tx.Error != nil {
		log.WithContext(ctx).Error("serviceRepo RequestApplyCancel", zap.Error(tx.Error))
		return tx.Error
	}

	if len(applyIds) == 0 {
		return
	}

	// 发送撤销申请
	err = r.ProduceWorkflowAuditCancel(ctx, applyIds)
	if err != nil {
		return err
	}

	tx = r.data.DB.Model(&model.ServiceApply{}).
		Where("apply_id in ?", applyIds).
		Update("audit_status", enum.AuditStatusReject)

	if tx.Error != nil {
		log.WithContext(ctx).Error("serviceRepo RequestApplyCancel", zap.Error(tx.Error))
	}

	return nil
}

func (r *serviceRepo) ProduceWorkflowAuditCancel(ctx context.Context, applyIds []string) (err error) {
	if len(applyIds) == 0 {
		return
	}

	msg := &common.AuditCancelMsg{}
	msg.ApplyIDs = applyIds
	msg.Cause.ZHCN = "接口已下线"
	msg.Cause.ZHTW = "接口已下线"
	msg.Cause.ENUS = "The service is offline"
	err = r.wf.AuditCancel(msg)
	if err != nil {
		log.WithContext(ctx).Error("serviceRepo ProduceWorkflowAuditCancel", zap.Error(err), zap.Any("msg", msg))
		return err
	}
	log.Info("producer workflow msg", zap.String("topic", mq.TopicWorkflowAuditCancel), zap.Any("msg", msg))
	return nil
}

func (r *serviceRepo) IsExistAuditing(ctx context.Context, serviceID string) (exist bool, err error) {
	var count int64
	where := &model.Service{
		ServiceID:   serviceID,
		AuditStatus: enum.AuditStatusAuditing,
	}

	tx := r.data.DB.WithContext(ctx).
		Model(&model.Service{}).
		Where(where).
		Count(&count)

	if tx.Error != nil {
		log.WithContext(ctx).Error("IsExistAuditing", zap.Error(tx.Error))
		return false, tx.Error
	}

	if count > 0 {
		return true, nil
	}

	return false, nil
}

func (r *serviceRepo) GetSubjectDomainIdsByUserId(ctx context.Context, userId string) (subjectDomainIds []string, err error) {
	tx := r.data.DB.WithContext(ctx).Model(&model.Service{}).Scopes(Undeleted()).
		Where(&model.Service{OwnerID: userId}).
		Pluck("subject_domain_id", &subjectDomainIds)

	if tx.Error != nil {
		log.WithContext(ctx).Error("GetSubjectDomainIdsByUserId", zap.Error(tx.Error))
		return nil, tx.Error
	}

	return
}

func (r *serviceRepo) ConsumerWorkflowAuditResultPublish(ctx context.Context, result *common.AuditResultMsg) error { // 发布审核结果
	log.Info("consumer workflow audit result msg", zap.String("audit_type", enum.AuditTypePublish), zap.Any("msg", fmt.Sprintf("%#v", result)))
	return r.consumerWorkflowAuditResult(enum.AuditTypePublish, result)
}

func (r *serviceRepo) ConsumerWorkflowAuditResultChange(_ context.Context, result *common.AuditResultMsg) error { // 变更审核结果
	log.Info("consumer workflow audit result msg", zap.String("audit_type", enum.AuditTypeChange), zap.Any("msg", fmt.Sprintf("%#v", result)))
	return r.consumerWorkflowAuditResult(enum.AuditTypeChange, result)
}

func (r *serviceRepo) ConsumerWorkflowAuditResultOffline(_ context.Context, result *common.AuditResultMsg) error { //下线审核结果
	log.Info("consumer workflow audit result msg", zap.String("audit_type", enum.AuditTypeOffline), zap.Any("msg", fmt.Sprintf("%#v", result)))
	return r.consumerWorkflowAuditResult(enum.AuditTypeOffline, result)
}

func (r *serviceRepo) ConsumerWorkflowAuditResultOnline(_ context.Context, result *common.AuditResultMsg) error { //上线审核结果
	log.Info("consumer workflow audit result msg", zap.String("audit_type", enum.AuditTypeOnline), zap.Any("msg", fmt.Sprintf("%#v", result)))
	return r.consumerWorkflowAuditResult(enum.AuditTypeOnline, result)
}

func (r *serviceRepo) consumerWorkflowAuditResult(auditType string, result *common.AuditResultMsg) error {
	t := time.Now()
	service := &model.Service{
		UpdateTime: t,
	}
	log.Info("consumerWorkflowAuditResult", zap.Any("result", result))
	switch result.Result {
	case enum.AuditStatusPass: //审核通过
		service.AuditStatus = enum.AuditStatusPass // 更新审核状态
		switch auditType {
		//发布审核的结果
		case enum.AuditTypePublish:
			service.PublishStatus = enum.PublishStatusPublished
			service.PublishTime = &t // 更新发布时间
		//变更审核的结果
		case enum.AuditTypeChange:
			service.PublishStatus = enum.PublishStatusPublished
			service.UpdateTime = time.Now()
		//上线审核的结果
		case enum.AuditTypeOnline:
			service.Status = enum.LineStatusOnLine
			service.UpdateTime = time.Now()
			service.OnlineTime = &t
		//下线审核的结果
		case enum.AuditTypeOffline:
			service.Status = enum.LineStatusOffLine
			service.UpdateTime = time.Now()
		}
	case enum.AuditStatusReject: // 审核拒绝，结果为reject
		service.AuditStatus = enum.AuditStatusReject
		switch auditType {
		//发布审核的结果
		case enum.AuditTypePublish:
			service.PublishStatus = enum.PublishStatusPubReject
			service.UpdateTime = time.Now()
		//变更审核的结果
		case enum.AuditTypeChange:
			service.PublishStatus = enum.PublishStatusChangeReject
			service.UpdateTime = time.Now()
		//上线审核的结果
		case enum.AuditTypeOnline:
			service.Status = enum.LineStatusUpReject
			service.UpdateTime = time.Now()
		//下线审核的结果
		case enum.AuditTypeOffline:
			service.Status = enum.LineStatusDownReject
			service.UpdateTime = time.Now()
		}
	case enum.AuditStatusUndone:
		service.AuditStatus = enum.AuditStatusUndone
		switch auditType {
		//发布审核的结果
		case enum.AuditTypePublish:
			service.PublishStatus = enum.PublishStatusUnPublished
			service.UpdateTime = time.Now()
		//变更审核的结果
		case enum.AuditTypeChange:
			service.PublishStatus = enum.PublishStatusPublished
			service.UpdateTime = time.Now()
		//上线审核的结果
		case enum.AuditTypeOnline:
			service.Status = enum.LineStatusNotLine
			service.UpdateTime = time.Now()
		//下线审核的结果
		case enum.AuditTypeOffline:
			service.Status = enum.LineStatusOnLine
			service.UpdateTime = time.Now()
		}
	}

	// 查询旧状态用于埋点
	var oldService model.Service
	tx := r.data.DB.Scopes(Undeleted()).
		Select([]string{"service_id", "status"}).
		Where(&model.Service{ApplyID: result.ApplyID}).
		First(&oldService)
	if tx.Error != nil {
		log.Error("consumerWorkflowAuditResult get old status", zap.Error(tx.Error))
		// 不影响主流程，继续执行
	}
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	err := r.data.DB.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		// 使用事务内的 tx 进行所有操作
		t := tx.Model(service).
			Where(&model.Service{ApplyID: result.ApplyID}).
			Updates(service)
		if t.Error != nil {
			log.Error("serviceRepo consumerWorkflowAuditResult Update", zap.Any("msg", fmt.Sprintf("%#v", result)))
			return tx.Error
		}

		// 在事务内查询
		t = tx.Model(service).Scopes(Undeleted()).
			Select([]string{"id", "service_id", "changed_service_id", "is_changed"}).
			Where(&model.Service{ApplyID: result.ApplyID}).
			Find(&service)
		if t.Error != nil {
			log.Error("serviceRepo consumerWorkflowAuditResult Update", zap.Any("msg", fmt.Sprintf("%#v", result)))
			return tx.Error
		}
		log.Info("r.data.DB.Transaction", zap.Any("service", service))

		if auditType == enum.AuditTypeChange && result.Result == enum.AuditStatusPass {
			//变更审核通过的时候：
			//删掉Vn版本
			err := r.ServiceDelete(context.Background(), service.ChangedServiceId)
			if err != nil {
				log.Error("serviceRepo consumerWorkflowAuditResult Update", zap.Any("msg", fmt.Sprintf("%#v", result)))
				return err
			}
			//把Vn+1版本的ServiceID更新为Vn版本的ServiceID，以适配其他授权等业务
			Vn1ServiceId := service.ServiceID
			Vn1ChangeServiceID := service.ChangedServiceId
			service.ServiceID = service.ChangedServiceId
			service.ChangedServiceId = "NULL"
			t := tx.Model(service).
				Where(&model.Service{ID: service.ID}).
				Updates(service)
			//把请求与响应表的ServiceID更新为Vn版本的ServiceID
			// 使用事务内的 tx 而不是 r.data.DB
			t = tx.Model(&model.ServiceDataSource{}).
				Where(&model.ServiceDataSource{ServiceID: Vn1ServiceId}).
				Update("service_id", Vn1ChangeServiceID)
			if t.Error != nil {
				log.Error("ServiceUpdate", zap.Error(t.Error))
				return t.Error
			}

			t = tx.Model(&model.ServiceParam{}).
				Where(&model.ServiceParam{ServiceID: Vn1ServiceId}).
				Update("service_id", Vn1ChangeServiceID)
			if t.Error != nil {
				log.Error("ServiceUpdate", zap.Error(t.Error))
				return t.Error
			}

			t = tx.Model(&model.ServiceResponseFilter{}).
				Where(&model.ServiceResponseFilter{ServiceID: Vn1ServiceId}).
				Update("service_id", Vn1ChangeServiceID)
			if t.Error != nil {
				log.Error("ServiceUpdate", zap.Error(t.Error))
				return t.Error
			}

			t = tx.Model(&model.ServiceScriptModel{}).
				Where(&model.ServiceScriptModel{ServiceID: Vn1ServiceId}).
				Update("service_id", Vn1ChangeServiceID)
			if t.Error != nil {
				log.Error("serviceRepo consumerWorkflowAuditResult Update", zap.Any("msg", fmt.Sprintf("%#v", result)))
				return tx.Error
			}

			// 先删除vn1ChangeServiceID版本类目信息
			t = tx.Model(&model.ServiceCategoryRelation{}).
				Where(&model.ServiceCategoryRelation{ServiceID: Vn1ChangeServiceID}).
				Delete(&model.ServiceCategoryRelation{})
			if t.Error != nil {
				log.Error("serviceRepo consumerWorkflowAuditResult Update", zap.Any("msg", fmt.Sprintf("%#v", result)))
				return tx.Error
			}
			// 更新类目信息
			t = tx.Model(&model.ServiceCategoryRelation{}).
				Where(&model.ServiceCategoryRelation{ServiceID: Vn1ServiceId}).
				Update("service_id", Vn1ChangeServiceID)
			if t.Error != nil {
				log.Error("serviceRepo consumerWorkflowAuditResult Update", zap.Any("msg", fmt.Sprintf("%#v", result)))
				return tx.Error
			}

		}

		//如果上线、下线审核时，送去审核的数据is_changed == 1，说明是对变更审核中或变更审核未通过的数据上下线了，送去审核的是已发布版本
		//此时需要把变更审核中或变更审核未通过数据的上下线状态也同步一下
		if (auditType == enum.AuditTypeOnline || auditType == enum.AuditTypeOffline) && service.IsChanged == "1" {
			var ServiceIdV2 model.Service
			t = tx.Model(&model.Service{}).Scopes(Undeleted()).
				Select([]string{"service_id"}).
				Where(&model.Service{ChangedServiceId: service.ServiceID}).
				Where("is_changed != ?", "1").
				Where("publish_status in ?", []string{"change-auditing", "change-reject"}).
				Find(&ServiceIdV2)
			if t.Error != nil || len(ServiceIdV2.ServiceID) == 0 {
				log.Error("serviceRepo consumerWorkflowAuditResult --> 查询变更审核中或变更审核未通过版本（Vn+1版本）的数据失败，已发布版本ServiceId为："+service.ServiceID, zap.Any("msg", fmt.Sprintf("%#v", result)))
				return tx.Error
			}
			serviceV2 := &model.Service{
				UpdateTime: time.Now(),
			}
			switch auditType {
			case enum.AuditTypeOnline:
				switch result.Result {
				case enum.AuditStatusPass:
					serviceV2.Status = enum.LineStatusOnLine
				case enum.AuditStatusReject:
					serviceV2.Status = enum.LineStatusUpReject
				case enum.AuditStatusUndone:
					serviceV2.Status = enum.LineStatusNotLine

				}
			case enum.AuditTypeOffline:
				switch result.Result {
				case enum.AuditStatusPass:
					serviceV2.Status = enum.LineStatusOffLine
				case enum.AuditStatusReject:
					serviceV2.Status = enum.LineStatusDownReject
				case enum.AuditStatusUndone:
					serviceV2.Status = enum.LineStatusOnLine

				}
			}
			t := tx.Model(serviceV2).
				Where(&model.Service{ServiceID: ServiceIdV2.ServiceID}).
				Updates(serviceV2)
			if t.Error != nil {
				log.Error("serviceRepo consumerWorkflowAuditResult --> 更新变更审核中或变更审核未通过版本（Vn+1版本）的上线状态失败", zap.Any("msg", fmt.Sprintf("%#v", result)))
				return tx.Error
			}

		}

		return nil
	})

	// 异步埋点：监听状态变更并更新每日统计
	if err == nil && service.Status != oldService.Status {
		go func() {
			if err := r.serviceDailyRecordRepo.UpdateOnlineCountOnStatusChange(context.Background(), service.ServiceID, oldService.Status, service.Status); err != nil {
				log.Error("consumerWorkflowAuditResult 状态变更统计埋点失败",
					zap.String("serviceID", service.ServiceID),
					zap.String("oldStatus", oldService.Status),
					zap.String("newStatus", service.Status),
					zap.Error(err))
			}
		}()
	}

	// 上线/下线审核通过时的回调
	// if r.callback != nil && result.Result == enum.AuditStatusPass {
	// 	if auditType == enum.AuditTypeOnline || auditType == enum.AuditTypeOffline {
	// 		// 只有当状态真正发生变更时才执行回调
	// 		if service.Status != oldService.Status {
	// 			// 获取服务信息用于回调
	// 			serviceInfo, err := r.ServiceGet(context.Background(), service.ServiceID)
	// 			if err != nil {
	// 				log.Error("consumerWorkflowAuditResult 获取服务信息失败", zap.Error(err))
	// 			} else {
	// 				var statusValue string
	// 				if auditType == enum.AuditTypeOnline {
	// 					statusValue = "1" // 上线
	// 				} else if auditType == enum.AuditTypeOffline {
	// 					statusValue = "0" // 下线
	// 				}

	// 				// 创建 StatusUpdateRequest
	// 				updateStatusRequest := &callback_register.StatusUpdateRequest{
	// 					PaasId: serviceInfo.ServiceInfo.AppsId,
	// 					SvcId:  serviceInfo.ServiceInfo.ServiceID,
	// 					Status: statusValue,
	// 				}

	// 				// 调用回调
	// 				result, callbackErr := r.callback.DataApplicationServiceV1().DataApplicationService().StatusUpdate(context.Background(), updateStatusRequest)
	// 				if callbackErr != nil {
	// 					log.Error("consumerWorkflowAuditResult 回调失败", zap.Error(callbackErr))
	// 				} else {
	// 					// 记录回调结果
	// 					updateData := map[string]interface{}{
	// 						"sync_flag": result.SyncFlag,
	// 						"sync_msg":  result.Msg,
	// 						"sync_type": "status_update",
	// 					}
	// 					if updateErr := r.UpdateServiceCallbackInfo(context.Background(), service.ServiceID, updateData); updateErr != nil {
	// 						log.Error("consumerWorkflowAuditResult 记录回调结果失败", zap.Error(updateErr))
	// 					}
	// 				}
	// 			}
	// 		}
	// 	}
	// }

	log.Info("consumerWorkflowAuditResult 发布审核通过、上线审核通过、变更审核通过后，创建es索引", zap.Any("auditType", auditType), zap.Any("service.AuditStatus", service.AuditStatus))

	if service.AuditStatus == enum.AuditStatusPass && (auditType == enum.AuditTypePublish || auditType == enum.AuditTypeChange || auditType == enum.AuditTypeOnline || auditType == enum.AuditTypeOffline) {
		switch auditType {
		case enum.AuditTypePublish:
			if err = r.PushCatalogMessage(context.Background(), service.ServiceID, "create"); err != nil { //Consumer create AuditInstance
				return err
			}
			// 发布审核通过时，调用 OnCreateService 完成回调事件，并记录回调结果
			log.Info("consumerWorkflowAuditResult 发布审核通过时，调用 OnCreateService 完成回调事件，并记录回调结果")
			r.ServiceSyncCallback(context.Background(), service.ServiceID)

		case enum.AuditTypeChange:
			if err = r.PushCatalogMessage(context.Background(), service.ServiceID, "update"); err != nil { //Consumer update AuditInstance
				return err
			}
			// 变更审核通过时，调用 OnUpdateService 完成回调事件，并记录回调结果
			r.HandleCallbackEvent(context.Background(), service.ServiceID)
		}

	}

	//发布审核通过、上线审核通过、变更审核通过后，创建es索引
	if (auditType == enum.AuditTypePublish || auditType == enum.AuditTypeChange || auditType == enum.AuditTypeOnline || auditType == enum.AuditTypeOffline) && service.AuditStatus == enum.AuditStatusPass {
		return r.ServiceESIndexCreate(context.Background(), service)
	}

	return err
}

func (r *serviceRepo) ConsumerWorkflowAuditMsg(_ context.Context, result *common.AuditProcessMsg) error {
	_, ok := enum.AuditTypeMap[result.ProcessDef.Category]
	if !ok {
		return nil
	}
	advice := "audit_advice"
	if result.ProcessDef.Category == enum.AuditTypeOnline || result.ProcessDef.Category == enum.AuditTypeOffline {
		advice = "online_audit_advice"
	}

	log.Info("consumer workflow audit process msg", zap.String("audit_type", result.ProcessDef.Category), zap.Any("msg", fmt.Sprintf("%#v", result)))

	service := map[string]interface{}{
		"apply_id": result.ProcessInputModel.Fields.ApplyID,
		"flow_id":  result.ProcInstId,
		advice:     "",
	}

	if result.CurrentActivity == nil {
		if len(result.NextActivity) > 0 {
			service["flow_node_id"] = result.NextActivity[0].ActDefId
			service["flow_node_name"] = result.NextActivity[0].ActDefName
		} else {
			log.Info("audit result auto finished, do nothing",
				zap.String("audit_type", result.ProcessDef.Category),
				zap.String("apply_id", result.ProcessInputModel.Fields.ApplyID))
		}
	} else if len(result.NextActivity) == 0 {
		if !result.ProcessInputModel.Fields.AuditIdea {
			service["audit_status"] = enum.AuditStatusReject
			service[advice] = r.getAuditAdvice(result.ProcessInputModel.WFCurComment, result.ProcessInputModel.Fields.AuditMsg)
		}
	} else {
		if result.ProcessInputModel.Fields.AuditIdea {
			service["flow_node_id"] = result.NextActivity[0].ActDefId
			service["flow_node_name"] = result.NextActivity[0].ActDefName
		} else {
			service["audit_status"] = enum.AuditStatusReject
			service[advice] = r.getAuditAdvice(result.ProcessInputModel.WFCurComment, result.ProcessInputModel.Fields.AuditMsg)
		}
	}

	tx := r.data.DB.Model(&model.Service{}).Where("apply_id = ? ", service["apply_id"]).Updates(service)
	if tx.Error != nil {
		log.Error("ConsumerWorkflowAuditMsg Update", zap.Any("service", service))
		return tx.Error
	}

	return nil
}
func (r *serviceRepo) getAuditAdvice(curComment, auditMsg string) string {
	auditAdvice := ""
	if len(curComment) > 0 {
		auditAdvice = curComment
	} else {
		auditAdvice = auditMsg
	}

	// workflow 里不填审核意见时默认是 default_comment, 排除这种情况
	if auditAdvice == "default_comment" {
		auditAdvice = ""
	}

	return auditAdvice
}

func (r *serviceRepo) ConsumerWorkflowAuditProcDeletePublish(_ context.Context, result *common.AuditProcDefDelMsg) error {
	log.Info("consumer workflow process def delete msg", zap.String("audit_type", enum.AuditTypePublish), zap.Any("msg", fmt.Sprintf("%#v", result)))
	return r.consumerWorkflowAuditProcDelete(enum.AuditTypePublish, result)
}

func (r *serviceRepo) ConsumerWorkflowAuditProcDeleteChange(_ context.Context, result *common.AuditProcDefDelMsg) error {
	log.Info("consumer workflow process def delete msg", zap.String("audit_type", enum.AuditTypeChange), zap.Any("msg", fmt.Sprintf("%#v", result)))
	return r.consumerWorkflowAuditProcDelete(enum.AuditTypeChange, result)
}

func (r *serviceRepo) ConsumerWorkflowAuditProcDeleteOffline(_ context.Context, result *common.AuditProcDefDelMsg) error {
	log.Info("consumer workflow process def delete msg", zap.String("audit_type", enum.AuditTypeOffline), zap.Any("msg", fmt.Sprintf("%#v", result)))
	return r.consumerWorkflowAuditProcDelete(enum.AuditTypeOffline, result)
}

func (r *serviceRepo) ConsumerWorkflowAuditProcDeleteOnline(_ context.Context, result *common.AuditProcDefDelMsg) error {
	log.Info("consumer workflow process def delete msg", zap.String("audit_type", enum.AuditTypeOnline), zap.Any("msg", fmt.Sprintf("%#v", result)))
	return r.consumerWorkflowAuditProcDelete(enum.AuditTypeOnline, result)
}

func (r *serviceRepo) consumerWorkflowAuditProcDelete(auditType string, result *common.AuditProcDefDelMsg) error {
	if len(result.ProcDefKeys) == 0 {
		return nil
	}

	// 撤销正在进行中的审核
	service := &model.Service{
		AuditStatus: enum.AuditStatusReject,
		AuditAdvice: "流程被删除，审核撤销",
	}

	tx := r.data.DB.Model(service).
		Where("audit_type = ?", auditType).
		Where("audit_status = ?", enum.AuditStatusAuditing).
		Where("proc_def_key in ?", result.ProcDefKeys).
		Updates(service)
	if tx.Error != nil {
		log.Error("consumerWorkflowAuditProcDelete Updates Service", zap.Error(tx.Error), zap.Any("msg", fmt.Sprintf("%#v", result)))
	}

	//删除审核流程绑定
	tx = r.data.DB.WithContext(context.Background()).
		Model(&model.AuditProcessBind{}).
		Where(&model.AuditProcessBind{AuditType: auditType}).
		Delete(&model.AuditProcessBind{})
	if tx.Error != nil {
		log.Error("consumerWorkflowAuditProcDelete Delete AuditProcessBind", zap.Error(tx.Error), zap.Any("msg", fmt.Sprintf("%#v", result)))
		return tx.Error
	}

	return nil
}

func (r *serviceRepo) ServiceVersionBack(ctx context.Context, serviceID string) (resp *dto.ServiceIdRes, err error) {
	//变更审核不通过的版本(serviceID为变更不通过的ID）
	var ChangedService model.Service
	tx := r.data.DB.WithContext(ctx).
		Model(&model.Service{}).
		Where(&model.Service{ServiceID: serviceID}).
		Find(&ChangedService)
	if tx.Error != nil {
		log.Error("ServiceVersionBack Query Service", zap.Error(tx.Error))
		return nil, tx.Error
	}
	//变更审核不通过的版本，其ChangedServiceId一定不为空
	if len(ChangedService.ChangedServiceId) == 0 || strings.EqualFold(ChangedService.ChangedServiceId, "null") {
		log.Error("ServiceVersionBack Query Service：存在脏数据：变更审核不通过的数据ChangedServiceId不能为空")
		err = errorcode.Desc(errorcode.PublishDataError)
		return
	}
	//变更前的版本
	var PreChangedService model.Service
	tx = r.data.DB.WithContext(ctx).
		Model(&model.Service{}).
		Where(&model.Service{ServiceID: ChangedService.ChangedServiceId}).
		Find(&PreChangedService)
	if tx.Error != nil {
		log.Error("ServiceVersionBack Query Service", zap.Error(tx.Error))
		return nil, tx.Error
	}
	currentTime := time.Now()
	PreChangedService.IsChanged = "0"
	PreChangedService.UpdateTime = currentTime
	err = r.data.DB.Transaction(func(tx *gorm.DB) error {
		deleteErr := r.ServiceDelete(ctx, serviceID)
		if deleteErr != nil {
			log.Error("serviceRepo ServiceVersionBack Update", zap.Error(deleteErr))
			return tx.Error
		}

		t := tx.Model(&model.Service{}).
			Where(&model.Service{ServiceID: PreChangedService.ServiceID}).
			Updates(PreChangedService)
		if t.Error != nil {
			log.Error("serviceRepo ServiceVersionBack Update", zap.Error(t.Error))
			return tx.Error
		}
		return nil
	})
	if err != nil {
		return nil, err
	}
	return &dto.ServiceIdRes{ServiceID: PreChangedService.ServiceID}, nil

}

func (r *serviceRepo) ServiceUpdateStatus(ctx context.Context, serviceID string, lineStatus string) (resp *dto.ServiceIdRes, err error) {
	// 查询旧状态用于埋点
	oldService, err := r.ServiceGetFields(ctx, serviceID, []string{"status"})
	if err != nil {
		log.Error("ServiceUpdateStatus get old status", zap.Error(err))
		return nil, err
	}
	oldStatus := oldService.Status

	Service := &model.Service{}
	Service.Status = lineStatus
	nowTime := time.Now()
	Service.UpdateTime = nowTime
	// 上线时间
	if lineStatus == enum.LineStatusOnLine {
		Service.OnlineTime = &nowTime
	}
	if lineStatus == enum.LineStatusOnLine || lineStatus == enum.LineStatusUpAuditing {
		Service.AuditType = enum.AuditTypeOnline
	} else {
		Service.AuditType = enum.AuditTypeOffline
	}
	if lineStatus == enum.LineStatusOnLine || lineStatus == enum.LineStatusOffLine {
		Service.AuditStatus = enum.AuditStatusPass
	} else {
		Service.AuditStatus = enum.AuditStatusAuditing
	}
	tx := r.data.DB.Model(Service).
		Where("service_id = ?", serviceID).
		Updates(Service)
	if tx.Error != nil {
		log.Error("ServiceUpdateStatus Update Service", zap.Error(tx.Error))
		return nil, tx.Error
	}

	// 异步埋点：监听状态变更并更新每日统计
	go func() {
		if err := r.serviceDailyRecordRepo.UpdateOnlineCountOnStatusChange(context.Background(), serviceID, oldStatus, lineStatus); err != nil {
			log.Error("ServiceUpdateStatus 状态变更统计埋点失败",
				zap.String("serviceID", serviceID),
				zap.String("oldStatus", oldStatus),
				zap.String("newStatus", lineStatus),
				zap.Error(err))
		}
	}()

	return &dto.ServiceIdRes{ServiceID: serviceID}, nil
}

// 更新指定接口服务的上线状态 status 和发布状态 publish_status 为指定值
func (r *serviceRepo) ServiceUpdateStatusAndPublishStatus(ctx context.Context, status, publishStatus string, opts ServiceUpdateOptions) error {
	log.Debug("update service status and publish status", zap.String("status", status), zap.String("publishStatus", publishStatus), zap.Any("opts", opts))
	tx := r.data.DB.WithContext(ctx).Model(&model.Service{})

	if opts.Filter != nil {
		tx = opts.Filter.Filter(tx)
	}
	if opts.OrderBy != nil {
		tx = opts.OrderBy.OrderBy(tx)
	}
	if opts.Limit != 0 {
		tx = tx.Limit(opts.Limit)
	}

	// 1. Update执行前,根据tx查询待修改的记录
	var beforeServices []*model.Service
	beforeTx := tx.Session(&gorm.Session{})
	if err := beforeTx.Find(&beforeServices).Error; err != nil {
		log.WithContext(ctx).Error("ServiceUpdateStatusAndPublishStatus 查询修改前记录失败", zap.Error(err))
		return err
	}

	// 2. Update执行后，如果不报错，根据tx查询已修改的记录
	err := tx.Updates(&model.Service{
		Status:        status,
		PublishStatus: publishStatus,
	}).Error

	if err != nil {
		return err
	}

	// 查询修改后的记录
	var afterServices []*model.Service
	afterTx := r.data.DB.WithContext(ctx).Model(&model.Service{})
	if opts.Filter != nil {
		afterTx = opts.Filter.Filter(afterTx)
	}
	if opts.OrderBy != nil {
		afterTx = opts.OrderBy.OrderBy(afterTx)
	}
	if opts.Limit != 0 {
		afterTx = afterTx.Limit(opts.Limit)
	}
	if err := afterTx.Find(&afterServices).Error; err != nil {
		log.WithContext(ctx).Error("ServiceUpdateStatusAndPublishStatus 查询修改后记录失败", zap.Error(err))
		return err
	}

	// 3. 判断记录修改前后是否发生Status、PublishStatus属性的变化，生成发生了变化的service数组
	var changedServices []*model.Service
	beforeMap := make(map[string]*model.Service)
	for _, service := range beforeServices {
		beforeMap[service.ServiceID] = service
	}

	for _, afterService := range afterServices {
		if beforeService, exists := beforeMap[afterService.ServiceID]; exists {
			// 检查 Status 或 PublishStatus 是否发生变化
			if beforeService.Status != afterService.Status || beforeService.PublishStatus != afterService.PublishStatus {
				changedServices = append(changedServices, afterService)
			}
		}
	}

	// 4. 循环发生了变化的service数组，调用OnCreateService完成回调事件，并记录回调结果到service数组
	if len(changedServices) > 0 && r.callback != nil {
		for _, service := range changedServices {
			r.ServiceSyncCallback(ctx, service.ServiceID)
		}

		// 5. 根据service数组在数据库批量更新回调结果相关字段
		// for _, service := range changedServices {
		// 	updateData := map[string]interface{}{
		// 		"sync_flag": service.SyncFlag,
		// 		"sync_msg":  service.SyncMsg,
		// 	}
		// 	if updateErr := r.UpdateServiceCallbackInfo(context.Background(), service.ServiceID, updateData); updateErr != nil {
		// 		log.WithContext(ctx).Error("ServiceUpdateStatusAndPublishStatus 更新回调结果失败",
		// 			zap.String("serviceID", service.ServiceID),
		// 			zap.Error(updateErr))
		// 	}
		// }
	}

	// 6. 对发生变化的服务进行ES索引更新
	if len(changedServices) > 0 {
		log.WithContext(ctx).Info("ServiceUpdateStatusAndPublishStatus 开始更新ES索引",
			zap.Int("changedServicesCount", len(changedServices)),
			zap.String("status", status),
			zap.String("publishStatus", publishStatus))

		for _, service := range changedServices {
			// 发送ES索引更新消息
			if err := r.ServiceESIndexCreate(context.Background(), service); err != nil {
				log.WithContext(ctx).Error("ServiceUpdateStatusAndPublishStatus ES索引更新失败",
					zap.String("serviceID", service.ServiceID),
					zap.Error(err))
				// 不中断整个流程，继续处理其他服务
			} else {
				log.WithContext(ctx).Info("ServiceUpdateStatusAndPublishStatus ES索引更新成功",
					zap.String("serviceID", service.ServiceID))
			}
		}
	}

	// 异步执行批量同步 service_daily_record 的 online_count
	go func() {
		if syncErr := r.serviceDailyRecordRepo.SyncOnlineCountWithServiceStatus(context.Background()); syncErr != nil {
			log.Error("ServiceUpdateStatusAndPublishStatus 批量同步统计失败",
				zap.String("status", status),
				zap.String("publishStatus", publishStatus),
				zap.Error(syncErr))
		}
	}()

	return nil
}

func (r *serviceRepo) UndoChangeAuditToUpdateService(ctx context.Context, serviceID string) (resp *dto.ServiceIdRes, err error) {
	//变更审核中的版本(serviceID为变更审核中的ID）
	var ChangedService model.Service
	tx := r.data.DB.WithContext(ctx).
		Model(&model.Service{}).
		Scopes(Undeleted()).
		// service_id 用于在更新时索引记录
		// changed_service_id 用于获取变更前已发布的版本
		Select("service_id", "changed_service_id").
		Where(&model.Service{ServiceID: serviceID}).
		Find(&ChangedService)
	if tx.Error != nil {
		log.Error("ServiceVersionBack Query Service", zap.Error(tx.Error))
		return nil, tx.Error
	}
	//变更审核中的版本，其ChangedServiceId一定不为空
	if len(ChangedService.ChangedServiceId) == 0 || strings.EqualFold(ChangedService.ChangedServiceId, "null") {
		log.Error("ServiceVersionBack Query Service：存在脏数据：变更审核中的数据ChangedServiceId不会为空")
		err = errorcode.Desc(errorcode.PublishDataError)
		return
	}
	//变更前，已发布的版本
	var PreChangedService model.Service
	tx = r.data.DB.WithContext(ctx).
		Model(&model.Service{}).
		Scopes(Undeleted()).
		// service_id 用于在更新时索引记录
		Select("service_id").
		Where(&model.Service{ServiceID: ChangedService.ChangedServiceId}).
		Find(&PreChangedService)
	if tx.Error != nil {
		log.Error("ServiceVersionBack Query Service", zap.Error(tx.Error))
		return nil, tx.Error
	}
	currentTime := time.Now()
	ChangedService.IsChanged = "1" //变更版本充当已发布版本的草稿
	ChangedService.UpdateTime = currentTime
	PreChangedService.IsChanged = "0"
	PreChangedService.UpdateTime = currentTime
	//开启事务
	err = r.data.DB.Transaction(func(tx *gorm.DB) error {
		t := tx.Model(&model.Service{}).
			Scopes(Undeleted()).
			// 仅更新 is_changed, update_time
			Select("is_changed", "update_time").
			Where(&model.Service{ServiceID: ChangedService.ServiceID}).
			Updates(ChangedService)
		if t.Error != nil {
			log.Error("serviceRepo ServiceVersionBack Update", zap.Error(t.Error))
			return tx.Error
		}

		t = tx.Model(&model.Service{}).
			Scopes(Undeleted()).
			// 仅更新 is_changed, update_time
			Select("is_changed", "update_time").
			Where(&model.Service{ServiceID: PreChangedService.ServiceID}).
			Updates(PreChangedService)
		if t.Error != nil {
			log.Error("serviceRepo ServiceVersionBack Update", zap.Error(t.Error))
			return tx.Error
		}
		return nil
	})
	if err != nil {
		return nil, err
	}
	return &dto.ServiceIdRes{ServiceID: PreChangedService.ServiceID}, nil
}

func (r *serviceRepo) UpdateServicePublishStatus(ctx context.Context, serviceID string, publishStatus string) (resp *dto.ServiceIdRes, err error) {
	var Service model.Service
	tx := r.data.DB.WithContext(ctx).
		Model(&model.Service{}).
		Where(&model.Service{ServiceID: serviceID}).
		Find(&Service)
	if tx.Error != nil {
		log.Error("UpdateServicePublishStatus Query Service", zap.Error(tx.Error))
		return nil, tx.Error
	}
	Service.PublishStatus = publishStatus
	Service.UpdateTime = time.Now()
	tx = r.data.DB.Model(Service).
		Where("service_id = ?", serviceID).
		Updates(Service)
	if tx.Error != nil {
		log.Error("UpdateServicePublishStatus Update Service", zap.Error(tx.Error))
		return nil, tx.Error
	}
	return &dto.ServiceIdRes{ServiceID: serviceID}, nil
}

func (r *serviceRepo) ServiceChangeInPublished(ctx context.Context, req *dto.ServiceChangeReq) (resp *dto.ServiceIdRes, err error) {
	service := dto.ServiceCreateOrTempReq{
		IsTemp:          req.IsTemp,
		ServiceInfo:     req.ServiceInfo,
		ServiceParam:    req.ServiceParam,
		ServiceResponse: req.ServiceResponse,
		ServiceTest:     req.ServiceTest,
	}
	//判断是否为变更暂存后再发起正式变更
	exist, err := r.IsExistDraftService(ctx, req.ServiceID)
	if err != nil {
		return nil, err
	}
	//变更暂存
	if req.IsTemp {
		service.ServiceInfo.IsChanged = "1"
		service.ServiceInfo.PublishStatus = enum.PublishStatusUnPublished
		if exist {
			//有变更草稿就更新草稿
			draftServiceId, draftErr := r.GetTempServiceId(ctx, req.ServiceID)
			if draftErr != nil {
				return nil, draftErr
			}
			update := dto.ServiceUpdateReqOrTemp{
				ServiceUpdateUriReq: dto.ServiceUpdateUriReq{
					ServiceID: draftServiceId,
				},
				ServiceUpdateOrTempBodyReq: dto.ServiceUpdateOrTempBodyReq{
					IsTemp:          service.IsTemp,
					ServiceInfo:     service.ServiceInfo,
					ServiceParam:    service.ServiceParam,
					ServiceResponse: service.ServiceResponse,
					ServiceTest:     service.ServiceTest,
				},
			}
			resp = &dto.ServiceIdRes{ServiceID: draftServiceId}
			err = r.ServiceUpdate(ctx, &update, false)
			if err != nil {
				return nil, err
			}
		} else {
			service.ServiceInfo.ChangedServiceId = req.ServiceID
			//首次暂存即正式变更就Create
			result, err := r.ServiceCreate(ctx, &service, false)
			if err != nil {
				return nil, err
			}
			resp = &dto.ServiceIdRes{ServiceID: result.ServiceID}
		}
	} else {
		//直接发起变更
		err = r.data.DB.Transaction(func(tx *gorm.DB) error {
			_, updateErr := r.ServiceUpdateChangeStatus(ctx, "1", req.ServiceID)
			if updateErr != nil {
				return updateErr
			}
			service.ServiceInfo.PublishStatus = enum.PublishStatusChangeAuditing
			service.ServiceInfo.AuditType = enum.AuditTypeChange
			if exist {
				//有变更草稿就更新草稿
				draftServiceId, draftErr := r.GetTempServiceId(ctx, req.ServiceID)
				if draftErr != nil {
					return draftErr
				}
				update := dto.ServiceUpdateReqOrTemp{
					ServiceUpdateUriReq: dto.ServiceUpdateUriReq{
						ServiceID: draftServiceId,
					},
					ServiceUpdateOrTempBodyReq: dto.ServiceUpdateOrTempBodyReq{
						IsTemp:          service.IsTemp,
						ServiceInfo:     service.ServiceInfo,
						ServiceParam:    service.ServiceParam,
						ServiceResponse: service.ServiceResponse,
						ServiceTest:     service.ServiceTest,
					},
				}
				update.ServiceInfo.IsChanged = "0" //把原来的草稿版本标识重置
				resp = &dto.ServiceIdRes{ServiceID: draftServiceId}
				err = r.ServiceUpdate(ctx, &update, false)
				if err != nil {
					return err
				}
			} else {
				service.ServiceInfo.ChangedServiceId = req.ServiceID
				//首次变更即正式变更就Create
				result, err := r.ServiceCreate(ctx, &service, false)
				if err != nil {
					return err
				}
				resp = &dto.ServiceIdRes{ServiceID: result.ServiceID}
			}
			//把已发布版本的status带过来，实现变更审核不通过的版本上线就把已发布的版本上线
			status, err := r.ServiceGetFields(ctx, req.ServiceID, []string{"status"})
			_, err = r.ServiceUpdateStatus(ctx, resp.ServiceID, status.Status)
			//返回后，业务层去生成审核实例并发送
			//resp = &dto.ServiceIdRes{ServiceID: res.ServiceID}
			if err != nil {
				return err
			}
			//提交事务
			return nil
		})

	}
	return
}

// ServiceChangeInChangeAuditReject 适配需求变动，变更审核未通过时可以编辑、暂存，继续更新当前Vn+1版本数据，作为新的Vn+1数据。不是将Vn+1当作新的Vn，重新insert一条数据
func (r *serviceRepo) ServiceChangeInChangeAuditReject(ctx context.Context, req *dto.ServiceChangeReq) (resp *dto.ServiceIdRes, err error) {
	service := dto.ServiceUpdateReqOrTemp{
		ServiceUpdateUriReq: req.ServiceUpdateUriReq,
		ServiceUpdateOrTempBodyReq: dto.ServiceUpdateOrTempBodyReq{
			IsTemp:          req.IsTemp,
			ServiceInfo:     req.ServiceInfo,
			ServiceParam:    req.ServiceParam,
			ServiceResponse: req.ServiceResponse,
			ServiceTest:     req.ServiceTest,
		},
	}
	//变更审核未通过时，变更暂存，更新当前不通过的版本，并放出原已发布版本
	if req.IsTemp {
		service.ServiceUpdateOrTempBodyReq.ServiceInfo.UpdateTime = time.Now().String()
		service.ServiceUpdateOrTempBodyReq.ServiceInfo.IsChanged = "1"
		fields, queryErr := r.ServiceGetFields(ctx, req.ServiceID, []string{"changed_service_id", "publish_status", "audit_type"})
		if queryErr != nil {
			return nil, queryErr
		}
		service.ServiceInfo.PublishStatus = fields.PublishStatus
		service.ServiceInfo.AuditType = fields.AuditType
		err = r.data.DB.Transaction(func(tx *gorm.DB) error {
			errUpdate := r.ServiceUpdate(ctx, &service, false)
			if errUpdate != nil {
				return errUpdate
			}
			_, errUpdate = r.ServiceUpdateChangeStatus(ctx, "0", fields.ChangedServiceId) //列表变更为已发布版本
			if errUpdate != nil {
				return errUpdate
			}
			return nil

		})
		if err != nil {
			return nil, err
		}
		resp = &dto.ServiceIdRes{ServiceID: req.ServiceID}
	} else {
		// 不是暂存，直接发布，置为变更审核中
		service.ServiceInfo.PublishStatus = enum.PublishStatusChangeAuditing
		service.ServiceInfo.UpdateTime = time.Now().String()
		err = r.ServiceUpdate(ctx, &service, false)
		if err != nil {
			return nil, err
		}
		resp = &dto.ServiceIdRes{ServiceID: req.ServiceID}

	}
	return
}
func (r *serviceRepo) ServiceUpdateChangeStatus(ctx context.Context, changeStatus string, serviceID string) (resp *dto.ServiceIdRes, err error) {
	var Service model.Service
	tx := r.data.DB.WithContext(ctx).
		Model(&model.Service{}).
		Where(&model.Service{ServiceID: serviceID}).
		Find(&Service)
	if tx.Error != nil {
		log.Error("ServiceUpdateChangeStatus Query Service", zap.Error(tx.Error))
		return nil, tx.Error
	}
	Service.IsChanged = changeStatus
	Service.UpdateTime = time.Now()
	tx = r.data.DB.Model(Service).
		Where("service_id = ?", serviceID).
		Updates(Service)
	if tx.Error != nil {
		log.Error("ServiceUpdateChangeStatus Update Service", zap.Error(tx.Error))
		return nil, tx.Error
	}
	return &dto.ServiceIdRes{ServiceID: serviceID}, nil
}

func (r *serviceRepo) GetDraftService(ctx context.Context, serviceID string) (resp *dto.ServiceGetRes, err error) {
	tx := r.data.DB.WithContext(ctx).Scopes(Undeleted()).
		Model(&model.Service{}).
		Where("changed_service_id = ?", serviceID)
	var DraftService model.Service

	tx = tx.Find(&DraftService)
	if tx.Error != nil {
		log.Error("GetDraftService Query Service", zap.Error(tx.Error))
		return nil, tx.Error
	}
	if len(DraftService.ServiceID) != 0 {
		//有草稿版本，返回
		resp, err = r.ServiceGet(ctx, DraftService.ServiceID)
		if err != nil {
			log.Error("GetDraftService Query Service", zap.Error(tx.Error))
			return nil, err
		}
		//草稿创建人,先看update_by，为空则取created_by,created_by为空说明为旧版本的数据，取owner
		userId := resp.ServiceInfo.UpdateBy
		if userId == "" {
			userId = resp.ServiceInfo.CreatedBy
		}
		if userId == "" {
			userId = resp.ServiceInfo.OwnerId //兼容旧数据，理论上新数据都会有createBy
		}
		userInfo, err := r.userManagementRepo.GetUserById(ctx, userId)
		if err != nil {
			log.Error("GetDraftService Query UserName  --> 查询用户名失败，用户ID: "+userId, zap.Error(tx.Error))
			resp.ServiceInfo.UpdateBy = ""
		} else {
			resp.ServiceInfo.UpdateBy = userInfo.Name
		}
	}
	return

}

func (r *serviceRepo) IsExistDraftService(ctx context.Context, serviceID string) (exist bool, err error) {
	var count int64
	where := &model.Service{
		ChangedServiceId: serviceID,
		IsChanged:        "1",
	}

	tx := r.data.DB.WithContext(ctx).Scopes(Undeleted()).
		Model(&model.Service{}).
		Where(where).
		Count(&count)

	if tx.Error != nil {
		log.WithContext(ctx).Error("IsExistDraftService", zap.Error(tx.Error))
		return false, tx.Error
	}
	return count > 0, nil
}

// DeleteDraftService 根据service_id获取其下的草稿Service并删除
func (r *serviceRepo) DeleteDraftService(ctx context.Context, serviceID string) error {
	where := &model.Service{
		ChangedServiceId: serviceID,
		IsChanged:        "1",
	}
	var DraftService model.Service
	tx := r.data.DB.WithContext(ctx).Scopes(Undeleted()).
		Model(&model.Service{}).
		Where(where).
		Find(&DraftService)
	if tx.Error != nil {
		log.WithContext(ctx).Error("GetDraftService", zap.Error(tx.Error))
		return tx.Error
	}
	err := r.ServiceDelete(ctx, DraftService.ServiceID)
	if err != nil {
		log.Error("serviceRepo recoverToPublished Update  --> 删除草稿失败：", zap.Error(err))
		return tx.Error
	}
	return nil

}
func (r *serviceRepo) RecoverToPublished(ctx context.Context, serviceID string) (resp *dto.ServiceIdRes, err error) {
	var Service model.Service
	tx := r.data.DB.WithContext(ctx).
		Model(&model.Service{}).
		Where(&model.Service{ServiceID: serviceID}).
		Find(&Service)
	if tx.Error != nil {
		log.Error("ServiceUpdateChangeStatus Query Service", zap.Error(tx.Error))
		return nil, tx.Error
	}
	exist, err := r.IsExistDraftService(ctx, serviceID)
	if err != nil {
		return nil, err
	}
	//变更审核未通过且没有草稿时回退
	if Service.PublishStatus == enum.PublishStatusChangeReject && !exist {
		resp, err = r.ServiceVersionBack(ctx, serviceID)
	}
	//变更审核未通过且有草稿时回退，前面暂存编辑时已放出已发布版本，此时只需删掉草稿
	if Service.PublishStatus == enum.PublishStatusChangeReject && exist {
		err = r.DeleteDraftService(ctx, serviceID)
		if err != nil {
			return nil, err
		}
		resp = &dto.ServiceIdRes{ServiceID: serviceID}
	}
	//已发布且有草稿时回退，仅删除草稿
	if Service.PublishStatus == enum.PublishStatusPublished && exist {
		err = r.DeleteDraftService(ctx, serviceID)
		if err != nil {
			return nil, err
		}
		resp = &dto.ServiceIdRes{ServiceID: serviceID}
	}
	return
}

func (r *serviceRepo) GetAllUndeleteServiceByOffset(ctx context.Context, offset int, limit int) (Services []*model.Service, err error) {
	tx := r.data.DB.WithContext(ctx).Scopes(Undeleted(), UnChanged()).
		Model(&model.Service{}).
		Offset(offset).
		Limit(limit).
		Find(&Services)
	if tx.Error != nil {
		log.Error("GetAllUndeleteServiceByOffset  --> 查询Service数据失败：", zap.Error(tx.Error))
		return nil, tx.Error
	}
	return
}

func (r *serviceRepo) GetAllUndeleteServiceByServices(ctx context.Context, servicesIds ...string) (Services []*model.Service, err error) {
	tx := r.data.DB.WithContext(ctx).Scopes(Undeleted()).
		Model(&model.Service{}).
		Where("service_id in ?", servicesIds).
		Find(&Services)
	if tx.Error != nil {
		log.Error("GetAllUndeleteServiceByOffset  --> 查询Service数据失败：", zap.Error(tx.Error))
		return nil, tx.Error
	}
	return
}

func (r *serviceRepo) GetAllUndeleteService(ctx context.Context) (Services []*model.Service, err error) {
	tx := r.data.DB.WithContext(ctx).Scopes(Undeleted(), UnChanged()).
		Model(&model.Service{}).
		Find(&Services)
	if tx.Error != nil {
		log.Error("GetAllUndeleteServiceByOffset  --> 查询Service数据失败：", zap.Error(tx.Error))
		return nil, tx.Error
	}
	return
}

func (r *serviceRepo) GetAllUndeleteServiceCount(ctx context.Context) (count int64, err error) {
	tx := r.data.DB.WithContext(ctx).Scopes(Undeleted(), UnChanged()).
		Model(&model.Service{}).
		Count(&count)
	if tx.Error != nil {
		log.Error("GetAllUndeleteServiceCount --> 查询数据总量失败：", zap.Error(tx.Error))
		return 0, nil
	}
	return
}

// GetIdByPublishedId List接口，在变更审核中、变更审核未通过时，返回的id仍然是已发布版本的ID，该方法用于兑换原ID
func (r *serviceRepo) GetIdByPublishedId(ctx context.Context, publishedId string) (serviceId string, err error) {
	if publishedId == "" {
		return "", nil
	}
	var Service model.Service
	tx := r.data.DB.WithContext(ctx).Scopes(Undeleted()).
		Model(&model.Service{}).
		Where(&model.Service{ChangedServiceId: publishedId}).
		Find(&Service)
	if tx.Error != nil {
		log.Error("GetIdByPublishedId Query Service Error: ", zap.Error(tx.Error))
		return "", tx.Error
	}
	return Service.ServiceID, nil
}

// GetTempServiceId 获取变更审核中暂存的草稿ID
func (r *serviceRepo) GetTempServiceId(ctx context.Context, serviceId string) (sid string, err error) {
	var Service model.Service
	tx := r.data.DB.WithContext(ctx).Scopes(Undeleted()).
		Model(&model.Service{}).
		Where(&model.Service{ChangedServiceId: serviceId}).
		Where(&model.Service{IsChanged: "1"}).
		Find(&Service)
	if tx.Error != nil {
		log.Error("GetIdByPublishedId Query Service Error: ", zap.Error(tx.Error))
		return "", tx.Error
	}
	return Service.ServiceID, nil
}

// GetOwnerID implements ServiceRepo.
func (r *serviceRepo) GetOwnerID(ctx context.Context, id string) (string, error) {
	service := &model.Service{ServiceID: id}
	tx := r.data.DB.Scopes(Undeleted(), UnChanged()).Where(service).Select("owner_id").Take(service)
	if errors.Is(tx.Error, gorm.ErrRecordNotFound) {
		return "", errorcode.Desc(errorcode.ServiceIDNotExist)
	}

	return service.OwnerID, nil
}

func (r *serviceRepo) GetServicesMaxResponse(ctx context.Context, req *dto.GetServicesMaxResponseReq) (res []*model.ServiceParam, err error) {
	var serviceId string
	err = r.data.DB.WithContext(ctx).Model(&model.ServiceParam{}).Select("service_id").Where("param_type='response' and service_id in ?", req.ServiceID).Group("service_id").Order("COUNT( service_id ) DESC ").Limit(1).Scan(&serviceId).Error
	if err != nil {
		log.Error("GetServicesMaxResponse get max serviceId", zap.Error(err))
		return
	}
	err = r.data.DB.WithContext(ctx).Where("param_type='response' and service_id = ?", serviceId).Find(&res).Error
	if err != nil {
		log.Error("GetServicesMaxResponse Find", zap.Error(err))
		return
	}
	return
}

// GetStatusStatistics 获取服务状态统计
func (r *serviceRepo) GetStatusStatistics(ctx context.Context, serviceType string) (*ServiceStatusStatistics, error) {
	// 创建基础查询条件的函数
	baseTx := func() *gorm.DB {
		tx := r.data.DB.WithContext(ctx).Model(&model.Service{}).Where("delete_time = 0 AND (is_changed = '0' OR is_changed = '')")
		if serviceType != "" {
			tx = tx.Where("service_type = ?", serviceType)
		}
		return tx
	}

	stats := &ServiceStatusStatistics{}

	// 1. 总记录数
	if err := baseTx().Count(&stats.ServiceCount).Error; err != nil {
		log.WithContext(ctx).Error("GetStatusStatistics Count", zap.Error(err))
		return nil, err
	}

	// 2. 已发布数量 (publish_status = 'published')
	var publishedCount int64
	if err := baseTx().Where("publish_status = ?", "published").Count(&publishedCount).Error; err != nil {
		log.WithContext(ctx).Error("GetStatusStatistics PublishedCount", zap.Error(err))
		return nil, err
	}
	stats.PublishedCount = publishedCount

	// 3. 未发布数量 (publish_status != 'published')
	stats.UnpublishedCount = stats.ServiceCount - stats.PublishedCount

	// 4. 未上线数量 (status = 'notline' 或 status = 'up-auditing' 或 status = 'up-reject')
	var notlineCount int64
	if err := baseTx().Where("status IN (?, ?, ?)", "notline", "up-auditing", "up-reject").Count(&notlineCount).Error; err != nil {
		log.WithContext(ctx).Error("GetStatusStatistics NotlineCount", zap.Error(err))
		return nil, err
	}
	stats.NotlineCount = notlineCount

	// 5. 已上线数量 (status = 'online' 或 status = 'down-auditing' 或 status = 'down-reject')
	var onlineCount int64
	if err := baseTx().Where("status IN (?, ?, ?)", "online", "down-auditing", "down-reject").Count(&onlineCount).Error; err != nil {
		log.WithContext(ctx).Error("GetStatusStatistics OnlineCount", zap.Error(err))
		return nil, err
	}
	stats.OnLineCount = onlineCount

	// 6. 已下线数量 (status = 'offline')
	var offlineCount int64
	if err := baseTx().Where("status = ?", "offline").Count(&offlineCount).Error; err != nil {
		log.WithContext(ctx).Error("GetStatusStatistics OfflineCount", zap.Error(err))
		return nil, err
	}
	stats.OfflineCount = offlineCount

	// 7. 发布审核相关统计
	// 发布审核中 (audit_type = 'af-data-application-publish' AND audit_status = 'auditing')
	var publishAuditingCount int64
	if err := baseTx().Where("audit_type = ? AND audit_status = ?", "af-data-application-publish", "auditing").Count(&publishAuditingCount).Error; err != nil {
		log.WithContext(ctx).Error("GetStatusStatistics PublishAuditingCount", zap.Error(err))
		return nil, err
	}
	stats.AfDataApplicationPublishAuditingCount = publishAuditingCount

	// 发布审核未通过 (audit_type = 'af-data-application-publish' AND audit_status = 'reject')
	var publishRejectCount int64
	if err := baseTx().Where("audit_type = ? AND audit_status = ?", "af-data-application-publish", "reject").Count(&publishRejectCount).Error; err != nil {
		log.WithContext(ctx).Error("GetStatusStatistics PublishRejectCount", zap.Error(err))
		return nil, err
	}
	stats.AfDataApplicationPublishRejectCount = publishRejectCount

	// 发布审核通过 (audit_type = 'af-data-application-publish' AND audit_status = 'pass')
	var publishPassCount int64
	if err := baseTx().Where("audit_type = ? AND audit_status = ?", "af-data-application-publish", "pass").Count(&publishPassCount).Error; err != nil {
		log.WithContext(ctx).Error("GetStatusStatistics PublishPassCount", zap.Error(err))
		return nil, err
	}
	stats.AfDataApplicationPublishPassCount = publishPassCount

	// 8. 上线审核相关统计
	// 上线审核中 (audit_type = 'af-data-application-online' AND audit_status = 'auditing')
	var onlineAuditingCount int64
	if err := baseTx().Where("audit_type = ? AND audit_status = ?", "af-data-application-online", "auditing").Count(&onlineAuditingCount).Error; err != nil {
		log.WithContext(ctx).Error("GetStatusStatistics OnlineAuditingCount", zap.Error(err))
		return nil, err
	}
	stats.AfDataApplicationOnlineAuditingCount = onlineAuditingCount

	// 上线审核通过 (audit_type = 'af-data-application-online' AND audit_status = 'pass')
	var onlinePassCount int64
	if err := baseTx().Where("audit_type = ? AND audit_status = ?", "af-data-application-online", "pass").Count(&onlinePassCount).Error; err != nil {
		log.WithContext(ctx).Error("GetStatusStatistics OnlinePassCount", zap.Error(err))
		return nil, err
	}
	stats.AfDataApplicationOnlinePassCount = onlinePassCount

	// 上线审核未通过 (audit_type = 'af-data-application-online' AND audit_status = 'reject')
	var onlineRejectCount int64
	if err := baseTx().Where("audit_type = ? AND audit_status = ?", "af-data-application-online", "reject").Count(&onlineRejectCount).Error; err != nil {
		log.WithContext(ctx).Error("GetStatusStatistics OnlineRejectCount", zap.Error(err))
		return nil, err
	}
	stats.AfDataApplicationOnlineRejectCount = onlineRejectCount

	// 9. 下线审核相关统计
	// 下线审核中 (audit_type = 'af-data-application-offline' AND audit_status = 'auditing')
	var offlineAuditingCount int64
	if err := baseTx().Where("audit_type = ? AND audit_status = ?", "af-data-application-offline", "auditing").Count(&offlineAuditingCount).Error; err != nil {
		log.WithContext(ctx).Error("GetStatusStatistics OfflineAuditingCount", zap.Error(err))
		return nil, err
	}
	stats.AfDataApplicationOfflineAuditingCount = offlineAuditingCount

	// 下线审核通过 (audit_type = 'af-data-application-offline' AND audit_status = 'pass')
	var offlinePassCount int64
	if err := baseTx().Where("audit_type = ? AND audit_status = ?", "af-data-application-offline", "pass").Count(&offlinePassCount).Error; err != nil {
		log.WithContext(ctx).Error("GetStatusStatistics OfflinePassCount", zap.Error(err))
		return nil, err
	}
	stats.AfDataApplicationOfflinePassCount = offlinePassCount

	// 下线审核未通过 (audit_type = 'af-data-application-offline' AND audit_status = 'reject')
	var offlineRejectCount int64
	if err := baseTx().Where("audit_type = ? AND audit_status = ?", "af-data-application-offline", "reject").Count(&offlineRejectCount).Error; err != nil {
		log.WithContext(ctx).Error("GetStatusStatistics OfflineRejectCount", zap.Error(err))
		return nil, err
	}
	stats.AfDataApplicationOfflineRejectCount = offlineRejectCount

	log.WithContext(ctx).Info("GetStatusStatistics success",
		zap.String("serviceType", serviceType),
		zap.Int64("serviceCount", stats.ServiceCount),
		zap.Int64("publishedCount", stats.PublishedCount),
		zap.Int64("unpublishedCount", stats.UnpublishedCount),
		zap.Int64("notlineCount", stats.NotlineCount),
		zap.Int64("onlineCount", stats.OnLineCount),
		zap.Int64("offlineCount", stats.OfflineCount),
		zap.Int64("publishAuditingCount", stats.AfDataApplicationPublishAuditingCount),
		zap.Int64("publishRejectCount", stats.AfDataApplicationPublishRejectCount),
		zap.Int64("publishPassCount", stats.AfDataApplicationPublishPassCount),
		zap.Int64("onlineAuditingCount", stats.AfDataApplicationOnlineAuditingCount),
		zap.Int64("onlinePassCount", stats.AfDataApplicationOnlinePassCount),
		zap.Int64("onlineRejectCount", stats.AfDataApplicationOnlineRejectCount),
		zap.Int64("offlineAuditingCount", stats.AfDataApplicationOfflineAuditingCount),
		zap.Int64("offlinePassCount", stats.AfDataApplicationOfflinePassCount),
		zap.Int64("offlineRejectCount", stats.AfDataApplicationOfflineRejectCount))

	return stats, nil
}

// GetDepartmentStatistics 获取部门统计
func (r *serviceRepo) GetDepartmentStatistics(ctx context.Context, top int) ([]*DepartmentStatisticsResult, error) {
	var results []*DepartmentStatisticsResult

	// 构建基础查询，排除department_id为null或空字符串的数据
	tx := r.data.DB.WithContext(ctx).Model(&model.Service{}).Where("delete_time = 0 AND (is_changed = '0' OR is_changed = '')").
		Where("department_id IS NOT NULL AND department_id != ''"). // 排除department_id为null或空字符串的数据
		Select("department_id, department_name, COUNT(*) as total_count, SUM(CASE WHEN publish_status = 'published' THEN 1 ELSE 0 END) as published_count").
		Group("department_id, department_name").
		Order("published_count DESC, total_count DESC") // 按已发布数量降序，再按总数降序

	// 如果 top > 0，则设置限制
	if top > 0 {
		tx = tx.Limit(top)
	}

	err := tx.Find(&results).Error
	if err != nil {
		log.WithContext(ctx).Error("GetDepartmentStatistics", zap.Error(err))
		return nil, err
	}

	log.WithContext(ctx).Info("GetDepartmentStatistics success",
		zap.Int("top", top),
		zap.Int("resultCount", len(results)))

	return results, nil
}

// uniqueCategoryInfo 对CategoryInfo切片按CategoryId去重
func uniqueCategoryInfo(categoryInfos []dto.CategoryInfo) []dto.CategoryInfo {
	seen := make(map[string]bool)
	result := make([]dto.CategoryInfo, 0)

	for _, category := range categoryInfos {
		if !seen[category.CategoryId] {
			seen[category.CategoryId] = true
			result = append(result, category)
		}
	}

	return result
}

// 更新服务回调信息
func (r *serviceRepo) UpdateServiceCallbackInfo(ctx context.Context, serviceID string, updateData map[string]interface{}) error {
	err := r.data.DB.WithContext(ctx).Model(&model.Service{}).
		Where("service_id = ?", serviceID).
		Updates(updateData).Error
	if err != nil {
		log.WithContext(ctx).Error("UpdateServiceCallbackInfo", zap.Error(err))
		return err
	}
	return nil
}

// 服务同步回调
func (r *serviceRepo) ServiceSyncCallback(ctx context.Context, serviceID string) (*ServiceSyncCallbackRes, error) {
	var result *ServiceSyncCallbackRes

	// 使用数据库事务来确保原子性操作
	err := r.data.DB.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		// 1. 在事务中重新获取当前记录的最新状态
		var service model.Service
		if err := tx.Scopes(Undeleted()).
			Where("service_id = ?", serviceID).
			First(&service).Error; err != nil {
			log.WithContext(ctx).Error("ServiceSyncCallback get service failed", zap.String("serviceID", serviceID), zap.Error(err))
			return err
		}

		// 2. 判断当前 service 的 sync_flag 字段是不是 "success"
		syncFlag := util.PtrToValue(service.SyncFlag)
		if syncFlag == "success" {
			// 如果是 success，直接返回
			result = &ServiceSyncCallbackRes{
				Result: syncFlag,
				Msg:    util.PtrToValue(service.SyncMsg),
			}
			return nil
		}

		// 3. 如果不是 success，先尝试更新状态为 "syncing" 来防止重复执行
		// 使用乐观锁：只有当 sync_flag 不是 "success" 时才更新
		updateResult := tx.Model(&model.Service{}).
			Where("service_id = ? AND (sync_flag IS NULL OR sync_flag != ?)", serviceID, "success").
			Updates(map[string]interface{}{
				"sync_flag": "syncing",
				"sync_msg":  "正在同步中...",
			})

		if updateResult.Error != nil {
			log.WithContext(ctx).Error("ServiceSyncCallback update syncing status failed", zap.String("serviceID", serviceID), zap.Error(updateResult.Error))
			return updateResult.Error
		}

		// 4. 检查是否有记录被更新，如果没有说明已经被其他进程处理了
		if updateResult.RowsAffected == 0 {
			// 重新查询最新状态
			if err := tx.Scopes(Undeleted()).
				Where("service_id = ?", serviceID).
				First(&service).Error; err != nil {
				log.WithContext(ctx).Error("ServiceSyncCallback re-get service failed", zap.String("serviceID", serviceID), zap.Error(err))
				return err
			}

			// 返回当前状态
			result = &ServiceSyncCallbackRes{
				Result: util.PtrToValue(service.SyncFlag),
				Msg:    util.PtrToValue(service.SyncMsg),
			}
			return nil
		}

		// 5. 调用 OnCreateService 完成回调事件
		if r.callback != nil {

			// 调用回调
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
			serviceCallback, callbackErr := r.callback.UserServiceV1().UserService().Create(ctx, &callback_register.CreateRequest{
				PaasId:        util.PtrToValue(service.PaasID),
				SvcId:         service.ServiceID,
				SvcName:       service.ServiceName,
				TargetPath:    targetPath,
				PubPath:       constant.CallbackPrePath + "/" + util.PtrToValue(service.PaasID) + targetPath,
				TargetIsHttps: true,
				Description:   util.PtrToValue(service.Description),
				SvcCode:       service.ServiceCode,
				IsOldSvc:      IsOldSvc,
			})
			if callbackErr != nil {
				log.WithContext(ctx).Error("ServiceSyncCallback callback failed", zap.String("serviceID", serviceID), zap.Error(callbackErr))
				// 更新失败状态
				updateData := map[string]interface{}{
					"sync_flag": "fail",
					"sync_msg":  callbackErr.Error(),
				}
				if updateErr := tx.Model(&model.Service{}).
					Where("service_id = ?", serviceID).
					Updates(updateData).Error; updateErr != nil {
					log.WithContext(ctx).Error("ServiceSyncCallback update fail status failed", zap.String("serviceID", serviceID), zap.Error(updateErr))
				}
				result = &ServiceSyncCallbackRes{
					Result: "fail",
					Msg:    callbackErr.Error(),
				}
				return nil
			}

			// 6. 在事务中保存回调结果
			updateData := map[string]interface{}{
				"sync_flag": serviceCallback.SyncFlag,
				"sync_msg":  serviceCallback.Msg,
			}
			if updateErr := tx.Model(&model.Service{}).
				Where("service_id = ?", serviceID).
				Updates(updateData).Error; updateErr != nil {
				log.WithContext(ctx).Error("ServiceSyncCallback update callback info failed", zap.String("serviceID", serviceID), zap.Error(updateErr))
				return updateErr
			}

			// 7. 返回 result = sync_flag, msg = sync_msg
			result = &ServiceSyncCallbackRes{
				Result: serviceCallback.SyncFlag,
				Msg:    serviceCallback.Msg,
			}
			return nil
		}

		// 如果没有 callback，更新失败状态并返回错误
		updateData := map[string]interface{}{
			"sync_flag": "fail",
			"sync_msg":  "callback not available",
		}
		if updateErr := tx.Model(&model.Service{}).
			Where("service_id = ?", serviceID).
			Updates(updateData).Error; updateErr != nil {
			log.WithContext(ctx).Error("ServiceSyncCallback update fail status failed", zap.String("serviceID", serviceID), zap.Error(updateErr))
		}

		result = &ServiceSyncCallbackRes{
			Result: "fail",
			Msg:    "callback not available",
		}
		return nil
	})

	if err != nil {
		return nil, err
	}

	return result, nil
}

// 通过接口ID列表获取接口列表
func (r *serviceRepo) GetServicesByIDs(ctx context.Context, ids []string) (res []*dto.ServiceInfoAndDraftFlag, err error) {
	if len(ids) == 0 {
		return []*dto.ServiceInfoAndDraftFlag{}, nil
	}

	tx := r.data.DB.WithContext(ctx).Model(&model.Service{}).Scopes(Undeleted(), UnChanged()).
		Where("service_id IN ?", ids)

	var services []*model.ServiceAssociations
	tx = tx.Preload("ServiceDataSource", "delete_time = 0").
		Find(&services)
	if tx.Error != nil {
		log.WithContext(ctx).Error("GetServicesByIDs", zap.Error(tx.Error))
		return nil, tx.Error
	}

	// 添加 nil 检查，确保 services 不为 nil
	if services == nil {
		services = []*model.ServiceAssociations{}
	}

	res = []*dto.ServiceInfoAndDraftFlag{}

	serviceIDs := make([]string, 0, len(services))
	for _, s := range services {
		serviceIDs = append(serviceIDs, s.ServiceID)
	}
	batchCheckDraftServices, err := r.batchCheckDraftServices(ctx, serviceIDs)
	if err != nil {
		log.WithContext(ctx).Error("GetServicesByIDs batchCheckDraftServices failed", zap.Error(err))
		return nil, err
	}
	for _, s := range services {
		exist := batchCheckDraftServices[s.ServiceID]
		if err != nil {
			log.WithContext(ctx).Error("GetServicesByIDs", zap.Error(err))
			return nil, err
		}

		// 主题域、组织架构改成实时查询，对应服务调不通或数据被删ID不存在时，返回空，不影响接口响应
		if s.SubjectDomainID != "" {
			dataSubjectInfo, err := r.DataSubjectRepo.DataSubjectGet(ctx, s.SubjectDomainID)
			if err != nil {
				s.SubjectDomainName = ""
			} else {
				s.SubjectDomainName = dataSubjectInfo.PathName
			}
		}
		// if s.DepartmentID != "" {
		// 	departmentInfo, err := r.configurationCenterRepo.DepartmentGet(ctx, s.DepartmentID)
		// 	if err != nil {
		// 		s.DepartmentName = ""
		// 	} else {
		// 		s.DepartmentName = departmentInfo.Path
		// 	}
		// }

		owners := []dto.Owners{}
		if s.OwnerID != "" && s.OwnerName != "" {
			ownerIDs := strings.Split(s.OwnerID, ",")
			ownerNames := strings.Split(s.OwnerName, ",")
			for i := 0; i < len(ownerIDs); i++ {
				if i < len(ownerNames) && strings.TrimSpace(ownerIDs[i]) != "" {
					owners = append(owners, dto.Owners{
						OwnerId:   ownerIDs[i],
						OwnerName: ownerNames[i],
					})
				}
			}
		}

		serviceInfo := &dto.ServiceInfoAndDraftFlag{
			ServiceInfo: dto.ServiceInfo{
				ServiceID:          s.ServiceID,
				ServiceCode:        s.ServiceCode,
				PublishStatus:      s.PublishStatus,
				Status:             s.Status,
				AuditType:          s.AuditType,
				AuditStatus:        s.AuditStatus,
				AuditAdvice:        s.AuditAdvice,
				OnlineAuditAdvice:  s.OnlineAuditAdvice,
				SubjectDomainId:    s.SubjectDomainID,
				SubjectDomainName:  s.SubjectDomainName,
				ServiceType:        s.ServiceType,
				ServiceName:        s.ServiceName,
				Department:         dto.Department{ID: s.DepartmentID, Name: s.DepartmentName},
				SyncFlag:           util.PtrToValue(s.SyncFlag),
				SyncMsg:            util.PtrToValue(s.SyncMsg),
				UpdateFlag:         util.PtrToValue(s.UpdateFlag),
				UpdateMsg:          util.PtrToValue(s.UpdateMsg),
				Owners:             owners,
				ServicePath:        s.ServicePath,
				BackendServiceHost: s.BackendServiceHost,
				BackendServicePath: s.BackendServicePath,
				HTTPMethod:         s.HTTPMethod,
				ReturnType:         s.ReturnType,
				Protocol:           s.Protocol,
				Description:        util.PtrToValue(s.Description),
				Developer:          dto.Developer{ID: s.DeveloperID},
				RateLimiting:       int64(s.RateLimiting),
				Timeout:            int64(s.Timeout),
				PublishTime:        util.TimeFormat(s.PublishTime),
				OnlineTime:         util.TimeFormat(s.OnlineTime),
				CreateTime:         util.TimeFormat(&s.CreateTime),
				UpdateTime:         util.TimeFormat(&s.UpdateTime),
			},
			HasDraft: exist,
		}

		// 联调修改：变更审核中、变更审核未通过的时候，返回的id仍然是已发布版本的id
		if s.PublishStatus == enum.PublishStatusChangeAuditing || s.PublishStatus == enum.PublishStatusChangeReject {
			serviceInfo.ServiceID = s.ChangedServiceId
		}

		res = append(res, serviceInfo)
	}

	return
}

// 处理回调事件
func (r *serviceRepo) HandleCallbackEvent(ctx context.Context, serviceID string) error {
	if r.callback == nil {
		return nil
	}

	// 获取完整的 service 信息用于回调
	serviceInfo, err := r.ServiceGet(ctx, serviceID)
	if err != nil {
		log.WithContext(ctx).Error("HandleCallbackEvent get service for callback", zap.Error(err))
		return err
	}

	// 根据 SyncFlag 决定调用哪个回调方法
	if serviceInfo.ServiceInfo.SyncFlag == "" || serviceInfo.ServiceInfo.SyncFlag == "fail" {
		// 调用 OnCreateService 完成回调事件
		var targetPath string
		if serviceInfo.ServiceInfo.PrePath != "" {
			targetPath = serviceInfo.ServiceInfo.PrePath + serviceInfo.ServiceInfo.ServicePath
		} else {
			targetPath = serviceInfo.ServiceInfo.ServicePath
		}
		var IsOldSvc bool
		if serviceInfo.ServiceInfo.SourceType == 1 {
			IsOldSvc = true
		} else {
			IsOldSvc = false
		}
		serviceCallback, callbackErr := r.callback.UserServiceV1().UserService().Create(ctx, &callback_register.CreateRequest{
			PaasId:        serviceInfo.ServiceInfo.PaasID,
			SvcId:         serviceInfo.ServiceInfo.ServiceID,
			SvcName:       serviceInfo.ServiceInfo.ServiceName,
			TargetPath:    targetPath,
			PubPath:       constant.CallbackPrePath + "/" + serviceInfo.ServiceInfo.PaasID + targetPath,
			TargetIsHttps: true,
			Description:   serviceInfo.ServiceInfo.Description,
			SvcCode:       serviceInfo.ServiceInfo.ServiceCode,
			IsOldSvc:      IsOldSvc,
		})
		if callbackErr != nil {
			log.WithContext(ctx).Error("HandleCallbackEvent callback OnCreateService failed",
				zap.String("serviceID", serviceID), zap.Error(callbackErr))
			return callbackErr
		} else {
			// 记录回调结果到数据库
			updateData := map[string]interface{}{
				"sync_flag": serviceCallback.SyncFlag,
				"sync_msg":  serviceCallback.Msg,
			}
			if updateErr := r.UpdateServiceCallbackInfo(ctx, serviceID, updateData); updateErr != nil {
				log.WithContext(ctx).Error("HandleCallbackEvent update callback info failed",
					zap.String("serviceID", serviceID), zap.Error(updateErr))
				return updateErr
			}
		}
	} else {
		// 调用 OnUpdateService 完成回调事件
		var targetPath string
		if serviceInfo.ServiceInfo.PrePath != "" {
			targetPath = serviceInfo.ServiceInfo.PrePath + serviceInfo.ServiceInfo.ServicePath
		} else {
			targetPath = serviceInfo.ServiceInfo.ServicePath
		}
		var IsOldSvc bool
		if serviceInfo.ServiceInfo.SourceType == 1 {
			IsOldSvc = true
		} else {
			IsOldSvc = false
		}

		serviceCallback, callbackErr := r.callback.UserServiceV1().UserService().Update(ctx, &callback_register.UpdateRequest{
			PaasId:        serviceInfo.ServiceInfo.PaasID,
			SvcId:         serviceInfo.ServiceInfo.ServiceID,
			SvcName:       serviceInfo.ServiceInfo.ServiceName,
			TargetPath:    targetPath,
			PubPath:       constant.CallbackPrePath + "/" + serviceInfo.ServiceInfo.PaasID + targetPath,
			TargetIsHttps: true,
			Description:   serviceInfo.ServiceInfo.Description,
			SvcCode:       serviceInfo.ServiceInfo.ServiceCode,
			IsOldSvc:      IsOldSvc,
		})
		if callbackErr != nil {
			log.WithContext(ctx).Error("HandleCallbackEvent callback OnUpdateService failed",
				zap.String("serviceID", serviceID), zap.Error(callbackErr))
			return callbackErr
		} else {
			// 记录回调结果到数据库
			updateData := map[string]interface{}{
				"update_flag": serviceCallback.SyncFlag,
				"update_msg":  serviceCallback.Msg,
			}
			if updateErr := r.UpdateServiceCallbackInfo(ctx, serviceID, updateData); updateErr != nil {
				log.WithContext(ctx).Error("HandleCallbackEvent update callback info failed",
					zap.String("serviceID", serviceID), zap.Error(updateErr))
				return updateErr
			}
		}
	}

	return nil
}
