package domain

import (
	"context"
	"fmt"
	"io"
	"strings"
	"sync"
	"time"

	auth_service_v1 "github.com/kweaver-ai/idrm-go-common/api/auth-service/v1"
	"github.com/kweaver-ai/idrm-go-common/rest/authorization"

	auth_service "github.com/kweaver-ai/idrm-go-common/rest/auth-service"
	"github.com/kweaver-ai/idrm-go-common/rest/configuration_center"
	"github.com/kweaver-ai/idrm-go-common/rest/data_catalog"
	"github.com/kweaver-ai/idrm-go-common/rest/user_management"
	"github.com/kweaver-ai/idrm-go-common/util/clock"
	"github.com/samber/lo"

	"github.com/blastrain/vitess-sqlparser/sqlparser"
	"github.com/valyala/fasttemplate"
	"go.uber.org/zap"

	"github.com/kweaver-ai/dsg/services/apps/data-application-service/adapter/driven/gorm"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/adapter/driven/microservice"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/adapter/driven/mq"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/common/dto"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/common/enum"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/common/form_validator"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/common/util"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/infrastructure/repository/db/model"
	v1 "github.com/kweaver-ai/idrm-go-common/api/data_application_service/v1"
	driven "github.com/kweaver-ai/idrm-go-common/rest/data_application_service"
	"github.com/kweaver-ai/idrm-go-common/workflow"
	"github.com/kweaver-ai/idrm-go-common/workflow/common"
	"github.com/kweaver-ai/idrm-go-frame/core/errorx/agcodes"
	"github.com/kweaver-ai/idrm-go-frame/core/errorx/agerrors"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/trace"
)

var (
	lock   sync.Mutex
	wheres = make(map[string]string) // sql where 语句, map 格式为 字段名:操作符
)

type ServiceDomain struct {
	// 时钟，便于测试
	clock                   clock.PassiveClock
	serviceRepo             gorm.ServiceRepo
	serviceStatsRepo        gorm.ServiceStatsRepo
	dataCatalogRepo         microservice.DataCatalogRepo
	dataViewRepo            microservice.DataViewRepo
	virtualEngine           microservice.VirtualEngineRepo
	configurationCenterRepo microservice.ConfigurationCenterRepo
	developerRepo           gorm.DeveloperRepo
	auditProcessBindRepo    gorm.AuditProcessBindRepo
	workflowRestRepo        microservice.WorkflowRestRepo
	basicSearchRepo         microservice.BasicSearchRepo
	serviceApplyRepo        gorm.ServiceApplyRepo
	DataSubjectRepo         microservice.DataSubjectRepo
	AuthServiceRepo         microservice.AuthServiceRepo
	wf                      workflow.WorkflowInterface
	// user-management 客户端
	UserManagementRepo        microservice.UserManagementRepo
	drivenAuthService         auth_service.AuthServiceV1Interface
	subServiceRepo            gorm.SubServiceRepo
	drivenAuthServiceInternal auth_service.AuthServiceInternalV1Interface
	dataCatalogV1             data_catalog.Driven
	userMgnt                  user_management.DrivenUserMgnt
	deployMgmRepo             microservice.DrivenDeployMgm
	configurationCenterDriven configuration_center.Driven
	authorizationDriven       authorization.Driven
}

func NewServiceDomain(
	serviceRepo gorm.ServiceRepo,
	serviceStatsRepo gorm.ServiceStatsRepo,
	dataCatalogRepo microservice.DataCatalogRepo,
	dataViewRepo microservice.DataViewRepo,
	virtualEngine microservice.VirtualEngineRepo,
	configurationCenterRepo microservice.ConfigurationCenterRepo,
	developerRepo gorm.DeveloperRepo,
	auditProcessBindRepo gorm.AuditProcessBindRepo,
	workflowRestRepo microservice.WorkflowRestRepo,
	basicSearchRepo microservice.BasicSearchRepo,
	serviceApplyRepo gorm.ServiceApplyRepo,
	DataSubjectRepo microservice.DataSubjectRepo,
	AuthServiceRepo microservice.AuthServiceRepo,
	wf workflow.WorkflowInterface,
	// user-management 客户端
	userManagementRepo microservice.UserManagementRepo,
	dataCatalogV1 data_catalog.Driven,
	userMgnt user_management.DrivenUserMgnt,
	drivenAuthService auth_service.AuthServiceV1Interface,
	subServiceRepo gorm.SubServiceRepo,
	drivenAuthServiceInternal auth_service.AuthServiceInternalV1Interface,
	deployMgmRepo microservice.DrivenDeployMgm,
	configurationCenterDriven configuration_center.Driven,
	authorizationDriven authorization.Driven,
) *ServiceDomain {
	return &ServiceDomain{
		clock:                   clock.RealClock{},
		serviceRepo:             serviceRepo,
		serviceStatsRepo:        serviceStatsRepo,
		dataCatalogRepo:         dataCatalogRepo,
		dataViewRepo:            dataViewRepo,
		virtualEngine:           virtualEngine,
		configurationCenterRepo: configurationCenterRepo,
		developerRepo:           developerRepo,
		auditProcessBindRepo:    auditProcessBindRepo,
		workflowRestRepo:        workflowRestRepo,
		basicSearchRepo:         basicSearchRepo,
		serviceApplyRepo:        serviceApplyRepo,
		DataSubjectRepo:         DataSubjectRepo,
		AuthServiceRepo:         AuthServiceRepo,
		wf:                      wf,
		// user-management 客户端
		UserManagementRepo:        userManagementRepo,
		dataCatalogV1:             dataCatalogV1,
		userMgnt:                  userMgnt,
		drivenAuthService:         drivenAuthService,
		subServiceRepo:            subServiceRepo,
		drivenAuthServiceInternal: drivenAuthServiceInternal,
		deployMgmRepo:             deployMgmRepo,
		configurationCenterDriven: configurationCenterDriven,
		authorizationDriven:       authorizationDriven,
	}
}

func (u *ServiceDomain) ServiceCreate(ctx context.Context, req *dto.ServiceCreateOrTempReq) (res *dto.ServiceCreateRes, err error) {
	if !req.IsTemp {
		err = u.serviceCheckParam(ctx, req.ServiceInfo, req.ServiceParam)
		req.ServiceInfo.PublishStatus = enum.PublishStatusPubAuditing
		req.ServiceInfo.AuditType = enum.AuditTypePublish
	} else {
		req.ServiceInfo.PublishStatus = enum.PublishStatusUnPublished
		req.ServiceInfo.AuditType = enum.AuditTypeUnpublished
	}
	if err != nil {
		return nil, err
	}

	if req.ServiceParam.CreateModel == "script" {
		_, err := u.CheckScript(ctx, req.ServiceParam.Script)
		if err != nil {
			return nil, err
		}
	}

	if req.ServiceParam.CreateModel == "wizard" {
		req.ServiceParam.Script = ""
	}

	if req.ServiceInfo.Timeout == 0 {
		req.ServiceInfo.Timeout = 60
	}

	res, err = u.serviceRepo.ServiceCreate(ctx, req, true)
	if err != nil {
		return nil, err
	}

	// 创建 service 记录后，调用 OnCreateService 完成回调事件，并记录回调结果
	// if u.callback != nil {
	// 	// 获取完整的 service 信息用于回调
	// 	service, err := u.serviceRepo.ServiceGet(ctx, res.ServiceID)
	// 	if err != nil {
	// 		log.WithContext(ctx).Error("ServiceCreate get service for callback", zap.Error(err))
	// 	} else {
	// 		// 转换为 model.Service 格式
	// 		serviceModel := &model.Service{
	// 			ServiceID:   service.ServiceInfo.ServiceID,
	// 			ServiceName: service.ServiceInfo.ServiceName,
	// 			ServicePath: service.ServiceInfo.ServicePath,
	// 			Description: &service.ServiceInfo.Description,
	// 			AppsID:      &service.ServiceInfo.AppsId,
	// 		}

	// 		// 调用回调
	// 		serviceCallback, callbackErr := u.callback.OnCreateService(ctx, serviceModel)
	// 		if callbackErr != nil {
	// 			log.WithContext(ctx).Error("ServiceCreate callback OnCreateService failed",
	// 				zap.String("serviceID", res.ServiceID), zap.Error(callbackErr))
	// 		} else {
	// 			// 记录回调结果到数据库
	// 			if serviceCallback != nil && serviceCallback.SyncFlag != nil {
	// 				updateData := map[string]interface{}{
	// 					"sync_flag": serviceCallback.SyncFlag,
	// 					"sync_msg":  serviceCallback.SyncMsg,
	// 					"sync_type": serviceCallback.SyncType,
	// 				}
	// 				if updateErr := u.serviceRepo.UpdateServiceCallbackInfo(ctx, res.ServiceID, updateData); updateErr != nil {
	// 					log.WithContext(ctx).Error("ServiceCreate update callback info failed",
	// 						zap.String("serviceID", res.ServiceID), zap.Error(updateErr))
	// 				}
	// 			}
	// 		}
	// 	}
	// }

	// 记录审计日志：生成、注册接口
	u.auditLogCreate(ctx, res.ServiceID, &req.ServiceInfo)

	return res, err
}

func (u *ServiceDomain) ServiceList(ctx context.Context, req *dto.ServiceListReq) (res *dto.ServiceListRes, err error) {
	//ctx, span := trace.StartInternalSpan(ctx)
	//defer func() { trace.TelemetrySpanEnd(span, err) }()

	//查询下用户的可授权的接口服务ID
	//if req.IsAuthed {
	//	if err = u.authedServiceID(ctx, req); err != nil {
	//		return nil, errorcode.AuthServiceError.Desc(err.Error())
	//	}
	//}

	serviceList, count, err := u.serviceRepo.ServiceList(ctx, req)
	if err != nil {
		return nil, err
	}

	res = &dto.ServiceListRes{
		PageResult: dto.PageResult[dto.ServiceInfoAndDraftFlag]{
			Entries:    serviceList,
			TotalCount: count,
		},
	}

	return
}

func (u *ServiceDomain) ServiceGet(ctx context.Context, req *dto.ServiceGetReq) (res *dto.ServiceGetRes, err error) {
	res, err = u.serviceRepo.ServiceGet(ctx, req.ServiceID)
	if err != nil {
		return nil, err
	}

	return res, nil
}

func (u *ServiceDomain) ServiceGetFrontend(ctx context.Context, req *dto.ServiceGetReq) (res *dto.ServiceGetFrontendRes, err error) {
	ctx, span := trace.StartInternalSpan(ctx)
	defer func() { trace.TelemetrySpanEnd(span, err) }()

	log := log.WithContext(ctx)

	exist, err := u.serviceRepo.IsServiceIDExist(ctx, req.ServiceID)
	if err != nil {
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}
	if !exist {
		return nil, errorcode.Detail(errorcode.ServiceIDNotExist, err)
	}
	//查看当前登录用户的角色
	userInfo := util.GetUser(ctx)
	// 检查申请者是否是内置角色
	innerRoles, err := u.authorizationDriven.HasInnerBusinessRoles(ctx, userInfo.Id)
	if err != nil {
		return nil, err
	}
	hasRole := len(innerRoles) > 0
	//不是内部角色的，不允许查看所有资源
	if !hasRole {
		// 判断是否为xx数据局项目
		cssjj, err := u.IsCSSJJ(ctx)
		if err != nil {
			return nil, err
		}

		isEnable, err := u.IsEnableResourceDirectory(ctx)
		if err != nil {
			log.Error("ServiceGetFrontend --> 查询启用数据资源管理方式配置出错：", zap.Error(err))
			return nil, err
		}

		if cssjj {
			// xx数据局项目，无论是否启用数据资源目录，都支持接口上下线
			exist, err = u.serviceRepo.IsServiceIDInStatusesExist(ctx, req.ServiceID, enum.ConsideredAsOnlineStatuses)
		} else if isEnable {
			//启用数据资源目录
			exist, err = u.serviceRepo.IsServiceIDPublishStatusExist(ctx, req.ServiceID, enum.PublishStatusPublished)
		} else {
			exist, err = u.serviceRepo.IsServiceIDInStatusesExist(ctx, req.ServiceID, enum.ConsideredAsOnlineStatuses)
		}
		if err != nil {
			return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
		}
		if !exist {
			return nil, errorcode.Detail(errorcode.ServiceUnPublish, err)
		}
	} else {
		log.Info("ServiceGetFrontend --> 当前用户有内置角色，可查看未上线的资源")
	}
	// 接口详情
	serviceGetRes, err := u.ServiceGet(ctx, req)
	if err != nil {
		return nil, err
	}
	// 获取当前登录 用户
	log.Infof("ServiceGetFrontend --> 当前用户ID：%s", userInfo.Id)

	res = &dto.ServiceGetFrontendRes{ServiceGetRes: *serviceGetRes}

	// 验证用户是否拥有接口的权限
	if err := u.enforceServiceGetFrontendRes(ctx, res); err != nil {
		log.Warn("enforce ServiceGetFrontendRes fail", zap.Error(err))
	}
	// 判断用户是否能将当前接口服务授权给其他用户
	if err := u.youCanAuthThisService(ctx, res); err != nil {
		log.Warn("youCanAuthThisService fail", zap.Error(err))
	}

	// 增加预览量
	u.serviceStatsRepo.IncrPreviewNum(ctx, req.ServiceID)

	// 检查是否收藏
	err, resp := u.CheckFavorite(ctx, req, userInfo.Id)
	if err != nil {
		return nil, err
	}
	if resp != nil && resp.FavorID > 0 {
		res.ServiceInfo.IsFavored = true
		res.ServiceInfo.FavorID = resp.FavorID
	} else {
		res.ServiceInfo.IsFavored = false
	}

	return res, nil
}

func (u *ServiceDomain) ServiceUpdate(ctx context.Context, req *dto.ServiceUpdateReqOrTemp) (err error) {
	if !req.IsTemp {
		err = u.serviceCheckParam(ctx, req.ServiceInfo, req.ServiceParam)
		req.ServiceInfo.PublishStatus = enum.PublishStatusPubAuditing
		req.ServiceInfo.AuditType = enum.AuditTypePublish
	} else {
		req.ServiceInfo.PublishStatus = enum.PublishStatusUnPublished
		req.ServiceInfo.AuditType = enum.AuditTypeUnpublished
	}
	if err != nil {
		return err
	}

	if req.ServiceParam.CreateModel == "script" {
		_, err := u.CheckScript(ctx, req.ServiceParam.Script)
		if err != nil {
			return err
		}
	}

	if req.ServiceParam.CreateModel == "wizard" {
		req.ServiceParam.Script = ""
	}

	err = u.serviceRepo.ServiceUpdate(ctx, req, true)
	if err != nil {
		return err
	}

	// 获取接口服务修改之后的值，用于记录审计日志
	newService, err := u.serviceRepo.ServiceGet(ctx, req.ServiceID)
	if err != nil {
		return err
	}

	// 回调：接口更新
	// if u.callback != nil {
	// 	serviceModel := &model.Service{
	// 		ServiceID:   newService.ServiceInfo.ServiceID,
	// 		ServiceName: newService.ServiceInfo.ServiceName,
	// 		ServicePath: newService.ServiceInfo.ServicePath,
	// 		Description: &newService.ServiceInfo.Description,
	// 		AppsID:      &newService.ServiceInfo.AppsId,
	// 	}
	// 	serviceCallback, callbackErr := u.callback.OnUpdateService(ctx, serviceModel)
	// 	if callbackErr != nil {
	// 		log.WithContext(ctx).Error("ServiceUpdate callback OnUpdateService failed", zap.String("serviceID", req.ServiceID), zap.Error(callbackErr))
	// 	} else {
	// 		if serviceCallback != nil && serviceCallback.SyncFlag != nil {
	// 			updateData := map[string]interface{}{
	// 				"sync_flag": serviceCallback.SyncFlag,
	// 				"sync_msg":  serviceCallback.SyncMsg,
	// 				"sync_type": serviceCallback.SyncType,
	// 			}
	// 			if updateErr := u.serviceRepo.UpdateServiceCallbackInfo(ctx, req.ServiceID, updateData); updateErr != nil {
	// 				log.WithContext(ctx).Error("ServiceUpdate update callback info failed", zap.String("serviceID", req.ServiceID), zap.Error(updateErr))
	// 			}
	// 		}
	// 	}
	// }

	// 记录审计日志：更新、发布接口
	if req.IsTemp {
		// 暂存
		u.auditLogUpdateAPI(ctx, &newService.ServiceInfo)
	} else {
		// 发布
		u.auditLogPublicAPI(ctx, newService.ServiceInfo.ServiceID, newService.ServiceInfo.ServiceName)
	}

	return err
}

func (u *ServiceDomain) ServiceDelete(ctx context.Context, req *dto.ServiceDeleteReq) error {
	// 获取接口服务信息，用于记录审计日志
	res, err := u.serviceRepo.ServiceGet(ctx, req.ServiceID)
	if err != nil {
		return err
	}

	if err := u.serviceRepo.ServiceDelete(ctx, req.ServiceID); err != nil {
		return err
	}
	if err = u.serviceRepo.PushCatalogMessage(ctx, req.ServiceID, "delete"); err != nil {
		return err
	}

	// 回调：接口删除（状态变更）
	// if u.callback != nil {
	// 	serviceModel := &model.Service{
	// 		ServiceID:   res.ServiceInfo.ServiceID,
	// 		ServiceName: res.ServiceInfo.ServiceName,
	// 		ServicePath: res.ServiceInfo.ServicePath,
	// 		Description: &res.ServiceInfo.Description,
	// 		AppsID:      &res.ServiceInfo.AppsId,
	// 	}
	// 	serviceCallback, callbackErr := u.callback.OnServiceStatusUpdate(ctx, serviceModel, "0")
	// 	if callbackErr != nil {
	// 		log.WithContext(ctx).Error("ServiceDelete callback OnServiceStatusUpdate failed", zap.String("serviceID", req.ServiceID), zap.Error(callbackErr))
	// 	} else {
	// 		if serviceCallback != nil && serviceCallback.SyncFlag != nil {
	// 			updateData := map[string]interface{}{
	// 				"sync_flag": serviceCallback.SyncFlag,
	// 				"sync_msg":  serviceCallback.SyncMsg,
	// 				"sync_type": serviceCallback.SyncType,
	// 			}
	// 			if updateErr := u.serviceRepo.UpdateServiceCallbackInfo(ctx, req.ServiceID, updateData); updateErr != nil {
	// 				log.WithContext(ctx).Error("ServiceDelete update callback info failed", zap.String("serviceID", req.ServiceID), zap.Error(updateErr))
	// 			}
	// 		}
	// 	}
	// }

	// 记录审计日志：删除接口
	u.auditLogDelete(ctx, &res.ServiceInfo)

	return nil
}

// 数据源的部分字段，用于在 SQL to Form 时检查表名、字段名
type partialDatasource struct {
	Type         string
	CatalogName  string
	Schema       string
	DatabaseName string
}

func newPartialDatasourceFromDataViewGetRes(r *microservice.DataViewGetRes) *partialDatasource {
	var catalog, schema string
	if f := strings.Split(r.ViewSourceCatalogName, "."); len(f) == 2 {
		catalog, schema = f[0], f[1]
	}
	return &partialDatasource{
		Type:         r.DatasourceType,
		CatalogName:  catalog,
		Schema:       schema,
		DatabaseName: r.TechnicalName,
	}
}

func newPartialDatasourceFromDatasourceResRes(r *microservice.DatasourceResRes) *partialDatasource {
	return &partialDatasource{
		Type:         r.Type,
		CatalogName:  r.CatalogName,
		Schema:       r.Schema,
		DatabaseName: r.DatabaseName,
	}
}

func (u *ServiceDomain) ServiceSqlToForm(ctx context.Context, req *dto.ServiceSqlToFormReq) (res *dto.ServiceSqlToFormRes, err error) {
	defer func() {
		//清空 where
		wheres = make(map[string]string)
	}()

	//检查sql语法
	stmt, err := u.CheckScript(ctx, req.SQL)
	if err != nil {
		return nil, err
	}

	s, ok := stmt.(*sqlparser.Select)
	if !ok {
		return nil, errorcode.Desc(errorcode.ServiceSQLSyntaxError)
	}

	//检查数据视图id
	var dataViewGetRes = &microservice.DataViewGetRes{}
	if req.DataViewId != "" {
		dataViewGetRes, err = u.dataViewRepo.DataViewGet(ctx, req.DataViewId)
		if err != nil {
			return nil, errorcode.Desc(errorcode.DataViewIdNotExist)
		}
	}
	if dataViewGetRes.LastPublishTime == 0 {
		return nil, errorcode.Desc(errorcode.DataViewIdNotPublish)
	}

	//检查数据源id
	var datasourceResRes *partialDatasource
	switch dataViewGetRes.Type {
	case microservice.DatasourceTypeDatasource:
		res, err := u.configurationCenterRepo.DatasourceGet(ctx, req.DatasourceId)
		if err != nil {
			return nil, errorcode.Desc(errorcode.DatasourceIdNotExist)
		}
		datasourceResRes = newPartialDatasourceFromDatasourceResRes(res)
	case microservice.DatasourceTypeLogicEntity, microservice.DatasourceTypeCustom:
		datasourceResRes = newPartialDatasourceFromDataViewGetRes(dataViewGetRes)
	default:
		return nil, fmt.Errorf("invalid datasource type: %s", dataViewGetRes.DatasourceType)
	}

	lock.Lock()
	defer lock.Unlock()

	var selects []string
	var tables []string
	var orderby = make(map[string]string)

	//提取库名表名
	for _, tableExpr := range s.From {
		switch tableExpr.(type) {
		case *sqlparser.AliasedTableExpr:
			aliasedTableExpr := tableExpr.(*sqlparser.AliasedTableExpr)
			//检查数据库名
			db := aliasedTableExpr.Expr.(sqlparser.TableName).Qualifier.String()
			if db != "" && db != datasourceResRes.DatabaseName {
				return nil, errorcode.Desc(errorcode.ServiceSQLSchemaError)
			}

			table := aliasedTableExpr.Expr.(sqlparser.TableName).Name.String()
			if table == "dual" {
				return nil, errorcode.Desc(errorcode.ServiceSQLSyntaxError)
			}

			tables = append(tables, table)
		case *sqlparser.JoinTableExpr:
			joinTableExpr := tableExpr.(*sqlparser.JoinTableExpr)
			rightExpr, ok := joinTableExpr.RightExpr.(*sqlparser.AliasedTableExpr)
			var rightTable string
			if ok {
				rightTable = rightExpr.Expr.(sqlparser.TableName).Name.String()
			}
			var leftTable string
			leftExpr, ok := joinTableExpr.LeftExpr.(*sqlparser.AliasedTableExpr)
			if ok {
				leftTable = leftExpr.Expr.(sqlparser.TableName).Name.String()
			}
			if rightTable == "dual" || leftTable == "dual" {
				return nil, errorcode.Desc(errorcode.ServiceSQLSyntaxError)
			}
			if rightTable != "" {
				tables = append(tables, rightTable)
			}
			if leftTable != "" {
				tables = append(tables, leftTable)
			}
		}
	}

	//提取 select 字段
	for _, selectExpr := range s.SelectExprs {
		aliasedExpr := selectExpr.(*sqlparser.AliasedExpr)
		var col string
		// 调虚拟化引擎获取列名时，拿不到SQL中的别名，这里不再提取SQL别名校验
		switch aliasedExpr.Expr.(type) {
		case *sqlparser.ColName: //普通字段
			col = aliasedExpr.Expr.(*sqlparser.ColName).Name.String()
			selects = append(selects, col)
		case *sqlparser.FuncExpr: //提取聚合函数中的字段，如CONCAT(id, domain_id)，即提取到id和domain_id
			funcExprs := aliasedExpr.Expr.(*sqlparser.FuncExpr).Exprs
			for _, expr := range funcExprs {
				var funcCol string
				funcCol = expr.(*sqlparser.AliasedExpr).Expr.(*sqlparser.ColName).Name.String()
				selects = append(selects, funcCol)
			}
		}
	}

	//提取 where 字段
	err = s.Where.WalkSubtree(u.walkWhere)
	if err != nil {
		return nil, err
	}

	//提取 where 语句 ${} 包括的字段
	wheresNew := make(map[string]string)
	fasttemplate.New(req.SQL, "${", "}").
		ExecuteFuncString(func(w io.Writer, tag string) (int, error) {
			wheresNew[tag] = ""
			return 0, nil
		})

	err = s.Having.WalkSubtree(u.walkWhere)
	if err != nil {
		return nil, err
	}

	//提取 order by 字段
	for _, order := range s.OrderBy {
		col, ok := order.Expr.(*sqlparser.ColName)
		if !ok {
			message := fmt.Sprintf("请填写正确的字段名")
			return nil, agerrors.NewCode(agcodes.New(errorcode.ServiceSQLSyntaxError, "排序参数填写错误", "", message, "", ""))
		}
		orderby[col.Name.String()] = order.Direction
	}

	res = &dto.ServiceSqlToFormRes{
		Tables:                  tables,
		DataTableRequestParams:  make([]*dto.DataTableRequestParam, 0),
		DataTableResponseParams: make([]*dto.DataTableResponseParam, 0),
	}

	// 从虚拟化引擎查询表所用的参数 schema，如果数据源的 schema 为空则使用
	// database name 作为 schema
	var schemaName string = datasourceResRes.Schema
	if schemaName == "" {
		schemaName = datasourceResRes.DatabaseName
	}
	tableList, err := u.virtualEngine.DataTableList(ctx, datasourceResRes.CatalogName, schemaName)
	if err != nil {
		return
	}

	if len(tableList) == 0 {
		message := fmt.Sprintf("数据库 %s 中没有表，请重新选择数据库", datasourceResRes.DatabaseName)
		return nil, agerrors.NewCode(agcodes.New(errorcode.ServiceSQLSyntaxError, "数据库错误", "", message, "", ""))
	}

	tablesMap := map[string]struct{}{}
	for _, table := range tableList {
		tablesMap[table.Table] = struct{}{}
	}

	for _, table := range tables {
		//检查填写的表是否存在
		if _, ok := tablesMap[table]; !ok {
			message := fmt.Sprintf("数据库 %s 中不存在表 %s，请填写正确的表名", datasourceResRes.DatabaseName, table)
			return nil, agerrors.NewCode(agcodes.New(errorcode.ServiceSQLSyntaxError, "表名错误", "", message, "", ""))
		}
		for _, t := range tableList {
			//获取表字段的数据类型和注释
			if table != t.Table {
				continue
			}

			tableColumn, err := u.virtualEngine.DataTableColumn(ctx, datasourceResRes.CatalogName, t.Schema, t.Table)
			if err != nil {
				return nil, err
			}

			columnsMap := map[string]microservice.DataTableColumn{}
			for _, column := range tableColumn {
				columnsMap[column.Name] = column
			}

			//检查 ${} 中的字段是否存在
			for s := range wheresNew {
				if _, ok := columnsMap[s]; !ok {
					message := fmt.Sprintf("数据表 %s 中不存在字段 %s，请填写正确的字段名", table, s)
					return nil, agerrors.NewCode(agcodes.New(errorcode.ServiceSQLSyntaxError, "请求参数填写错误", "", message, "", ""))
				}
			}

			//检查 order by 的字段是否存在
			for s := range orderby {
				if _, ok := columnsMap[s]; !ok {
					message := fmt.Sprintf("数据表 %s 中不存在字段 %s，请填写正确的字段名", table, s)
					return nil, agerrors.NewCode(agcodes.New(errorcode.ServiceSQLSyntaxError, "排序参数填写错误", "", message, "", ""))
				}
			}

			for _, s := range selects {
				//检查填写的返回字段是否存在
				if _, ok := columnsMap[s]; !ok {
					message := fmt.Sprintf("数据表 %s 中不存在字段 %s，请填写正确的字段名", table, s)
					return nil, agerrors.NewCode(agcodes.New(errorcode.ServiceSQLSyntaxError, "返回参数填写错误", "", message, "", ""))
				}

				column := columnsMap[s]
				dataTableResponseParam := &dto.DataTableResponseParam{
					CNName:   column.Comment,
					EnName:   column.Name,
					DataType: column.Type,
				}
				res.DataTableResponseParams = append(res.DataTableResponseParams, dataTableResponseParam)
			}

			for s, operator := range wheres {
				//检查填写的请求字段是否存在
				if _, ok := columnsMap[s]; !ok {
					message := fmt.Sprintf("数据表 %s 中不存在字段 %s，请填写正确的字段名", table, s)
					return nil, agerrors.NewCode(agcodes.New(errorcode.ServiceSQLSyntaxError, "请求参数填写错误", "", message, "", ""))
				}

				//只有 ${} 包括起来的 where 字段才作为请求参数
				if _, ok := wheresNew[s]; !ok {
					continue
				}
				column := columnsMap[s]
				dataTableRequestParam := &dto.DataTableRequestParam{
					CNName:   column.Comment,
					EnName:   column.Name,
					DataType: column.Type,
					Operator: operator,
				}
				res.DataTableRequestParams = append(res.DataTableRequestParams, dataTableRequestParam)
			}
		}
	}

	//排序设置
	for c, sort := range orderby {
		for _, param := range res.DataTableResponseParams {
			if param.EnName == c {
				param.Sort = sort
			}
		}
	}

	return res, nil
}

func (u *ServiceDomain) ServiceFormToSql(ctx context.Context, req *dto.ServiceFormToSqlReq) (res *dto.ServiceFormToSqlRes, err error) {
	res, err = u.serviceRepo.ServiceFormToScript(ctx, req)
	return res, err
}

func (u *ServiceDomain) walkWhere(node sqlparser.SQLNode) (kontinue bool, err error) {
	switch node.(type) {
	case *sqlparser.ComparisonExpr:
		comparisonExpr := node.(*sqlparser.ComparisonExpr)
		colName, ok := comparisonExpr.Left.(*sqlparser.ColName)
		if ok {
			operator := comparisonExpr.Operator
			wheres[colName.Name.String()] = operator
		}
	case *sqlparser.RangeCond:
		rangeCond := node.(*sqlparser.RangeCond)
		colName, ok := rangeCond.Left.(*sqlparser.ColName)
		if ok {
			operator := rangeCond.Operator
			wheres[colName.Name.String()] = operator
		}
	case *sqlparser.IsExpr:
		isExpr := node.(*sqlparser.IsExpr)
		colName, ok := isExpr.Expr.(*sqlparser.ColName)
		if ok {
			operator := isExpr.Operator
			wheres[colName.Name.String()] = operator
		}
	}
	return true, nil
}

func (u *ServiceDomain) CheckScript(ctx context.Context, script string) (stmt sqlparser.Statement, err error) {
	if script == "" {
		return nil, nil
	}

	// ${xxx} 转换为 ? 否则语法检查会不通过
	t := fasttemplate.New(script, "${", "}")
	script = t.ExecuteFuncString(func(w io.Writer, tag string) (int, error) {
		return w.Write([]byte("?"))
	})

	// 语法解析检查
	stmt, err = sqlparser.Parse(script)
	if err != nil {
		return nil, errorcode.Desc(errorcode.ServiceSQLSyntaxError)
	}

	sql := strings.ToLower(script)
	//排除 select *
	if strings.Contains(sql, "select*") || strings.Contains(sql, "select *") {
		return nil, errorcode.Desc(errorcode.ServiceSQLSyntaxError)
	}

	//排除注释
	if strings.HasPrefix(sql, "#") || strings.HasPrefix(sql, "/*") {
		return nil, errorcode.Desc(errorcode.ServiceSQLSyntaxError)
	}

	//排除 insert、update、delete
	_, ok := stmt.(*sqlparser.Insert)
	if ok {
		return nil, errorcode.Desc(errorcode.ServiceSQLSyntaxError)
	}
	_, ok = stmt.(*sqlparser.Update)
	if ok {
		return nil, errorcode.Desc(errorcode.ServiceSQLSyntaxError)
	}
	_, ok = stmt.(*sqlparser.Delete)
	if ok {
		return nil, errorcode.Desc(errorcode.ServiceSQLSyntaxError)
	}

	_, ok = stmt.(*sqlparser.Select)
	if !ok {
		return nil, errorcode.Desc(errorcode.ServiceSQLSyntaxError)
	}

	return stmt, nil
}

func (u *ServiceDomain) CheckServiceName(ctx context.Context, req *dto.ServiceCheckServiceNameReq) (err error) {
	exist, err := u.serviceRepo.IsServiceNameExist(ctx, req.ServiceName, req.ServiceID)
	if err != nil {
		return err
	}

	if exist {
		return errorcode.Desc(errorcode.ServiceNameExist)
	}

	return
}

func (u *ServiceDomain) CheckServicePath(ctx context.Context, req *dto.ServiceCheckServicePathReq) (err error) {
	exist, err := u.serviceRepo.IsServicePathExist(ctx, req.ServicePath, req.ServiceID)
	if err != nil {
		return err
	}

	if exist {
		return errorcode.Desc(errorcode.ServicePathExist)
	}

	return nil
}

func (u *ServiceDomain) serviceCheckParam(ctx context.Context, serviceInfo dto.ServiceInfo, serviceParam dto.ServiceParamWrite) (err error) {
	// 根据字段值进行不同的必填项校验
	// https://pkg.go.dev/github.com/go-playground/validator/v10#hdr-Required_If
	// https://github.com/go-playground/validator/issues/991
	// 正确的写法是使用 validator 的 required_if 做字段值的联动校验，但是它只支持同级字段校验，不支持嵌套结构体的校验，所以目前只能这样手工验证

	var validErrors form_validator.ValidErrors
	// 暂存状态不检查必填项
	//if serviceInfo.PublishStatus == enum.PublishStatusUnPublished {
	//return nil
	//}

	if serviceInfo.ServicePath == "" {
		validErrors = append(validErrors, &form_validator.ValidError{Key: "service_info.service_path", Message: "service_path为必填字段"})
	}

	if serviceInfo.ServiceType == "service_register" {
		if serviceInfo.BackendServiceHost == "" {
			validErrors = append(validErrors, &form_validator.ValidError{Key: "service_info.backend_service_host", Message: "backend_service_host为必填字段"})
		}

		if serviceInfo.BackendServicePath == "" {
			validErrors = append(validErrors, &form_validator.ValidError{Key: "service_info.backend_service_path", Message: "backend_service_path为必填字段"})
		}
	}

	if serviceInfo.HTTPMethod == "" {
		validErrors = append(validErrors, &form_validator.ValidError{Key: "service_info.http_method", Message: "http_method为必填字段"})
	}

	if serviceInfo.Timeout == 0 {
		validErrors = append(validErrors, &form_validator.ValidError{Key: "service_info.timeout", Message: "timeout为必填字段"})
	}

	if serviceInfo.ServiceType == "service_generate" {
		if serviceParam.CreateModel == "" {
			validErrors = append(validErrors, &form_validator.ValidError{Key: "service_param.create_model", Message: "create_model为必填字段"})
		}

		if serviceParam.DatasourceId != "" {
			log.WithContext(ctx).Warn("dto.ServiceParamWrite.DatasourceId is deprecated")
		}

		if serviceParam.CreateModel == "wizard" {
			if serviceParam.DataViewId == "" {
				validErrors = append(validErrors, &form_validator.ValidError{Key: "service_param.data_view_id", Message: "data_view_id为必填字段"})
			}
		}

		if serviceParam.CreateModel == "script" {
			if serviceParam.Script == "" {
				validErrors = append(validErrors, &form_validator.ValidError{Key: "service_param.script", Message: "script为必填字段"})
			}
		}
	}

	if serviceInfo.ServiceType == "service_generate" {
		if len(serviceParam.DataTableResponseParams) == 0 {
			validErrors = append(validErrors, &form_validator.ValidError{Key: "service_param.data_table_response_params", Message: "data_table_response_params为必填字段"})
		}
	}

	for _, param := range serviceParam.DataTableRequestParams {
		if param.EnName == "" {
			validErrors = append(validErrors, &form_validator.ValidError{Key: "service_param.data_table_request_params.en_name", Message: "en_name为必填字段"})
		}
		if param.DataType == "" {
			validErrors = append(validErrors, &form_validator.ValidError{Key: "service_param.data_table_request_params.data_type", Message: "data_type为必填字段"})
		}
		if param.Required == "" {
			validErrors = append(validErrors, &form_validator.ValidError{Key: "service_param.data_table_request_params.required", Message: "required为必填字段"})
		}
		if serviceInfo.ServiceType == "service_generate" {
			if param.Operator == "" {
				validErrors = append(validErrors, &form_validator.ValidError{Key: "service_param.data_table_request_params.operator", Message: "operator为必填字段"})
			}

			// 脚本模式：所有参数应该都是必填参数
			//
			// TODO: 通过 struct tag binding 实现参数验证
			if serviceParam.CreateModel == "script" {
				for i, p := range serviceParam.DataTableRequestParams {
					if p.Required == "no" {
						validErrors = append(validErrors, &form_validator.ValidError{
							Key:     fmt.Sprintf("service_param.data_table_request_params[%d].required", i),
							Message: "脚本模式，参数必须是必填参数",
						})
					}
				}
			}
		}
	}

	if serviceInfo.ServiceType == "service_generate" {
		for _, param := range serviceParam.DataTableResponseParams {
			if param.EnName == "" {
				validErrors = append(validErrors, &form_validator.ValidError{Key: "service_param.data_table_response_params.en_name", Message: "en_name为必填字段"})
			}
			if param.DataType == "" {
				validErrors = append(validErrors, &form_validator.ValidError{Key: "service_param.data_table_response_params.data_type", Message: "data_type为必填字段"})
			}
		}
	}

	if len(validErrors) == 0 {
		return nil
	}

	return validErrors
}

func (u *ServiceDomain) AuditProcessInstanceCreate(c context.Context, req *dto.AuditProcessInstanceCreateReq) error {
	service, err := u.serviceRepo.ServiceGet(c, req.ServiceID)
	if err != nil {
		return err
	}

	if service == nil {
		return errorcode.Desc(errorcode.ServiceIDNotExist)
	}

	//接口信息是否填写完整
	complete, err := u.serviceRepo.ServiceIsComplete(c, req.ServiceID)
	if err != nil {
		log.WithContext(c).Error("AuditProcessInstanceCreate serviceRepo.ServiceIsComplete", zap.Error(err))
		return errorcode.Detail(errorcode.PublicDatabaseError, err)
	}

	if !complete {
		return errorcode.Detail(errorcode.ServiceNotComplete, err)
	}

	//检查是否有绑定的审核流程
	var isAuditProcessExist bool
	process, err := u.auditProcessBindRepo.GetByAuditType(c, req.AuditType)
	if err != nil {
		log.WithContext(c).Errorf("failed to get audit process info (type: %s), err: %v", req.AuditType, err)
		return errorcode.Detail(errorcode.PublicDatabaseError, err)
	}

	if process.ProcDefKey != "" {
		//检查 ProcDefKey 是否正确
		res, err := u.workflowRestRepo.ProcessDefinitionGet(c, process.ProcDefKey)
		if err != nil {
			return errorcode.Desc(errorcode.AuditProcessNotExist)
		}

		if res.Key != process.ProcDefKey {
			return errorcode.Desc(errorcode.AuditProcessNotExist)
		}

		isAuditProcessExist = true
	}

	//生成审核实例
	t := time.Now()
	audit := &model.Service{
		ApplyID:    util.GetUniqueString(),
		AuditType:  req.AuditType,
		UpdateTime: t,
	}

	//标记接口状态和审核状态
	switch req.AuditType {
	case enum.AuditTypePublish: //发布
		switch isAuditProcessExist {
		case true: // 绑定了审核流程，发布待审核
			audit.AuditStatus = enum.AuditStatusAuditing
			audit.ProcDefKey = process.ProcDefKey
			audit.PublishStatus = enum.PublishStatusPubAuditing
		case false: // 没绑定审核流程，改为已发布
			audit.AuditStatus = enum.AuditStatusPass
			audit.PublishStatus = enum.PublishStatusPublished
			audit.PublishTime = &t
			// 如果没有绑定审核流程，调用回调事件
			if callbackErr := u.serviceRepo.HandleCallbackEvent(c, req.ServiceID); callbackErr != nil {
				log.WithContext(c).Error("AuditProcessInstanceCreate handle callback event failed",
					zap.String("serviceID", req.ServiceID), zap.Error(callbackErr))
				// 回调失败不影响主流程，只记录日志
			}
		}
	case enum.AuditTypeChange: //变更
		switch isAuditProcessExist {
		case true: // 变更审核中
			audit.AuditStatus = enum.AuditStatusAuditing
			audit.ProcDefKey = process.ProcDefKey
			audit.PublishStatus = enum.PublishStatusChangeAuditing
		case false: // 已发布
			audit.AuditStatus = enum.AuditStatusPass
			audit.PublishStatus = enum.PublishStatusPublished
			audit.PublishTime = &t
			// 如果没有绑定审核流程，调用回调事件
			if callbackErr := u.serviceRepo.HandleCallbackEvent(c, req.ServiceID); callbackErr != nil {
				log.WithContext(c).Error("AuditProcessInstanceCreate handle callback event failed",
					zap.String("serviceID", req.ServiceID), zap.Error(callbackErr))
				// 回调失败不影响主流程，只记录日志
			}
		}
	case enum.AuditTypeOnline: //上线
		switch isAuditProcessExist {
		case true:
			audit.AuditStatus = enum.AuditStatusAuditing
			audit.ProcDefKey = process.ProcDefKey
			audit.Status = enum.LineStatusUpAuditing
		case false:
			audit.AuditStatus = enum.AuditStatusPass
			audit.Status = enum.LineStatusOnLine
			audit.OnlineTime = &t
		}
	case enum.AuditTypeOffline: //下线
		switch isAuditProcessExist {
		case true:
			audit.AuditStatus = enum.AuditStatusAuditing
			audit.ProcDefKey = process.ProcDefKey
			audit.Status = enum.LineStatusDownAuditing
		case false:
			audit.AuditStatus = enum.AuditStatusPass
			audit.Status = enum.LineStatusOffLine
		}
	}
	audit.UpdateTime = t

	// 获取接口服务名称用于记录审计日志：发布接口
	name, err := u.serviceRepo.ServiceGetName(c, req.ServiceID)
	if err != nil {
		return err
	}

	err = u.serviceRepo.AuditProcessInstanceCreate(c, req.ServiceID, audit)
	if err != nil {
		return err
	}

	// 根据 req.AuditType 记录审计日志：发布、上线、下线
	auditLogAuditProcessInstanceCreate(c, req.AuditType, req.ServiceID, name)

	return nil
}

func (u *ServiceDomain) ServiceSearch(c context.Context, req *dto.ServiceSearchReq) (res *dto.ServiceSearchRes, err error) {
	interfaceSvcSearchReq := &microservice.InterfaceSvcSearchReq{
		Keyword:  req.Keyword,
		OnlineAt: &microservice.TimeRange{},
		Orders: []microservice.Order{
			{
				Direction: "desc",
				Sort:      "online_at",
			},
		},
		Size:     req.Size,
		NextFlag: req.NextFlag,
	}

	if req.PublishedAt.StartTime != 0 {
		interfaceSvcSearchReq.OnlineAt.StartTime = &req.PublishedAt.StartTime
	}

	if req.PublishedAt.EndTime != 0 {
		interfaceSvcSearchReq.OnlineAt.EndTime = &req.PublishedAt.EndTime
	}

	if req.OrgCode != "" {
		orgCodes := []string{req.OrgCode}
		subDepartmentGetRes, err := u.configurationCenterRepo.SubDepartmentGet(c, req.OrgCode)
		if err != nil {
			return nil, err
		}

		for _, entry := range subDepartmentGetRes.Entries {
			orgCodes = append(orgCodes, entry.Id)
		}
		interfaceSvcSearchReq.OrgCodes = orgCodes
	}

	if req.SubjectDomainId != "" {
		SubjectDomainIds := []string{req.SubjectDomainId}
		dataSubjectListRes, err := u.DataSubjectRepo.DataSubjectList(c, req.SubjectDomainId, "")
		if err != nil {
			return nil, err
		}

		for _, entry := range dataSubjectListRes.Entries {
			SubjectDomainIds = append(SubjectDomainIds, entry.Id)
		}
		interfaceSvcSearchReq.SubjectDomainIds = SubjectDomainIds
	}

	interfaceSvcSearchRes, err := u.basicSearchRepo.InterfaceSvcSearch(c, interfaceSvcSearchReq)
	if err != nil {
		return nil, err
	}

	var entries []*dto.ServiceSearch
	var serviceIDs []string
	for _, item := range interfaceSvcSearchRes.Entries {
		entry := &dto.ServiceSearch{
			ID:             item.ID,
			Name:           item.Name,
			RawName:        item.RawName,
			Description:    item.Description,
			RawDescription: item.RawDescription,
			AuditStatus:    "",
			OnlineTime:     item.OnlineAt,
			OrgCode:        item.OrgCode,
			OrgName:        item.OrgName,
			DataOwnerID:    item.DataOwnerID,
			DataOwnerName:  item.DataOwnerName,

			SearchAllExt: dto.SearchAllExt{
				Title:        item.Name,
				RawTitle:     item.RawName,
				RawOrgName:   item.RawOrgName,
				PublishedAt:  item.OnlineAt,
				OwnerID:      item.DataOwnerID,
				OwnerName:    item.DataOwnerName,
				RawOwnerName: item.RawOwnerName,
				Code:         item.ID,
			},
		}

		entries = append(entries, entry)
		serviceIDs = append(serviceIDs, item.ID)
	}

	//查询用户的接口的申请状态
	auditStatusMap, err := u.serviceApplyRepo.AuditStatus(c, util.GetUser(c).Id, serviceIDs)
	if err != nil {
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}

	for _, entry := range entries {
		auditStatus, ok := auditStatusMap[entry.ID]
		if ok {
			entry.AuditStatus = auditStatus
		}
	}

	res = &dto.ServiceSearchRes{
		PageResult: dto.PageResult[dto.ServiceSearch]{
			TotalCount: interfaceSvcSearchRes.TotalCount,
			Entries:    entries,
		},
		NextFlag: interfaceSvcSearchRes.NextFlag,
	}

	return res, nil
}

func (u *ServiceDomain) GetOwnerAuditors(ctx context.Context, req *dto.ServiceIDReq) (res *dto.GetOwnerAuditorsRes, err error) {
	service, err := u.serviceRepo.ServiceGetFields(ctx, req.ServiceID, []string{"owner_id"})
	if err != nil {
		return nil, errorcode.Desc(errorcode.PublicDatabaseError, err)
	}

	if len(service.OwnerID) == 0 {
		return nil, errorcode.Desc(errorcode.ServiceNoOwner)
	}
	ownerIDs := strings.Split(service.OwnerID, ",")
	res = &dto.GetOwnerAuditorsRes{}
	for _, ownerID := range ownerIDs {
		if ownerID != "" {
			*res = append(*res, dto.AuditUser{
				UserId: ownerID,
			})
		}
	}

	return res, nil
}

func (u *ServiceDomain) ServiceIndexUpdateByKafKa(ctx context.Context) (res []string, err error) {
	// 添加超时控制，避免长时间阻塞
	ctx, cancel := context.WithTimeout(ctx, 30*time.Minute)
	defer cancel()

	// 获取所有未删除的数据
	count, err := u.serviceRepo.GetAllUndeleteServiceCount(ctx)
	if err != nil {
		log.Error("ServiceIndexUpdateByKafKa  --> 数据总量查询失败：", zap.Error(err))
		return nil, err
	}

	// 分批处理
	const BatchSize = 1000
	batchCount := int(count) / BatchSize
	if int(count)%BatchSize != 0 {
		batchCount++
	}

	// 使用带缓冲的channel，避免goroutine阻塞
	failedDataCh := make(chan *model.Service, batchCount*BatchSize)
	defer close(failedDataCh) // 确保channel被关闭

	// 等待组
	var wg sync.WaitGroup
	wg.Add(batchCount)

	// 用于收集错误的channel
	errorCh := make(chan error, batchCount)
	defer close(errorCh)

	// 添加并发控制：限制同时运行的goroutine数量
	semaphore := make(chan struct{}, 10) // 最多10个goroutine同时运行

	// 用于去重的map，避免重复处理同一个service
	processedServices := make(map[string]bool)
	var processedMutex sync.RWMutex

	// 启动goroutine处理批次
	for i := 0; i < batchCount; i++ {
		go func(batchIndex int) {
			// 获取信号量
			semaphore <- struct{}{}
			defer func() {
				<-semaphore // 释放信号量
			}()

			defer wg.Done()

			// 为每个goroutine创建独立的context
			goroutineCtx, goroutineCancel := context.WithTimeout(ctx, 10*time.Minute)
			defer goroutineCancel()

			offset := batchIndex * BatchSize
			limit := BatchSize

			services, err := u.serviceRepo.GetAllUndeleteServiceByOffset(goroutineCtx, offset, limit)
			if err != nil {
				log.Error("ServiceIndexUpdateByKafKa  --> 数据分批查询失败：",
					zap.Error(err),
					zap.Int("batchIndex", batchIndex),
					zap.Int("offset", offset),
					zap.Int("limit", limit))
				errorCh <- err
				return
			}

			// 发送索引对象
			for _, service := range services {
				select {
				case <-goroutineCtx.Done():
					log.Warn("ServiceIndexUpdateByKafKa  --> goroutine被取消",
						zap.Int("batchIndex", batchIndex),
						zap.String("reason", goroutineCtx.Err().Error()))
					return
				default:
					// 检查是否已经处理过这个service
					processedMutex.RLock()
					if processedServices[service.ServiceID] {
						processedMutex.RUnlock()
						log.Debug("ServiceIndexUpdateByKafKa  --> service已处理，跳过",
							zap.String("serviceID", service.ServiceID))
						continue
					}
					processedMutex.RUnlock()

					errIndex := u.serviceRepo.ServiceESIndexCreate(goroutineCtx, service)
					if errIndex != nil {
						// 标记为已处理，避免重复处理
						processedMutex.Lock()
						processedServices[service.ServiceID] = true
						processedMutex.Unlock()

						select {
						case failedDataCh <- service:
							log.Warn("ServiceIndexUpdateByKafKa  --> 索引创建失败，加入重试队列",
								zap.String("serviceID", service.ServiceID),
								zap.Error(errIndex))
						case <-goroutineCtx.Done():
							log.Warn("ServiceIndexUpdateByKafKa  --> 无法发送失败数据到channel，goroutine被取消")
							return
						}
					} else {
						// 标记为已处理
						processedMutex.Lock()
						processedServices[service.ServiceID] = true
						processedMutex.Unlock()
					}
				}
			}
		}(i)
	}

	// 等待所有goroutine完成
	wg.Wait()

	// 检查是否有查询错误
	select {
	case queryErr := <-errorCh:
		log.Error("ServiceIndexUpdateByKafKa  --> 存在查询错误", zap.Error(queryErr))
		return nil, queryErr
	default:
		// 没有查询错误，继续处理
	}

	// 处理失败的数据
	var failedAgainServiceId []string
	var failedMutex sync.Mutex // 保护failedAgainServiceId的并发访问
	failedCount := len(failedDataCh)

	if failedCount > 0 {
		log.Warn("ServiceIndexUpdateByKafKa  --> 存在索引信息发送失败的数据，尝试重新发送...",
			zap.Int("failedCount", failedCount))

		// 使用单独的goroutine处理失败数据
		retryWg := sync.WaitGroup{}
		retryWg.Add(1)

		go func() {
			defer retryWg.Done()

			// 为重试goroutine创建独立的context
			retryCtx, retryCancel := context.WithTimeout(ctx, 5*time.Minute)
			defer retryCancel()

			for {
				select {
				case failedService, ok := <-failedDataCh:
					if !ok {
						// channel已关闭，退出循环
						return
					}

					errIndex := u.serviceRepo.ServiceESIndexCreate(retryCtx, failedService)
					if errIndex != nil {
						log.Error("ServiceIndexUpdateByKafKa  --> 数据索引消息二次发送失败",
							zap.String("serviceID", failedService.ServiceID),
							zap.Error(errIndex))

						// 线程安全地添加到失败列表
						failedMutex.Lock()
						failedAgainServiceId = append(failedAgainServiceId, failedService.ServiceID)
						err = errIndex
						failedMutex.Unlock()
					} else {
						log.Info("ServiceIndexUpdateByKafKa  --> 重试成功",
							zap.String("serviceID", failedService.ServiceID))
					}

				case <-retryCtx.Done():
					log.Warn("ServiceIndexUpdateByKafKa  --> 重试goroutine被取消",
						zap.String("reason", retryCtx.Err().Error()))
					return
				}
			}
		}()

		// 等待重试完成
		retryWg.Wait()
	}

	// 检查最终结果
	if len(failedAgainServiceId) > 0 {
		log.Error("ServiceIndexUpdateByKafKa  --> 索引消息发送失败的ServiceId包括: "+strings.Join(failedAgainServiceId, ","),
			zap.Strings("failedServiceIDs", failedAgainServiceId),
			zap.Int("totalFailed", len(failedAgainServiceId)))
		return failedAgainServiceId, err
	}

	log.Info("ServiceIndexUpdateByKafKa  --> 索引更新完成",
		zap.Int64("totalCount", count),
		zap.Int("batchCount", batchCount),
		zap.Int("failedCount", failedCount))

	res = []string{}
	return
}

func (u *ServiceDomain) ServiceIndexUpdateByKafKa2(ctx context.Context, serviceIds ...string) (failedAgainServiceId []string, err error) {
	var services []*model.Service
	if len(serviceIds) > 0 {
		services, err = u.serviceRepo.GetAllUndeleteServiceByServices(ctx, serviceIds...)
		if err != nil {
			log.Error("ServiceIndexUpdateByKafKa  --> 数据分批查询失败：", zap.Error(err))
			return nil, err
		}
	} else {
		services, err = u.serviceRepo.GetAllUndeleteService(ctx)
		if err != nil {
			log.Error("ServiceIndexUpdateByKafKa  --> 数据分批查询失败：", zap.Error(err))
			return nil, err
		}
	}

	// 发送索引对象
	for _, service := range services {
		errIndex := u.serviceRepo.ServiceESIndexCreate(ctx, service)
		if errIndex != nil {
			log.Warn("ServiceIndexUpdateByKafKa  --> 索引创建失败，加入重试队列",
				zap.String("serviceID", service.ServiceID),
				zap.Error(errIndex))
			failedAgainServiceId = append(failedAgainServiceId, service.ServiceID)
		}
	}
	// 检查最终结果
	if len(failedAgainServiceId) > 0 {
		log.Error("ServiceIndexUpdateByKafKa  --> 索引消息发送失败的ServiceId包括: "+strings.Join(failedAgainServiceId, ","),
			zap.Strings("failedServiceIDs", failedAgainServiceId),
			zap.Int("totalFailed", len(failedAgainServiceId)))
	}
	log.Info("ServiceIndexUpdateByKafKa  --> 索引更新完成")
	return
}

func (u *ServiceDomain) ServicesGetByDataViewId(ctx context.Context, dataViewId string) (res *dto.ServicesGetByDataViewIdRes, err error) {
	services, err := u.serviceRepo.ServicesGetByDataViewId(ctx, dataViewId)
	if err != nil {
		return nil, err
	}

	entries := []*dto.ServicesGetByDataViewId{}
	for _, service := range services {
		entry := &dto.ServicesGetByDataViewId{
			ServiceID:   service.ServiceID,
			ServiceCode: service.ServiceCode,
			ServiceName: service.ServiceName,
		}

		entries = append(entries, entry)
	}

	res = &dto.ServicesGetByDataViewIdRes{
		ArrayResult: dto.ArrayResult[dto.ServicesGetByDataViewId]{
			Entries: entries,
		},
	}

	return
}
func (u *ServiceDomain) ServicesDataView(ctx context.Context, req *dto.ServiceGetReq) (res *dto.GetServicesDataViewRes, err error) {
	dataViewIds, err := u.serviceRepo.ServicesDataViewID(ctx, req.ServiceID)
	if err != nil {
		return nil, err
	}
	if len(dataViewIds) == 0 {
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, "dataViewIds not find")
	}
	services, err := u.ServicesGetByDataViewId(ctx, dataViewIds[0])
	if err != nil {
		return nil, err
	}
	return &dto.GetServicesDataViewRes{
		DataViewId:  dataViewIds[0],
		ArrayResult: services.ArrayResult,
	}, nil
}

// enforceServiceGetFrontendRes 验证用户是否拥有接口的权限
//
//  1. 如果用户是接口的 Owner 则有权限
//  2. 如果用户不是接口的 Owner 则向 auth-service 鉴权
func (u *ServiceDomain) enforceServiceGetFrontendRes(ctx context.Context, res *dto.ServiceGetFrontendRes) error {
	ctx, span := trace.StartInternalSpan(ctx)
	defer span.End()

	// 从 context 获取发起请求的用户的 ID
	userID := util.GetUser(ctx).Id
	// 如果用户 ID 为空则不需要验证权限
	if userID == "" {
		return nil
	}

	// 用户是接口的 Owner 则有权限，不需要再向 auth-service 鉴权
	if userID == res.ServiceInfo.OwnerId {
		res.ServiceApply.AuditStatus = "pass"
		return nil
	}

	// 构造用于鉴权的对象
	var enforce = microservice.Enforce{
		Action:      "read",
		ObjectId:    res.ServiceInfo.ServiceID,
		ObjectType:  "api",
		SubjectId:   userID,
		SubjectType: "user",
	}

	// 向 basic-search 鉴权
	enforces, err := u.AuthServiceRepo.Enforce(ctx, []microservice.Enforce{enforce})
	if err != nil {
		return err
	}

	for _, e := range enforces {
		if e {
			res.ServiceApply.AuditStatus = "pass"
			return nil
		}
	}

	return nil
}

// youCanAuthThisService 验证用户是否拥有接口的授权权限
//
//  1. 如果用户是接口的 Owner 则有授权
//  2. 如果用户不是接口的 Owner 则判断子接口有没有授权
func (u *ServiceDomain) youCanAuthThisService(ctx context.Context, res *dto.ServiceGetFrontendRes) error {
	ctx, span := trace.StartInternalSpan(ctx)
	defer span.End()

	// 从 context 获取发起请求的用户的 ID
	userID := util.GetUser(ctx).Id
	// 如果用户 ID 为空则不需要验证权限
	if userID == "" {
		return nil
	}
	// 用户是接口的 Owner 则有权限，不需要再向 auth-service 鉴权
	for _, owner := range res.ServiceInfo.Owners {
		if userID == owner.OwnerId {
			res.ServiceInfo.CanAuth = true
			return nil
		}
	}
	//查询服务关联的子接口
	dict, err := u.subServiceRepo.ListSubServices(ctx, res.ServiceInfo.ServiceID)
	if err != nil {
		return errorcode.PublicDatabaseErr.Detail(err.Error())
	}
	authReq := make([]auth_service_v1.EnforceRequest, 0)
	for _, idSlice := range dict {
		for i := range idSlice {
			peAuth := auth_service_v1.EnforceRequest{
				Subject: auth_service_v1.Subject{
					ID:   userID,
					Type: auth_service_v1.SubjectUser,
				},
				Object: auth_service_v1.Object{
					ID:   idSlice[i],
					Type: auth_service_v1.ObjectSubService,
				},
				Action: auth_service_v1.ActionAuth,
			}
			authReq = append(authReq, peAuth)
			peAllocate := auth_service_v1.EnforceRequest{
				Subject: auth_service_v1.Subject{
					ID:   userID,
					Type: auth_service_v1.SubjectUser,
				},
				Object: auth_service_v1.Object{
					ID:   idSlice[i],
					Type: auth_service_v1.ObjectSubService,
				},
				Action: auth_service_v1.ActionAllocate,
			}
			authReq = append(authReq, peAllocate)
		}
	}
	policyEffects, err := u.drivenAuthService.Enforce(ctx, authReq)
	if err != nil {
		return err
	}
	for _, effect := range policyEffects {
		if effect {
			res.ServiceInfo.CanAuth = true
			return nil
		}
	}
	return nil
}
func (u *ServiceDomain) ServiceSelectOptions(ctx context.Context) (resp *dto.OptionsInfoRes, err error) {
	//查询是否启用数据资源目录
	// isEnable, err := u.IsEnableResourceDirectory(ctx)
	// if err != nil {
	// 	return nil, err
	// }

	// // 判断是否为xx数据局项目
	// cssjj, err := u.IsCSSJJ(ctx)
	// if err != nil {
	// 	return nil, err
	// }

	resp = GetServiceStatusDict()
	isBindOnline, isBindOffline, err := u.auditProcessBindRepo.QueryAuditProcessBindInfo(ctx)
	if err != nil {
		return nil, err
	}
	//查询数据库是否绑定上下架流程
	if !isBindOnline {
		resp.UpdownStatus = removeElement(resp.UpdownStatus, enum.LineStatusUpAuditing)
	}
	if !isBindOffline {
		resp.UpdownStatus = removeElement(resp.UpdownStatus, enum.LineStatusDownAuditing)
	}

	// if cssjj {
	// 	// xx数据局项目，无论是否启用数据资源目录，都支持接口上下线
	// 	isBindOnline, isBindOffline, err := u.auditProcessBindRepo.QueryAuditProcessBindInfo(ctx)
	// 	if err != nil {
	// 		return nil, err
	// 	}
	// 	//查询数据库是否绑定上下架流程
	// 	if !isBindOnline {
	// 		resp.UpdownStatus = removeElement(resp.UpdownStatus, enum.LineStatusUpAuditing)
	// 	}
	// 	if !isBindOffline {
	// 		resp.UpdownStatus = removeElement(resp.UpdownStatus, enum.LineStatusDownAuditing)
	// 	}
	// } else if isEnable {
	// 	//数据资源目录下，不返回接口上下线状态
	// 	resp.UpdownStatus = []dto.OptionsInfo{}
	// } else {
	// 	isBindOnline, isBindOffline, err := u.auditProcessBindRepo.QueryAuditProcessBindInfo(ctx)
	// 	if err != nil {
	// 		return nil, err
	// 	}
	// 	//查询数据库是否绑定上下架流程
	// 	if !isBindOnline {
	// 		resp.UpdownStatus = removeElement(resp.UpdownStatus, enum.LineStatusUpAuditing)
	// 	}
	// 	if !isBindOffline {
	// 		resp.UpdownStatus = removeElement(resp.UpdownStatus, enum.LineStatusDownAuditing)
	// 	}
	// }
	return
}

// IsCSSJJ 返回是否为xx数据局项目
func (u *ServiceDomain) IsCSSJJ(ctx context.Context) (bool, error) {
	cv, err := u.configurationCenterRepo.GetConfigValue(ctx, microservice.ConfigValueKeyCSSJJ)
	if err != nil {
		return false, err
	}
	return cv.Value == microservice.ConfigValueValueTrue, nil
}

// IsEnableResourceDirectory 查询是否启用数据资源目录，1即数据资源目录，返回true，接口需要编目
func (u *ServiceDomain) IsEnableResourceDirectory(ctx context.Context) (isEnable bool, err error) {
	res, err := u.configurationCenterRepo.GetDataResourceDirectoryConfigInfo(ctx)
	if err != nil {
		return false, err
	}
	isEnable = res.Using == 1
	return
}

// GetServiceStatusDict 返回发布状态、接口状态的key-value，当前无字典表，先硬编码
func GetServiceStatusDict() (options *dto.OptionsInfoRes) {
	options = &dto.OptionsInfoRes{
		PublishStatus: []dto.OptionsInfo{
			{Key: enum.PublishStatusUnPublished, Text: "未发布"},
			{Key: enum.PublishStatusPubAuditing, Text: "发布审核中"},
			{Key: enum.PublishStatusPublished, Text: "已发布"},
			{Key: enum.PublishStatusPubReject, Text: "发布审核未通过"},
			{Key: enum.PublishStatusChangeAuditing, Text: "变更审核中"},
			{Key: enum.PublishStatusChangeReject, Text: "变更审核未通过"},
		},
		UpdownStatus: []dto.OptionsInfo{
			{Key: enum.LineStatusNotLine, Text: "未上线"},
			{Key: enum.LineStatusOnLine, Text: "已上线"},
			{Key: enum.LineStatusOffLine, Text: "已下线"},
			{Key: enum.LineStatusUpAuditing, Text: "上线审核中"},
			{Key: enum.LineStatusDownAuditing, Text: "下线审核中"},
			{Key: enum.LineStatusUpReject, Text: "上线审核未通过"},
			{Key: enum.LineStatusDownReject, Text: "下线审核未通过"},
		},
	}
	return
}

func removeElement(slice []dto.OptionsInfo, key string) []dto.OptionsInfo {
	var result []dto.OptionsInfo
	for _, value := range slice {
		if value.Key != key {
			result = append(result, value)
		}
	}
	return result
}

// UndoAuditByType 审核撤回
func (u *ServiceDomain) UndoAuditByType(ctx context.Context, serviceID string, operateType string) (resp *dto.ServiceIdRes, err error) {
	exist, err := u.serviceRepo.IsServiceIDExist(ctx, serviceID)
	if err != nil {
		return nil, err
	}
	if !exist {
		log.WithContext(ctx).Error("UndoAuditByType", zap.Error(errorcode.Desc(errorcode.ServiceIDNotExist)))
		return nil, errorcode.Desc(errorcode.ServiceIDNotExist)
	}
	switch operateType {
	case enum.UndoPublishAudit:
		resp, err = u.UndoPublishAudit(ctx, serviceID)
	case enum.UndoChangeAudit:
		resp, err = u.UndoChangeAudit(ctx, serviceID)
	case enum.UndoUpAudit:
		resp, err = u.UndoUpAudit(ctx, serviceID)
	case enum.UndoDownAudit:
		resp, err = u.UndoDownAudit(ctx, serviceID)
	}
	if err != nil {
		return nil, err
	}
	return
}

func (u *ServiceDomain) UndoPublishAudit(ctx context.Context, serviceID string) (resp *dto.ServiceIdRes, err error) {
	//状态校验
	service, err := u.serviceRepo.ServiceGetFields(ctx, serviceID, []string{"apply_id", "audit_type", "publish_status"})
	if err != nil {
		return nil, err
	}
	if service.PublishStatus != enum.PublishStatusPubAuditing || service.AuditType != enum.AuditTypePublish {
		return nil, errorcode.Desc(errorcode.ServiceAuditUndoError)
	}
	//给wf发审核撤回的消息
	msg := &common.AuditCancelMsg{}
	msg.ApplyIDs = []string{service.ApplyID}
	msg.Cause.ZHCN = "revocation" //固定单词，否则审核结果不是undo，而是reject
	msg.Cause.ZHTW = "revocation"
	msg.Cause.ENUS = "revocation"
	err = u.wf.AuditCancel(msg)
	if err != nil {
		log.WithContext(ctx).Error("ServiceDomain UndoPublishAudit  --> 发布审核撤回消息发送失败：", zap.Error(err), zap.Any("msg", msg))
		return nil, err
	}
	log.Info("producer workflow msg", zap.String("topic", mq.TopicWorkflowAuditCancel), zap.Any("msg", msg))
	//入队成功就改库中的状态
	resp, err = u.serviceRepo.UpdateServicePublishStatus(ctx, serviceID, enum.PublishStatusUnPublished)
	return
}

func (u *ServiceDomain) UndoChangeAudit(ctx context.Context, serviceID string) (resp *dto.ServiceIdRes, err error) {
	//List返回的是变更前已发布的版本的ID，先兑换成变更审核中的ID
	sid, err := u.serviceRepo.GetIdByPublishedId(ctx, serviceID)
	if err != nil {
		return nil, err
	}
	//状态校验
	service, err := u.serviceRepo.ServiceGetFields(ctx, sid, []string{"apply_id", "audit_type", "publish_status"})
	if err != nil {
		return nil, err
	}
	if service.PublishStatus != enum.PublishStatusChangeAuditing || service.AuditType != enum.AuditTypeChange {
		return nil, errorcode.Desc(errorcode.ServiceAuditUndoError)
	}
	//给wf发审核撤回的消息
	msg := &common.AuditCancelMsg{}
	msg.ApplyIDs = []string{service.ApplyID}
	msg.Cause.ZHCN = "revocation"
	msg.Cause.ZHTW = "revocation"
	msg.Cause.ENUS = "revocation"
	err = u.wf.AuditCancel(msg)
	if err != nil {
		log.WithContext(ctx).Error("ServiceDomain UndoChangeAudit  --> 变更审核撤回消息发送失败：", zap.Error(err), zap.Any("msg", msg))
		return nil, err
	}
	log.Info("producer workflow msg", zap.String("topic", mq.TopicWorkflowAuditCancel), zap.Any("msg", msg))
	//入队成功就改库中的状态，审核撤回后，变更版本作为已发布版本的草稿
	resp, err = u.serviceRepo.UndoChangeAuditToUpdateService(ctx, sid)
	return
}

func (u *ServiceDomain) UndoUpAudit(ctx context.Context, serviceID string) (resp *dto.ServiceIdRes, err error) {
	//状态校验
	service, err := u.serviceRepo.ServiceGetFields(ctx, serviceID, []string{"apply_id", "audit_type", "publish_status", "status"})
	if err != nil {
		return nil, err
	}
	if service.AuditType != enum.AuditTypeOnline || service.Status != enum.LineStatusUpAuditing {
		return nil, errorcode.Desc(errorcode.ServiceAuditUndoError)
	}
	//给wf发审核撤回的消息
	msg := &common.AuditCancelMsg{}
	msg.ApplyIDs = []string{service.ApplyID}
	msg.Cause.ZHCN = "revocation"
	msg.Cause.ZHTW = "revocation"
	msg.Cause.ENUS = "revocation"
	err = u.wf.AuditCancel(msg)
	if err != nil {
		log.WithContext(ctx).Error("ServiceDomain UndoUpAudit  --> 上架审核撤回消息发送失败：", zap.Error(err), zap.Any("msg", msg))
		return nil, err
	}
	log.Info("producer workflow msg", zap.String("topic", mq.TopicWorkflowAuditCancel), zap.Any("msg", msg))
	//入队成功就改库中的状态
	resp, err = u.serviceRepo.ServiceUpdateStatus(ctx, serviceID, enum.LineStatusNotLine)
	return
}

func (u *ServiceDomain) UndoDownAudit(ctx context.Context, serviceID string) (resp *dto.ServiceIdRes, err error) {
	//状态校验
	service, err := u.serviceRepo.ServiceGetFields(ctx, serviceID, []string{"apply_id", "audit_type", "publish_status", "status"})
	if err != nil {
		return nil, err
	}
	if service.AuditType != enum.AuditTypeOffline || service.Status != enum.LineStatusDownAuditing {
		return nil, errorcode.Desc(errorcode.ServiceAuditUndoError)
	}
	//给wf发审核撤回的消息
	msg := &common.AuditCancelMsg{}
	msg.ApplyIDs = []string{service.ApplyID}
	msg.Cause.ZHCN = "revocation"
	msg.Cause.ZHTW = "revocation"
	msg.Cause.ENUS = "revocation"
	err = u.wf.AuditCancel(msg)
	if err != nil {
		log.WithContext(ctx).Error("ServiceDomain UndoDownAudit  --> 下架审核撤回消息发送失败：", zap.Error(err), zap.Any("msg", msg))
		return nil, err
	}
	log.Info("producer workflow msg", zap.String("topic", mq.TopicWorkflowAuditCancel), zap.Any("msg", msg))
	//入队成功就改库中的状态
	resp, err = u.serviceRepo.ServiceUpdateStatus(ctx, serviceID, enum.LineStatusOnLine)
	return
}

func (u *ServiceDomain) GetDraftVersion(ctx context.Context, serviceID string) (resp *dto.ServiceGetRes, err error) {
	exist, err := u.serviceRepo.IsServiceIDExist(ctx, serviceID)
	if err != nil {
		return nil, err
	}
	if !exist {
		log.WithContext(ctx).Error("GetDraftVersion", zap.Error(errorcode.Desc(errorcode.ServiceIDNotExist)))
		return nil, errorcode.Desc(errorcode.ServiceIDNotExist)
	}
	resp, err = u.serviceRepo.GetDraftService(ctx, serviceID)
	if err != nil {
		return nil, err
	}
	return
}

func (u *ServiceDomain) AbandonServiceChange(ctx context.Context, serviceID string) (resp *dto.ServiceIdRes, err error) {
	exist, err := u.serviceRepo.IsServiceIDExist(ctx, serviceID)
	if err != nil {
		return nil, err
	}
	if !exist {
		log.WithContext(ctx).Error("UndoAuditByType", zap.Error(errorcode.Desc(errorcode.ServiceIDNotExist)))
		return nil, errorcode.Desc(errorcode.ServiceIDNotExist)
	}
	service, err := u.serviceRepo.ServiceGetFields(ctx, serviceID, []string{"audit_type", "publish_status", "status", "is_changed"})
	if err != nil {
		return nil, err
	}
	//状态校验
	if !(service.PublishStatus == enum.PublishStatusChangeReject || service.PublishStatus == enum.PublishStatusPublished) {
		return nil, errorcode.Desc(errorcode.ServiceAbandonChangeError)
	}

	if service.PublishStatus == enum.PublishStatusPublished && service.IsChanged == "1" {
		//List返回的是变更前已发布的版本的ID，先兑换成变更审核中的ID
		sid, err := u.serviceRepo.GetIdByPublishedId(ctx, serviceID)
		if err != nil {
			return nil, err
		}
		serviceID = sid
	}

	//恢复到已发布的内容
	resp, err = u.serviceRepo.RecoverToPublished(ctx, serviceID)
	return
}

func (u *ServiceDomain) checkDepartmentAndSubjectDomainIsExist(ctx context.Context, serviceID string) error {
	service, err := u.serviceRepo.ServiceGetFields(ctx, serviceID, []string{"subject_domain_id", "department_id"})
	if err != nil {
		return err
	}
	// 检查部门ID
	if service.DepartmentID != "" {
		_, err := u.configurationCenterRepo.DepartmentGet(ctx, service.DepartmentID)
		if err != nil {
			return errorcode.Desc(errorcode.DepartmentIdNotExist)
		}
	}
	// 检查主题域ID
	if service.SubjectDomainID != "" {
		_, err := u.DataSubjectRepo.DataSubjectGet(ctx, service.SubjectDomainID)
		if err != nil {
			return errorcode.Desc(errorcode.SubjectDomainIdNotExist)
		}
	}
	return nil
}

func (u *ServiceDomain) ServiceUpOrDown(ctx context.Context, serviceID string, operateType string) (resp *dto.ServiceIdRes, err error) {
	//存在性校验
	exist, err := u.serviceRepo.IsServiceIDExist(ctx, serviceID)
	if err != nil {
		return nil, err
	}
	if !exist {
		log.WithContext(ctx).Error("UndoAuditByType", zap.Error(errorcode.Desc(errorcode.ServiceIDNotExist)))
		return nil, errorcode.Desc(errorcode.ServiceIDNotExist)
	}
	//检查部门ID和主题域ID，以防期间组织架构或主题域被删除
	//err = u.checkDepartmentAndSubjectDomainIsExist(ctx, serviceID)
	if err != nil {
		return nil, err
	}
	//判断是否绑定上下线审核流程
	isBindOnline, isBindOffline, err := u.auditProcessBindRepo.QueryAuditProcessBindInfo(ctx)
	if err != nil {
		return nil, err
	}
	switch operateType {
	case "up":
		resp, err = u.ServiceOnlineOperate(ctx, serviceID, isBindOnline, "up")
	case "down":
		resp, err = u.ServiceOnlineOperate(ctx, serviceID, isBindOffline, "down")
	default:
		return nil, fmt.Errorf("unsupported operateType %q", operateType)
	}
	if err != nil {
		return nil, err
	}
	return
}

func (u *ServiceDomain) ServiceOnlineOperate(ctx context.Context, serviceID string, isBindProcess bool, operate string) (resp *dto.ServiceIdRes, err error) {
	//状态校验
	service, err := u.serviceRepo.ServiceGetFields(ctx, serviceID, []string{"service_id", "audit_type", "publish_status", "status", "changed_service_id", "is_changed"})
	if err != nil {
		return nil, err
	}
	if service.PublishStatus == enum.PublishStatusPublished && service.IsChanged == "1" {
		//List返回的是变更前已发布的版本的ID，先兑换成变更审核不通过或变更审核中的ID
		sid, err := u.serviceRepo.GetIdByPublishedId(ctx, serviceID)
		if err != nil {
			return nil, err
		}
		service, err = u.serviceRepo.ServiceGetFields(ctx, sid, []string{"service_id", "audit_type", "publish_status", "status", "changed_service_id", "is_changed"})
	}
	auditInst := dto.AuditProcessInstanceCreateReq{
		AuditType: enum.AuditTypeOnline,
	}
	var ok bool = true
	if "up" == operate {
		auditInst.AuditType = enum.AuditTypeOnline
		_, ok = enum.ServiceAllowedUpStatus[service.PublishStatus+service.Status]
	} else {
		auditInst.AuditType = enum.AuditTypeOffline
		_, ok = enum.ServiceAllowedDownStatus[service.PublishStatus+service.Status]
	}

	if !ok {
		log.WithContext(ctx).Error("ServiceAllowedUpStatus", zap.Error(errorcode.Desc(errorcode.ServiceUpStatusError)))
		return nil, errorcode.Desc(errorcode.ServiceUpStatusError)
	}

	switch service.PublishStatus {
	case enum.PublishStatusPublished:
		auditInst.ServiceID = serviceID
	case enum.PublishStatusChangeAuditing, enum.PublishStatusChangeReject: //变更审核中上线，把已发布版本上线（变更的时候，Vn版本不会下线），因此前提是已发布的版本未上线或者已下线
		//送已发布的版本去审核
		auditInst.ServiceID = service.ChangedServiceId
		// 将Vn+1 版本也上线，但不用送去审核
		if !isBindProcess {
			if "up" == operate {
				_, err = u.serviceRepo.ServiceUpdateStatus(ctx, service.ServiceID, enum.LineStatusOnLine)
			} else {
				_, err = u.serviceRepo.ServiceUpdateStatus(ctx, service.ServiceID, enum.LineStatusOffLine)
			}
		} else {
			if "up" == operate {
				_, err = u.serviceRepo.ServiceUpdateStatus(ctx, service.ServiceID, enum.LineStatusUpAuditing)
			} else {
				_, err = u.serviceRepo.ServiceUpdateStatus(ctx, service.ServiceID, enum.LineStatusDownAuditing)
			}

		}
	}
	//未绑定上线审核流程，直接更新库并更新ES；绑定，发wf消息，并更新库为上线审核中的状态
	err = u.AuditProcessInstanceCreate(ctx, &auditInst)
	if err != nil {
		log.WithContext(ctx).Error("ServiceUp  --> 发送审核实例失败：", zap.Error(err))
		return nil, err
	}

	return
}

func (u *ServiceDomain) ServiceChange(ctx context.Context, req *dto.ServiceChangeReq) (resp *dto.ServiceIdRes, err error) {
	//存在性校验
	exist, err := u.serviceRepo.IsServiceIDExist(ctx, req.ServiceID)
	if err != nil {
		log.WithContext(ctx).Error("ServiceChange", zap.Error(err))
		return nil, err
	}
	if !exist {
		log.WithContext(ctx).Error("ServiceChange", zap.Error(errorcode.Desc(errorcode.ServiceIDNotExist)))
		return nil, errorcode.Desc(errorcode.ServiceIDNotExist)
	}

	//状态校验：已发布、发布审核不通过
	service, err := u.serviceRepo.ServiceGetFields(ctx, req.ServiceID, []string{"audit_type", "publish_status", "status", "is_changed"})
	if err != nil {
		return nil, err
	}
	if !(service.PublishStatus == enum.PublishStatusPublished || service.PublishStatus == enum.PublishStatusChangeReject) {
		return nil, errorcode.Desc(errorcode.ServiceChangeStatusError)
	}
	//暂存状态下不检查必填项
	if !req.IsTemp {
		err = u.serviceCheckParam(ctx, req.ServiceInfo, req.ServiceParam)
	}
	if err != nil {
		return nil, err
	}

	if req.ServiceParam.CreateModel == "script" {
		_, err := u.CheckScript(ctx, req.ServiceParam.Script)
		if err != nil {
			return nil, err
		}
	}

	if req.ServiceParam.CreateModel == "wizard" {
		req.ServiceParam.Script = ""
	}

	if service.PublishStatus == enum.PublishStatusPublished && service.IsChanged != "1" {
		resp, err = u.serviceRepo.ServiceChangeInPublished(ctx, req) //已发布状态下进行变更和暂存
		if err != nil {
			log.WithContext(ctx).Error("ServiceChangeInPublished  --> 更新数据失败：", zap.Error(err))
			return nil, err
		}
		if !req.IsTemp {
			auditInst := dto.AuditProcessInstanceCreateReq{
				ServiceID: resp.ServiceID,
				AuditType: enum.AuditTypeChange,
			}
			err = u.AuditProcessInstanceCreate(ctx, &auditInst)
			if err != nil {
				log.WithContext(ctx).Error("ServiceChangeInPublished  --> 发送审核实例失败：", zap.Error(err))
				return nil, err
			}
			// 回调：接口变更（非暂存）
			// if u.callback != nil {
			// 	newService, getErr := u.serviceRepo.ServiceGet(ctx, req.ServiceID)
			// 	if getErr == nil {
			// 		serviceModel := &model.Service{
			// 			ServiceID:   newService.ServiceInfo.ServiceID,
			// 			ServiceName: newService.ServiceInfo.ServiceName,
			// 			ServicePath: newService.ServiceInfo.ServicePath,
			// 			Description: &newService.ServiceInfo.Description,
			// 			AppsID:      &newService.ServiceInfo.AppsId,
			// 		}
			// 		serviceCallback, callbackErr := u.callback.OnUpdateService(ctx, serviceModel)
			// 		if callbackErr != nil {
			// 			log.WithContext(ctx).Error("ServiceChange callback OnUpdateService failed", zap.String("serviceID", req.ServiceID), zap.Error(callbackErr))
			// 		} else {
			// 			if serviceCallback != nil && serviceCallback.SyncFlag != nil {
			// 				updateData := map[string]interface{}{
			// 					"sync_flag": serviceCallback.SyncFlag,
			// 					"sync_msg":  serviceCallback.SyncMsg,
			// 					"sync_type": serviceCallback.SyncType,
			// 				}
			// 				if updateErr := u.serviceRepo.UpdateServiceCallbackInfo(ctx, req.ServiceID, updateData); updateErr != nil {
			// 					log.WithContext(ctx).Error("ServiceChange update callback info failed", zap.String("serviceID", req.ServiceID), zap.Error(updateErr))
			// 				}
			// 			}
			// 		}
			// 	}
			// }
		}
	} else {
		//List返回的是变更前已发布的版本的ID，先兑换成变更审核不通过的ID
		sid, err := u.serviceRepo.GetIdByPublishedId(ctx, req.ServiceID)
		if err != nil {
			return nil, err
		}
		req.ServiceID = sid
		resp, err = u.serviceRepo.ServiceChangeInChangeAuditReject(ctx, req) //变更审核未通过时进行变更和暂存
		if err != nil {
			log.WithContext(ctx).Error("ServiceChangeInChangeAuditReject  --> 更新数据失败：", zap.Error(err))
			return nil, err
		}
		if !req.IsTemp {
			auditInst := dto.AuditProcessInstanceCreateReq{
				ServiceID: resp.ServiceID,
				AuditType: enum.AuditTypeChange,
			}
			err = u.AuditProcessInstanceCreate(ctx, &auditInst)
			if err != nil {
				log.WithContext(ctx).Error("ServiceChangeInPublished  --> 发送审核实例失败：", zap.Error(err))
				return nil, err
			}
			// 回调：接口变更（非暂存）
			// if u.callback != nil {
			// 	newService, getErr := u.serviceRepo.ServiceGet(ctx, req.ServiceID)
			// 	if getErr == nil {
			// 		serviceModel := &model.Service{
			// 			ServiceID:   newService.ServiceInfo.ServiceID,
			// 			ServiceName: newService.ServiceInfo.ServiceName,
			// 			ServicePath: newService.ServiceInfo.ServicePath,
			// 			Description: &newService.ServiceInfo.Description,
			// 			AppsID:      &newService.ServiceInfo.AppsId,
			// 		}
			// 		serviceCallback, callbackErr := u.callback.OnUpdateService(ctx, serviceModel)
			// 		if callbackErr != nil {
			// 			log.WithContext(ctx).Error("ServiceChange callback OnUpdateService failed", zap.String("serviceID", req.ServiceID), zap.Error(callbackErr))
			// 		} else {
			// 			if serviceCallback != nil && serviceCallback.SyncFlag != nil {
			// 				updateData := map[string]interface{}{
			// 					"sync_flag": serviceCallback.SyncFlag,
			// 					"sync_msg":  serviceCallback.SyncMsg,
			// 					"sync_type": serviceCallback.SyncType,
			// 				}
			// 				if updateErr := u.serviceRepo.UpdateServiceCallbackInfo(ctx, req.ServiceID, updateData); updateErr != nil {
			// 					log.WithContext(ctx).Error("ServiceChange update callback info failed", zap.String("serviceID", req.ServiceID), zap.Error(updateErr))
			// 				}
			// 			}
			// 		}
			// 	}
			// }
		}
	}

	if err != nil {
		return nil, err
	}

	// 获取接口服务修改之后的值，用于记录审计日志
	newService, err := u.serviceRepo.ServiceGet(ctx, req.ServiceID)
	if err != nil {
		return nil, err
	}

	// 记录审计日志：更新、发布接口
	if req.IsTemp {
		// 暂存
		u.auditLogUpdateAPI(ctx, &newService.ServiceInfo)
	} else {
		// 发布
		u.auditLogPublicAPI(ctx, newService.ServiceInfo.ServiceID, newService.ServiceInfo.ServiceName)
	}

	return
}

// GetOwnerID 获取指定接口服务的 OwnerID
func (u *ServiceDomain) GetOwnerID(ctx context.Context, id string) (string, error) {
	return u.serviceRepo.GetOwnerID(ctx, id)
}
func (u *ServiceDomain) GetServicesMaxResponse(ctx context.Context, req *dto.GetServicesMaxResponseReq) ([]*dto.DataTableResponseParam, error) {
	servicesMaxResponse, err := u.serviceRepo.GetServicesMaxResponse(ctx, req)
	if err != nil {
		return nil, err
	}
	res := make([]*dto.DataTableResponseParam, len(servicesMaxResponse))
	for i, p := range servicesMaxResponse {
		res[i] = &dto.DataTableResponseParam{
			CNName:      p.CnName,
			EnName:      p.EnName,
			DataType:    p.DataType,
			Description: p.Description,
			Sort:        p.Sort,
			Masking:     p.Masking,
			Sequence:    int64(p.Sequence),
		}
	}
	return res, nil
}

// BatchPublishAndOnline 批量上线和发布接口服务，不经过审核
func (u *ServiceDomain) BatchPublishAndOnline(ctx context.Context, ids []string) error {
	// 更新指定接口的发布、上线状态
	return u.serviceRepo.ServiceUpdateStatusAndPublishStatus(ctx, enum.LineStatusOnLine, enum.PublishStatusPublished, gorm.ServiceUpdateOptions{Filter: gorm.ServiceIDs(ids)})
}

// start GetStatusStatistics
type GetStatusStatisticsReq struct {
	ServiceType string `form:"service_type"`
}

type GetStatusStatisticsRes struct {
	TotalStatistics    *StatusStatistics `json:"total_statistics"`
	GenerateStatistics *StatusStatistics `json:"generate_statistics"`
	RegisterStatistics *StatusStatistics `json:"register_statistics"`
}

type StatusStatistics struct {
	ServiceCount                          int `json:"service_count"`
	UnpublishedCount                      int `json:"unpublished_count"`
	PublishedCount                        int `json:"published_count"`
	NotlineCount                          int `json:"notline_count"`
	OnLineCount                           int `json:"online_count"`
	OfflineCount                          int `json:"offline_count"`
	AfDataApplicationPublishAuditingCount int `json:"af_data_application_publish_auditing_count"`
	AfDataApplicationPublishRejectCount   int `json:"af_data_application_publish_reject_count"`
	AfDataApplicationPublishPassCount     int `json:"af_data_application_publish_pass_count"`
	AfDataApplicationOnlineAuditingCount  int `json:"af_data_application_online_auditing_count"`
	AfDataApplicationOnlinePassCount      int `json:"af_data_application_online_pass_count"`
	AfDataApplicationOnlineRejectCount    int `json:"af_data_application_online_reject_count"`
	AfDataApplicationOfflineAuditingCount int `json:"af_data_application_offline_auditing_count"`
	AfDataApplicationOfflinePassCount     int `json:"af_data_application_offline_pass_count"`
	AfDataApplicationOfflineRejectCount   int `json:"af_data_application_offline_reject_count"`
}

func (u *ServiceDomain) GetStatusStatistics(ctx context.Context, req *GetStatusStatisticsReq) (res *GetStatusStatisticsRes, err error) {
	res = &GetStatusStatisticsRes{}

	if req.ServiceType == "" {
		// 如果没有指定服务类型，返回总体统计和分类统计

		// 1. 总体统计
		totalStats, err := u.serviceRepo.GetStatusStatistics(ctx, "")
		if err != nil {
			log.WithContext(ctx).Error("GetStatusStatistics total", zap.Error(err))
			return nil, err
		}
		res.TotalStatistics = convertToStatusStatistics(totalStats)

		// 2. service_generate 统计
		generateStats, err := u.serviceRepo.GetStatusStatistics(ctx, "service_generate")
		if err != nil {
			log.WithContext(ctx).Error("GetStatusStatistics service_generate", zap.Error(err))
			return nil, err
		}
		res.GenerateStatistics = convertToStatusStatistics(generateStats)

		// 3. service_register 统计
		registerStats, err := u.serviceRepo.GetStatusStatistics(ctx, "service_register")
		if err != nil {
			log.WithContext(ctx).Error("GetStatusStatistics service_register", zap.Error(err))
			return nil, err
		}
		res.RegisterStatistics = convertToStatusStatistics(registerStats)
	} else {
		// 如果指定了服务类型，只返回对应类型的统计
		stats, err := u.serviceRepo.GetStatusStatistics(ctx, req.ServiceType)
		if err != nil {
			log.WithContext(ctx).Error("GetStatusStatistics specified type",
				zap.String("serviceType", req.ServiceType), zap.Error(err))
			return nil, err
		}
		res.TotalStatistics = convertToStatusStatistics(stats)
	}

	log.WithContext(ctx).Info("GetStatusStatistics success",
		zap.String("serviceType", req.ServiceType))

	return res, nil
}

// convertToStatusStatistics 转换数据库统计结果为响应格式
func convertToStatusStatistics(dbStats *gorm.ServiceStatusStatistics) *StatusStatistics {
	if dbStats == nil {
		return &StatusStatistics{}
	}

	return &StatusStatistics{
		ServiceCount:     int(dbStats.ServiceCount),
		UnpublishedCount: int(dbStats.UnpublishedCount),
		PublishedCount:   int(dbStats.PublishedCount),
		NotlineCount:     int(dbStats.NotlineCount),
		OnLineCount:      int(dbStats.OnLineCount),
		OfflineCount:     int(dbStats.OfflineCount),

		// 发布审核相关统计
		AfDataApplicationPublishAuditingCount: int(dbStats.AfDataApplicationPublishAuditingCount),
		AfDataApplicationPublishRejectCount:   int(dbStats.AfDataApplicationPublishRejectCount),
		AfDataApplicationPublishPassCount:     int(dbStats.AfDataApplicationPublishPassCount),

		// 上线审核相关统计
		AfDataApplicationOnlineAuditingCount: int(dbStats.AfDataApplicationOnlineAuditingCount),
		AfDataApplicationOnlinePassCount:     int(dbStats.AfDataApplicationOnlinePassCount),
		AfDataApplicationOnlineRejectCount:   int(dbStats.AfDataApplicationOnlineRejectCount),

		// 下线审核相关统计
		AfDataApplicationOfflineAuditingCount: int(dbStats.AfDataApplicationOfflineAuditingCount),
		AfDataApplicationOfflinePassCount:     int(dbStats.AfDataApplicationOfflinePassCount),
		AfDataApplicationOfflineRejectCount:   int(dbStats.AfDataApplicationOfflineRejectCount),
	}
}

// end GetStatusStatistics

// start GetDepartmentStatistics
type GetDepartmentStatisticsReq struct {
	Top int `form:"top"` // 数量排序
}

type GetDepartmentStatisticsRes struct {
	DepartmentStatistics []*DepartmentStatistics `json:"department_statistics"`
	DepartmentCount      int                     `json:"department_count"`
}

type DepartmentStatistics struct {
	DepartmentID   string  `json:"department_id"`   // 部门ID
	DepartmentName string  `json:"department_name"` // 部门名称
	TotalCount     int     `json:"total_count"`     // 总数量
	PublishedCount int     `json:"published_count"` // 已发布数量
	Rate           float64 `json:"rate"`            // 已发布数量/总数量
}

func (u *ServiceDomain) GetDepartmentStatistics(ctx context.Context, req *GetDepartmentStatisticsReq) (res *GetDepartmentStatisticsRes, err error) {
	// 调用数据库查询方法
	dbResults, err := u.serviceRepo.GetDepartmentStatistics(ctx, req.Top)
	if err != nil {
		log.WithContext(ctx).Error("GetDepartmentStatistics", zap.Error(err))
		return nil, err
	}

	// 转换为响应格式
	var departmentStatistics []*DepartmentStatistics
	for _, dbResult := range dbResults {
		// 计算发布率
		var rate float64
		if dbResult.TotalCount > 0 {
			rate = float64(dbResult.PublishedCount) / float64(dbResult.TotalCount)
		}

		departmentStat := &DepartmentStatistics{
			DepartmentID:   dbResult.DepartmentID,
			DepartmentName: dbResult.DepartmentName,
			TotalCount:     int(dbResult.TotalCount),
			PublishedCount: int(dbResult.PublishedCount),
			Rate:           rate,
		}

		departmentStatistics = append(departmentStatistics, departmentStat)
	}

	res = &GetDepartmentStatisticsRes{
		DepartmentStatistics: departmentStatistics,
		DepartmentCount:      len(departmentStatistics),
	}

	log.WithContext(ctx).Info("GetDepartmentStatistics success",
		zap.Int("top", req.Top),
		zap.Int("departmentCount", res.DepartmentCount))

	return res, nil
}

func (u *ServiceDomain) ServiceSyncCallback(ctx context.Context, serviceID string) (res *ServiceSyncCallbackRes, err error) {
	callback, err := u.serviceRepo.ServiceSyncCallback(ctx, serviceID)
	if err != nil {
		log.WithContext(ctx).Error("ServiceSyncCallback", zap.Error(err))
		return nil, err
	}

	res = &ServiceSyncCallbackRes{
		Result: callback.Result,
		Msg:    callback.Msg,
	}

	return res, nil
}

type ServiceSyncCallbackRes struct {
	Result string `json:"result"`
	Msg    string `json:"msg"`
}

// GetServicesByIDs 通过接口ID列表获取接口列表
func (u *ServiceDomain) GetServicesByIDs(ctx context.Context, ids []string) (*driven.ArrayResult[v1.Service], error) {
	ctx, span := trace.StartInternalSpan(ctx)
	defer func() { trace.TelemetrySpanEnd(span, nil) }()

	serviceList, err := u.serviceRepo.GetServicesByIDs(ctx, ids)
	if err != nil {
		return nil, err
	}

	// 转换为v1.Service格式
	var services []*v1.Service
	for _, serviceInfo := range serviceList {
		// 转换Owners
		var owners []v1.DataApplicationServiceOwner
		for _, owner := range serviceInfo.Owners {
			owners = append(owners, v1.DataApplicationServiceOwner{
				OwnerID:   owner.OwnerId,
				OwnerName: owner.OwnerName,
			})
		}

		// 转换Department
		department := v1.Department{
			Id:   serviceInfo.Department.ID,
			Name: serviceInfo.Department.Name,
		}

		// 转换File
		file := v1.File{
			FileID:   serviceInfo.File.FileID,
			FileName: serviceInfo.File.FileName,
		}

		service := &v1.Service{
			ServiceInfo: v1.ServiceInfo{
				ServiceID:          serviceInfo.ServiceID,
				ServiceCode:        serviceInfo.ServiceCode,
				ServiceName:        serviceInfo.ServiceName,
				Department:         department,
				PublishStatus:      serviceInfo.PublishStatus,
				PublishTime:        serviceInfo.PublishTime,
				OnlineStatus:       serviceInfo.Status,
				Status:             serviceInfo.Status,
				AuditType:          serviceInfo.AuditType,
				AuditStatus:        serviceInfo.AuditStatus,
				AuditAdvice:        serviceInfo.AuditAdvice,
				OnlineAuditAdvice:  serviceInfo.OnlineAuditAdvice,
				SubjectDomainId:    serviceInfo.SubjectDomainId,
				SubjectDomainName:  serviceInfo.SubjectDomainName,
				ServiceType:        serviceInfo.ServiceType,
				SyncFlag:           serviceInfo.SyncFlag,
				SyncMsg:            serviceInfo.SyncMsg,
				UpdateFlag:         serviceInfo.UpdateFlag,
				UpdateMsg:          serviceInfo.UpdateMsg,
				PaasID:             serviceInfo.PaasID,
				PrePath:            serviceInfo.PrePath,
				OwnerId:            serviceInfo.OwnerId,
				OwnerName:          serviceInfo.OwnerName,
				Owners:             owners,
				GatewayUrl:         serviceInfo.GatewayUrl,
				ServicePath:        serviceInfo.ServicePath,
				BackendServiceHost: serviceInfo.BackendServiceHost,
				BackendServicePath: serviceInfo.BackendServicePath,
				HTTPMethod:         serviceInfo.HTTPMethod,
				ReturnType:         serviceInfo.ReturnType,
				Protocol:           serviceInfo.Protocol,
				File:               file,
				Description:        serviceInfo.Description,
				RateLimiting:       serviceInfo.RateLimiting,
				Timeout:            serviceInfo.Timeout,
				OnlineTime:         serviceInfo.OnlineTime,
				ChangedServiceId:   serviceInfo.ChangedServiceId,
				IsChanged:          serviceInfo.IsChanged,
				CreateTime:         serviceInfo.CreateTime,
				UpdateTime:         serviceInfo.UpdateTime,
				CreatedBy:          serviceInfo.CreatedBy,
				UpdateBy:           serviceInfo.UpdateBy,
			},
		}

		services = append(services, service)
	}

	return &driven.ArrayResult[v1.Service]{
		Entries: services,
	}, nil
}

func (u *ServiceDomain) CheckFavorite(ctx context.Context, req *dto.ServiceGetReq, uid string) (error, *data_catalog.CheckV1Resp) {
	// 注意：原代码中使用了未定义的变量 formView 和 f，这里需要根据实际逻辑进行调整
	// 假设 id 应该从 req 中获取，f 应该是 dataCatalogRepo
	id := req.ServiceID // 假设 req 中有 ID 字段，需要根据实际结构体调整

	result := &data_catalog.CheckV1Resp{}

	checkReq := &data_catalog.CheckV1Req{
		ResID:     id,
		ResType:   "interface-svc",
		CreatedBy: uid,
	}

	fav, err := u.dataCatalogV1.GetResourceFavoriteByID(ctx, checkReq)

	// 打印这个结果
	log.Infof("------------------->data-catalog-v1-check-favorite-result: %v", fav)

	if err != nil {
		return err, nil
	}

	// 调整判断逻辑
	result.IsFavored = false

	if fav != nil {
		// 查找第一个非空的favorID
		for favorID := range fav {
			if favorID != 0 {
				result.IsFavored = true
				result.FavorID = favorID
				break
			}
		}
	}

	return nil, result
}

func (u *ServiceDomain) QueryAuthedSubService(ctx context.Context, req *dto.HasSubServiceAuthParamReq) ([]string, error) {
	serviceIDSlice := strings.Split(req.ServiceID, ",")
	ds, err := u.serviceRepo.UserAuthedServices(ctx, req.UserID, serviceIDSlice...)
	if err != nil {
		return nil, err
	}
	return lo.Uniq(lo.Times(len(ds), func(index int) string {
		return ds[index].ServiceID
	})), nil
}
