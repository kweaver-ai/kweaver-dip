package domain

import (
	"context"

	"go.uber.org/zap"

	"github.com/kweaver-ai/dsg/services/apps/data-application-service/adapter/driven/gorm"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/adapter/driven/microservice"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/common/dto"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/common/enum"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/common/util"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/trace"
)

type ServiceApplyDomain struct {
	appRepo                 gorm.AppRepo
	applyRepo               gorm.ServiceApplyRepo
	statsRepo               gorm.ServiceStatsRepo
	serviceRepo             gorm.ServiceRepo
	serviceGatewayRepo      gorm.ServiceGatewayRepo
	configurationCenterRepo microservice.ConfigurationCenterRepo
	auditProcessBindRepo    gorm.AuditProcessBindRepo
	workflowRestRepo        microservice.WorkflowRestRepo
	authServiceRepo         microservice.AuthServiceRepo
	dataSubjectRepo         microservice.DataSubjectRepo
}

func NewServiceApplyDomain(
	appRepo gorm.AppRepo,
	applyRepo gorm.ServiceApplyRepo,
	statsRepo gorm.ServiceStatsRepo,
	serviceRepo gorm.ServiceRepo,
	serviceGatewayRepo gorm.ServiceGatewayRepo,
	configurationCenterRepo microservice.ConfigurationCenterRepo,
	auditProcessBindRepo gorm.AuditProcessBindRepo,
	workflowRestRepo microservice.WorkflowRestRepo,
	authServiceRepo microservice.AuthServiceRepo,
	dataSubjectRepo microservice.DataSubjectRepo,
) *ServiceApplyDomain {
	return &ServiceApplyDomain{
		appRepo:                 appRepo,
		applyRepo:               applyRepo,
		statsRepo:               statsRepo,
		serviceRepo:             serviceRepo,
		serviceGatewayRepo:      serviceGatewayRepo,
		configurationCenterRepo: configurationCenterRepo,
		auditProcessBindRepo:    auditProcessBindRepo,
		workflowRestRepo:        workflowRestRepo,
		authServiceRepo:         authServiceRepo,
		dataSubjectRepo:         dataSubjectRepo,
	}
}

func (d *ServiceApplyDomain) ServiceApplyList(c context.Context, req *dto.ServiceApplyListReq) (res *dto.ServiceApplyListRes, err error) {
	list, count, err := d.applyRepo.List(c, req)
	if err != nil {
		return nil, err
	}

	var entries []*dto.ServiceApply
	for _, apply := range list {
		entry := &dto.ServiceApply{
			ApplyId:       apply.ApplyID,
			ServiceID:     apply.ServiceID,
			ServiceName:   apply.Service.ServiceName,
			ServiceStatus: apply.Service.Status,
			OrgCode:       apply.Service.DepartmentID,
			OrgName:       apply.Service.DepartmentName,
			OwnerId:       apply.Service.OwnerID,
			OwnerName:     apply.Service.OwnerName,
			ApplyDays:     apply.ApplyDays,
			ApplyReason:   apply.ApplyReason,
			AuditStatus:   apply.AuditStatus,
			AuthTime:      util.TimeFormat(apply.AuthTime),
			ExpiredTime:   util.TimeFormat(apply.ExpiredTime),
			CreateTime:    util.TimeFormat(&apply.CreateTime),
			UpdateTime:    util.TimeFormat(&apply.UpdateTime),
		}

		entries = append(entries, entry)
	}

	res = &dto.ServiceApplyListRes{
		PageResult: dto.PageResult[dto.ServiceApply]{
			TotalCount: count,
			Entries:    entries,
		},
	}

	return res, nil
}

func (d *ServiceApplyDomain) ServiceApplyCreate(c context.Context, req *dto.ServiceApplyCreateReq) (err error) {
	exist, err := d.serviceRepo.IsServiceIDExist(c, req.ServiceID)
	if err != nil {
		return errorcode.Detail(errorcode.PublicDatabaseError, err)
	}
	if !exist {
		return errorcode.Detail(errorcode.ServiceIDNotExist, err)
	}

	// 查询是否为xx数据局项目
	cssjj, err := d.configurationCenterRepo.GetConfigValue(c, microservice.ConfigValueKeyCSSJJ)
	if err != nil {
		log.Error("ServiceApplyCreate --> 查询xx数据局出错：", zap.Error(err))
		return err
	}

	//检查接口是否存在 只看已发布的接口
	config, err := d.configurationCenterRepo.GetDataResourceDirectoryConfigInfo(c)
	if err != nil {
		log.Error("Available --> 查询启用数据资源管理方式配置出错：", zap.Error(err))
		return err
	}
	isEnable := config.Using == 1

	if cssjj.Value == microservice.ConfigValueValueTrue {
		// xx数据局项目，无论是否启用数据资源目录，都支持接口上下线
		exist, err = d.serviceRepo.IsServiceIDStatusExist(c, req.ServiceID, enum.LineStatusOnLine)
	} else if isEnable {
		//启用数据资源目录
		exist, err = d.serviceRepo.IsServiceIDPublishStatusExist(c, req.ServiceID, enum.PublishStatusPublished)
	} else {
		exist, err = d.serviceRepo.IsServiceIDStatusExist(c, req.ServiceID, enum.LineStatusOnLine)
	}
	if err != nil {
		return errorcode.Detail(errorcode.PublicDatabaseError, err)
	}
	if !exist {
		return errorcode.Detail(errorcode.ServiceUnPublish, err)
	}
	//检查接口是否正在审核中
	exist, err = d.applyRepo.IsAuditing(c, req.ServiceID, util.GetUser(c).Id)
	if err != nil {
		return errorcode.Desc(errorcode.PublicDatabaseError)
	}
	if exist {
		return errorcode.Desc(errorcode.ServiceApplyAuditingExist)
	}

	//检查接口是否已经可用
	exist, err = d.applyRepo.IsAvailable(c, req.ServiceID, util.GetUser(c).Id)
	if err != nil {
		return errorcode.Desc(errorcode.PublicDatabaseError)
	}
	if exist {
		return errorcode.Desc(errorcode.ServiceApplyAvailableExist)
	}

	//检查是否有绑定的审核流程
	process, err := d.auditProcessBindRepo.GetByAuditType(c, enum.AuditTypeRequest)
	if err != nil {
		return errorcode.Detail(errorcode.PublicDatabaseError, err)
	}

	if process.ProcDefKey == "" {
		return errorcode.Desc(errorcode.AuditProcessNotExist)
	}

	if process.ProcDefKey != "" {
		//检查 ProcDefKey 是否正确
		res, err := d.workflowRestRepo.ProcessDefinitionGet(c, process.ProcDefKey)
		if err != nil {
			return errorcode.Desc(errorcode.AuditProcessNotExist)
		}

		if res.Type != process.AuditType {
			return errorcode.Desc(errorcode.AuditProcessNotExist)
		}

		if res.Key != process.ProcDefKey {
			return errorcode.Desc(errorcode.AuditProcessNotExist)
		}
	}

	apply := &model.ServiceApply{
		ID:          uint64(util.GetUniqueID()),
		UID:         util.GetUser(c).Id,
		ServiceID:   req.ServiceID,
		ApplyDays:   *req.ApplyDays,
		ApplyReason: req.ApplyReason,
		ApplyID:     util.GetUniqueString(),
		AuditType:   enum.AuditTypeRequest,
		AuditStatus: enum.AuditStatusAuditing,
		ProcDefKey:  process.ProcDefKey,
	}

	err = d.applyRepo.Create(c, apply)
	if err != nil {
		return errorcode.Desc(errorcode.PublicDatabaseError)
	}

	//增加申请量
	d.statsRepo.IncrApplyNum(c, req.ServiceID)

	return nil
}

func (d *ServiceApplyDomain) GetOwnerAuditors(c context.Context, req *dto.GetOwnerAuditorsReq) (res *dto.GetOwnerAuditorsRes, err error) {
	serviceApplyAssociations, err := d.applyRepo.Get(c, req.ApplyId)
	if err != nil {
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}

	if serviceApplyAssociations.Service.PublishStatus != enum.PublishStatusPublished {
		return nil, errorcode.Desc(errorcode.GetOwnerAuditorsNotAllowed)
	}

	if len(serviceApplyAssociations.Service.OwnerID) == 0 {
		return nil, errorcode.Desc(errorcode.ServiceNoOwner)
	}

	res = &dto.GetOwnerAuditorsRes{
		{
			UserId: serviceApplyAssociations.Service.OwnerID,
		},
	}

	return res, nil
}

func (d *ServiceApplyDomain) Get(c context.Context, req *dto.ServiceApplyGetReq) (res *dto.ServiceApplyGetRes, err error) {
	exist, err := d.applyRepo.IsExist(c, req.ApplyId)
	if err != nil {
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}

	if !exist {
		return nil, errorcode.Detail(errorcode.ServiceApplyIdNotExist, err)
	}

	data, err := d.applyRepo.Get(c, req.ApplyId)
	if err != nil {
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}

	address, err := d.serviceGatewayRepo.GetServiceAddress(c, data.ServiceID)
	if err != nil {
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}

	res = &dto.ServiceApplyGetRes{
		ServiceApply: dto.ServiceApply{
			ApplyId:       data.ApplyID,
			ServiceID:     data.ServiceID,
			ServiceName:   data.Service.ServiceName,
			ServiceStatus: data.Service.Status,
			OrgCode:       data.Service.DepartmentID,
			OrgName:       data.Service.DepartmentName,
			OwnerId:       data.Service.OwnerID,
			OwnerName:     data.Service.OwnerName,
			ApplyDays:     data.ApplyDays,
			ApplyReason:   data.ApplyReason,
			AuditStatus:   data.AuditStatus,
			AuthTime:      util.TimeFormat(data.AuthTime),
			ExpiredTime:   util.TimeFormat(data.ExpiredTime),
			CreateTime:    util.TimeFormat(&data.CreateTime),
			UpdateTime:    util.TimeFormat(&data.UpdateTime),
		},
		ServiceInfo: dto.ServiceFrontendInfo{
			ServiceID:      data.Service.ServiceID,
			ServiceCode:    data.Service.ServiceCode,
			ServiceName:    data.Service.ServiceName,
			ServiceAddress: address,
			ServiceType:    data.Service.ServiceType,
			OrgCode:        data.Service.DepartmentID,
			OrgName:        data.Service.DepartmentName,
			HTTPMethod:     data.Service.HTTPMethod,
		},
	}

	// 申请通过才展示密钥
	if data.AuditStatus == enum.AuditStatusPass {
		res.App = dto.App{
			AppId:     data.App.AppID,
			AppSecret: data.App.AppSecret,
		}
	}

	return res, nil
}

func (d *ServiceApplyDomain) ServiceAuthInfo(c context.Context, req *dto.ServiceAuthInfoReq) (res *dto.ServiceAuthInfoRes, err error) {
	c, span := trace.StartInternalSpan(c)
	defer span.End()

	// 判断用户是否拥有接口服务的权限
	if ok, err := d.enforceService(c, req.ServiceID); err != nil {
		return nil, err
	} else if !ok {
		return nil, errorcode.Desc(errorcode.ServiceApplyNotPass)
	}

	//给用户创建appId和密钥 不应该放在这里 但是没有其他地方可以触发这个逻辑了 先这样了 应该有个app管理功能 todo
	err = d.appRepo.Create(c, util.GetUser(c).Id)
	if err != nil {
		return nil, err
	}

	//获取appId和密钥
	app, err := d.appRepo.GetByUid(c, util.GetUser(c).Id)
	if err != nil {
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}

	address, err := d.serviceGatewayRepo.GetServiceAddress(c, req.ServiceID)
	if err != nil {
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}

	res = &dto.ServiceAuthInfoRes{
		ServiceAddress: address,
		AppId:          app.AppID,
		AppSecret:      app.AppSecret,
	}

	return
}

func (d *ServiceApplyDomain) AvailableAssetsList(c context.Context, req *dto.AvailableAssetsListReq) (res *dto.AvailableAssetsListRes, err error) {
	if req.OrgCode != "" {
		exist, err := d.configurationCenterRepo.IsDepartmentExist(c, req.OrgCode)
		if err != nil {
			return nil, errorcode.Detail(errorcode.OrgCodeNotExist, err)
		}
		if !exist {
			return nil, errorcode.Detail(errorcode.OrgCodeNotExist, err)
		}
	}

	// 检查主题域是否存在
	if req.SubjectDomainID != "" && req.SubjectDomainID != enum.ServiceUncategory {
		if _, err := d.dataSubjectRepo.DataSubjectGet(c, req.SubjectDomainID); err != nil {
			return nil, errorcode.Detail(errorcode.SubjectDomainNotExist, err.Error())
		}
	}

	data, count, err := d.applyRepo.Available(c, req)
	if err != nil {
		return nil, err
	}

	var entries []*dto.AvailableAssets
	for _, item := range data {
		entry := &dto.AvailableAssets{
			ServiceID:         item.ServiceID,
			ServiceCode:       item.ServiceCode,
			ServiceName:       item.ServiceName,
			OrgCode:           item.DepartmentID,
			OrgName:           item.DepartmentName,
			SubjectDomainID:   item.SubjectDomainID,
			SubjectDomainName: item.SubjectDomainName,
			OwnerId:           item.OwnerID,
			OwnerName:         item.OwnerName,
			Description:       *item.Description,
			OnlineTime:        util.TimeFormat(item.OnlineTime),
			Policies:          item.Policies,
		}

		entries = append(entries, entry)
	}

	res = &dto.AvailableAssetsListRes{
		PageResult: dto.PageResult[dto.AvailableAssets]{
			TotalCount: count,
			Entries:    entries,
		},
	}

	return
}

// enforceService 验证当前用户是否有指定接口服务的权限。
//
//	满足下列权限之一，则认为有权限
//	 1. 用户是接口服务的 Owner
//	 2. 通过 basic-search 鉴权
func (d *ServiceApplyDomain) enforceService(ctx context.Context, id string) (bool, error) {
	ctx, span := trace.StartInternalSpan(ctx)
	defer span.End()

	log := log.WithContext(ctx)

	// 当前用户的 ID
	var userID = util.GetUser(ctx).Id
	// 当前用户的 ID 为空，认为没有权限
	if userID == "" {
		log.Debug("context doesn't contain user info")
		return false, nil
	}

	// 从数据库获取指定的接口服务
	svc, err := d.serviceRepo.ServiceGet(ctx, id)
	if err != nil {
		return false, err
	}

	// 用户是接口服务的 Owner，认为有权限
	if svc.ServiceInfo.OwnerId == userID {
		log.Debug("user is the owner of the api", zap.String("userID", userID), zap.Any("apiService", svc))
		return true, nil
	}

	//用户是否有接口调用权限
	enforce := microservice.Enforce{
		Action:      "read",
		ObjectId:    id,
		ObjectType:  "api",
		SubjectId:   userID,
		SubjectType: "user",
	}
	enforces, err := d.authServiceRepo.Enforce(ctx, []microservice.Enforce{enforce})
	if err != nil {
		return false, err
	}
	for _, e := range enforces {
		if e {
			return true, nil
		}
	}

	return false, errorcode.Desc(errorcode.ServiceApplyNotPass)
}
