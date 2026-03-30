package driver

import (
	"bytes"

	middleware_v1 "github.com/kweaver-ai/idrm-go-common/middleware/v1"

	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest"

	"encoding/json"
	"io"
	"io/ioutil"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/google/wire"
	"go.uber.org/zap"

	"github.com/kweaver-ai/dsg/services/apps/data-application-service/adapter/driver/v1/audit_process_bind"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/adapter/driver/v1/developer"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/adapter/driver/v1/file"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/adapter/driver/v1/service"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/adapter/driver/v1/service_apply"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/adapter/driver/v1/service_call_record"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/adapter/driver/v1/service_daily_record"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/adapter/driver/v1/service_stats"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/adapter/driver/v1/sub_service"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/adapter/driver/v1/subject_domain"
	"github.com/kweaver-ai/idrm-go-common/audit"
	"github.com/kweaver-ai/idrm-go-common/middleware"
	"github.com/kweaver-ai/idrm-go-common/rest/configuration_center"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/trace"
)

var _ IRouter = (*Router)(nil)

var RouterSet = wire.NewSet(wire.Struct(new(Router), "*"), wire.Bind(new(IRouter), new(*Router)))

type bodyLogWriter struct {
	gin.ResponseWriter
	body *bytes.Buffer
}

func (w bodyLogWriter) Write(b []byte) (int, error) {
	w.body.Write(b)
	return w.ResponseWriter.Write(b)
}

func RequestLoggerMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		var buf bytes.Buffer
		tee := io.TeeReader(c.Request.Body, &buf)
		body, _ := ioutil.ReadAll(tee)
		c.Request.Body = ioutil.NopCloser(&buf)

		buffer := new(bytes.Buffer)
		if len(body) > 0 {
			if strings.ToLower(c.ContentType()) == "application/json" {
				if err := json.Compact(buffer, body); err != nil {
					log.WithContext(c).Error("RequestLoggerMiddleware", zap.Error(err))
				}
			}
		}

		log.WithContext(c).Info("request",
			zap.String("remote_ip", c.RemoteIP()),
			zap.String("method", c.Request.Method),
			zap.String("uri", c.Request.URL.String()),
			zap.String("body", buffer.String()),
		)
		c.Next()
	}
}

func ResponseLoggerMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		blw := &bodyLogWriter{body: bytes.NewBufferString(""), ResponseWriter: c.Writer}
		c.Writer = blw

		c.Next()

		if c.Writer.Status() != 200 {
			log.WithContext(c).Errorf("%s", blw.body.String())
		}
	}
}

type IRouter interface {
	Register(r *gin.Engine) error
}

type Router struct {
	Middleware                   middleware.Middleware
	DeveloperController          *developer.DeveloperController
	ServiceController            *service.ServiceController
	FileController               *file.FileController
	AuditProcessBindController   *audit_process_bind.AuditProcessBindController
	ServiceApplyController       *service_apply.ServiceApplyController
	ServiceStatsController       *service_stats.ServiceStatsController
	SubjectDomainController      *subject_domain.SubjectDomainController
	ServiceCallRecordController  *service_call_record.ServiceCallRecordController
	ServiceDailyRecordController *service_daily_record.ServiceDailyRecordController
	// 审计日志的日志器
	AuditLogger audit.Logger
	// 配置中心客户端
	ConfigurationCenterDriven configuration_center.Driven
	SubServiceDomainApi       *sub_service.SubServiceService
}

func (r *Router) Register(engine *gin.Engine) error {
	engine.Use(trace.MiddlewareTrace(), RequestLoggerMiddleware(), ResponseLoggerMiddleware())
	r.RegisterApi(engine)
	r.RegisterFrontendApi(engine)
	r.RegisterInternalApi(engine)
	rest.RegisterALLToInternal(engine)
	return nil
}

func (r *Router) RegisterApi(engine *gin.Engine) {
	router := engine.Group("/api/data-application-service/v1", r.Middleware.TokenInterception())
	//router := engine.Group("/api/data-application-service/v1", middleware.LocalToken())
	// 添加中间件：配置审计日志的日志器，因为需要配置日志器的 Operator，所以中间
	// 件必须在获取用户信息之后
	router.Use(middleware_v1.AuditLogger(r.AuditLogger, r.ConfigurationCenterDriven))

	//文件
	fileRouter := router.Group("/files")
	fileRouter.POST("", r.FileController.Upload)                    //文件上传
	fileRouter.GET("/download/:file_id", r.FileController.Download) //文件下载

	//开发商
	developerRouter := router.Group("/developers")
	developerRouter.POST("", r.DeveloperController.DeveloperCreate)       //开发商创建
	developerRouter.GET("", r.DeveloperController.DeveloperList)          //开发商列表
	developerRouter.GET("/:id", r.DeveloperController.DeveloperGet)       //开发商详情
	developerRouter.PUT("/:id", r.DeveloperController.DeveloperUpdate)    //开发商更新
	developerRouter.DELETE("/:id", r.DeveloperController.DeveloperDelete) //开发商删除

	//审核流程绑定
	auditProcessBindRouter := engine.Group("/api/data-application-service/v1/audit-process", r.Middleware.TokenInterception())
	auditProcessBindRouter.POST("", r.AuditProcessBindController.AuditProcessBindCreate)            //审核流程绑定创建
	auditProcessBindRouter.GET("", r.AuditProcessBindController.AuditProcessBindList)               //审核流程绑定列表
	auditProcessBindRouter.GET("/:bind_id", r.AuditProcessBindController.AuditProcessBindGet)       //审核流程绑定详情
	auditProcessBindRouter.PUT("/:bind_id", r.AuditProcessBindController.AuditProcessBindUpdate)    //审核流程绑定更新
	auditProcessBindRouter.DELETE("/:bind_id", r.AuditProcessBindController.AuditProcessBindDelete) //审核流程绑定删除

	//服务
	serviceRouter := router.Group("/services")
	serviceRouter.POST("", r.ServiceController.ServiceCreate)                            //接口创建
	serviceRouter.GET("", r.ServiceController.ServiceList)                               //接口列表
	serviceRouter.GET("/:service_id", r.ServiceController.ServiceGet)                    //接口详情
	serviceRouter.PUT("/:service_id", r.ServiceController.ServiceUpdate)                 //接口更新
	serviceRouter.DELETE("/:service_id", r.ServiceController.ServiceDelete)              //接口删除
	serviceRouter.POST("/sql-to-form", r.ServiceController.SqlToForm)                    //SQL转接口参数
	serviceRouter.POST("/form-to-sql", r.ServiceController.FormToSql)                    //接口参数转SQL
	serviceRouter.GET("/check-service-name", r.ServiceController.CheckServiceName)       //接口名称重名检查
	serviceRouter.GET("/check-service-path", r.ServiceController.CheckServicePath)       //接口路径重名检查
	serviceRouter.GET("/options/list", r.ServiceController.GetOptionsList)               //获取接口列表页面筛选下拉框配置
	serviceRouter.PUT("/revoke", r.ServiceController.UndoAudit)                          //审核撤销接口
	serviceRouter.GET("/draft/:service_id", r.ServiceController.DraftServiceGet)         //获取草稿版本
	serviceRouter.POST("/draft/:service_id", r.ServiceController.ChangePublishedService) //已发布的需求进行变更（或变更暂存）
	serviceRouter.DELETE("/draft/:service_id", r.ServiceController.AbandonChange)        //恢复到已发布的版本
	serviceRouter.PUT("/status", r.ServiceController.UndoUpOrDown)                       //接口上线、下线
	serviceRouter.GET("/max-response", r.ServiceController.GetServicesMaxResponse)
	serviceRouter.POST("/api-doc/export", r.ServiceController.ExportAPIDoc)                           //导出API接口文档PDF/ZIP
	serviceRouter.GET("/:service_id/api-doc/example-code", r.ServiceController.ServiceGetExampleCode) //接口使用示例代码

	//审核流程实例
	auditProcessInstanceRouter := router.Group("/audit-process-instance")
	auditProcessInstanceRouter.POST("", r.ServiceController.AuditProcessInstanceCreate) // 审核流程实例创建

	//主题域
	subjectDomainsRouter := router.Group("/subject-domains")
	subjectDomainsRouter.GET("", r.SubjectDomainController.SubjectDomainList) //登录用户有权限的主题域列表
	// 触发接口同步回调
	serviceRouter.POST("/sync/:service_id", r.ServiceController.ServiceSyncCallback)

	// 子接口  与子视图的概念类似，其实叫接口限定规则，但是吧，没子接口简单
	subServiceRouter := router.Group("sub-service")
	{
		subServiceRouter.POST("", r.SubServiceDomainApi.Create)       // 创建子接口
		subServiceRouter.GET("", r.SubServiceDomainApi.List)          // 获取子视图列表
		subServiceRouter.DELETE("/:id", r.SubServiceDomainApi.Delete) // 删除指定子接口
		subServiceRouter.PUT("/:id", r.SubServiceDomainApi.Update)    // 更新指定子接口
		subServiceRouter.GET("/:id", r.SubServiceDomainApi.Get)       // 获取指定子接口
	}

	//服务调用记录
	serviceCallRecordRouter := router.Group("/monitor")
	serviceCallRecordRouter.GET("/list", r.ServiceCallRecordController.MonitorList) //获取服务调用记录监控列表
}

func (r *Router) RegisterFrontendApi(engine *gin.Engine) {
	router := engine.Group("/api/data-application-service/frontend/v1", r.Middleware.TokenInterception())

	serviceRouter := router.Group("/services")
	serviceRouter.GET("/:service_id", r.ServiceController.ServiceGetFrontend)             //接口详情 - 前台
	serviceRouter.GET("/:service_id/auth_info", r.ServiceApplyController.ServiceAuthInfo) //授权信息
	serviceRouter.GET("", r.ServiceController.ServiceListFrontend)                        //接口列表 - 前台
	serviceRouter.POST("/search", r.ServiceController.ServiceSearch)                      //服务超市 - 接口服务列表
	serviceRouter.GET("/:service_id/data-view", r.ServiceController.GetServicesDataView)  //接口关联的视图

	dataViewRouter := router.Group("/data-view")
	dataViewRouter.GET("/:data_view_id/services", r.ServiceController.ServicesGetByDataViewId) // 数据视图关联的所有接口

	//接口服务申请
	applyRouter := router.Group("/apply")
	applyRouter.POST("", r.ServiceApplyController.ServiceApplyCreate)                  //申请接口
	applyRouter.GET("", r.ServiceApplyController.ServiceApplyList)                     //申请列表
	applyRouter.GET("/:apply_id", r.ServiceApplyController.ServiceApplyGet)            //申请详情
	applyRouter.GET("/available-assets", r.ServiceApplyController.AvailableAssetsList) //可用资产

	//接口统计数据
	serviceStatsRouter := router.Group("/stats")
	serviceStatsRouter.GET("/top-data", r.ServiceStatsController.ServiceTopData)                   //接口top数据
	serviceStatsRouter.GET("/asset-count", r.ServiceStatsController.ServiceAssetCount)             //接口资产统计数据
	serviceStatsRouter.GET("/daily-statistics", r.ServiceDailyRecordController.GetDailyStatistics) //获取每日统计数据
	serviceStatsRouter.GET("/status-statistics", r.ServiceController.GetStatusStatistics)          //获取接口服务状态统计
	serviceStatsRouter.GET("/department-statistics", r.ServiceController.GetDepartmentStatistics)  //获取部门统计
}

func (r *Router) RegisterInternalApi(engine *gin.Engine) {
	engine.GET("/api/data-application-service/internal/v1/audits/:apply_id/auditors", r.ServiceApplyController.GetOwnerAuditors)            //workflow 根据接口申请id获取数据 owner 审核员
	engine.GET("/api/data-application-service/internal/v1/service/:service_id/auditors", r.ServiceController.GetOwnerAuditors)              //workflow 根据接口ID获取 owner 审核员
	engine.POST("/api/data-application-service/internal/v1/stats/subject-relation-count", r.ServiceStatsController.SubjectRelationCountGet) //获取主题域关联的Service数量
	engine.PUT("/api/data-application-service/internal/v1/service/index", r.ServiceController.ServiceIndexUpdate)                           //版本升级时更新旧数据的ES索引信息
	engine.PUT("/api/data-application-service/internal/v1/service/index2", r.ServiceController.ServiceIndexUpdate2)                         //版本升级时更新旧数据的ES索引信息(支持输入接口id参数)
	//engine.GET("/api/internal/data-application-service/v1/services/:service_id", r.ServiceController.ServiceGet)                            //service detail
	// 获取指定接口服务的 OwnerID
	engine.GET("api/data-application-service/internal/v1/services/:service_id/owner_id", r.ServiceController.GetOwnerID)
	// 批量发布、上线接口服务，不经过审核
	engine.POST("api/data-application-service/internal/v1/batch/services/publish-and-online", r.ServiceController.BatchPublishAndOnline)
	// 通过接口ID列表获取接口列表
	engine.POST("api/data-application-service/internal/v1/batch/services", r.ServiceController.GetServicesByIDs)
	// 触发接口同步回调
	engine.POST("api/data-application-service/internal/v1/services/sync/:service_id", r.ServiceController.ServiceSyncCallback)

	engine.GET("api/data-application-service/internal/v1/services/:service_id/sub-service", r.SubServiceDomainApi.ListID)
	engine.GET("api/data-application-service/internal/v1/services/authed", r.ServiceController.HasSubViewAuth)
	engine.GET("api/data-application-service/internal/v1/services/sub-service/batch", r.SubServiceDomainApi.ListSubService)

	engine.POST("api/data-application-service/internal/v1/sub-service", r.SubServiceDomainApi.Create) // 创建子接口
}
