package driver

import (
	"github.com/gin-gonic/gin"
	subject_domain "github.com/kweaver-ai/dsg/services/apps/data-subject/adapter/driver/subject_domain/v1"
	"github.com/kweaver-ai/idrm-go-common/access_control"
	"github.com/kweaver-ai/idrm-go-common/audit"
	"github.com/kweaver-ai/idrm-go-common/middleware"
	middleware_v1 "github.com/kweaver-ai/idrm-go-common/middleware/v1"
	"github.com/kweaver-ai/idrm-go-common/rest/configuration_center"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/trace"
)

type IRouter interface {
	Register(engine *gin.Engine)
}

type Router struct {
	middleware       middleware.Middleware
	SubjectDomainApi *subject_domain.SubjectDomainService
	// 审计日志的日志器
	AuditLogger               audit.Logger
	ConfigurationCenterDriven configuration_center.Driven
}

func NewRouter(middleware middleware.Middleware,
	SubjectDomainApi *subject_domain.SubjectDomainService,
	auditLogger audit.Logger,
	configurationCenterDriven configuration_center.Driven,
) IRouter {
	return &Router{
		middleware:                middleware,
		SubjectDomainApi:          SubjectDomainApi,
		AuditLogger:               auditLogger,
		ConfigurationCenterDriven: configurationCenterDriven,
	}
}

func (r *Router) Register(engine *gin.Engine) {
	dataSubjectInternalRouter := engine.Group("/api/internal/data-subject/v1", trace.MiddlewareTrace())
	dataSubjectRouter := engine.Group("/api/data-subject/v1", trace.MiddlewareTrace(), r.middleware.TokenInterception())
	dataSubjectRouter.Use(trace.MiddlewareTrace())
	dataSubjectRouter.Use(middleware_v1.AuditLogger(r.AuditLogger, r.ConfigurationCenterDriven))

	subjectDomainRouter := dataSubjectRouter.Group("/subject-domain", r.middleware.AccessControl(access_control.SubjectDomain))
	{
		subjectDomainRouter.POST("/check", r.SubjectDomainApi.CheckRepeat) // 重名校验
		subjectDomainRouter.POST("", r.SubjectDomainApi.AddObject)         // 新建对象
		subjectDomainRouter.PUT("", r.SubjectDomainApi.UpdateObject)       // 更新对象
		subjectDomainRouter.DELETE("/:did", r.SubjectDomainApi.DelObject)  // 删除对象
		subjectDomainRouter.GET("", r.SubjectDomainApi.GetObject)          // 获取对象详情
		dataSubjectRouter.GET("/subject-domains", r.SubjectDomainApi.List) // 获取业务对象定义列表

		subjectDomainRouter.POST("/logic-entity", r.SubjectDomainApi.AddBusinessObject)                      // 编辑业务对象/业务活动定义
		subjectDomainRouter.GET("/logic-entity", r.SubjectDomainApi.GetBusinessObject)                       // 查看业务对象/业务活动定义
		subjectDomainRouter.POST("/business-object/context", r.SubjectDomainApi.BatchCreateObjectAndContent) //批量新建业务对象/活动
		subjectDomainRouter.POST("/query-business-rec-list", r.SubjectDomainApi.QueryBusinessSubjectRecList) // 业务对象属性识别业务标准表字段

		dataSubjectRouter.GET("/subject-domain/child", r.SubjectDomainApi.GetDetailAndChild) // 获取业务对象定义列表，包括子孙节点
		dataSubjectRouter.GET("/subject-domain/count", r.SubjectDomainApi.LevelCount)        // 获取当前节点下的层级统计信息

		dataSubjectInternalRouter.GET("/subject-domains", r.SubjectDomainApi.List)     //内部接口                                                                                         // 获取业务对象定义列表
		dataSubjectInternalRouter.GET("/subject-domain", r.SubjectDomainApi.GetObject) //内部接口                                                                                                            // 获取对象详情

		subjectDomainRouter.GET("/business-object/check-references", r.SubjectDomainApi.CheckReferences)             // 循环引用校验
		dataSubjectRouter.GET("/subject-domain/business-object/path", r.SubjectDomainApi.GetPath)                    // 批量获取业务对象的全路径
		dataSubjectRouter.GET("/subject-domain/object-entity/path", r.SubjectDomainApi.GetObjectEntityPath)          // 批量获取业务对象的全路径
		subjectDomainRouter.GET("/business-object/owner", r.SubjectDomainApi.GetBusinessObjectOwner)                 // 批量查看业务对象/活动关联数据owner详细信息
		dataSubjectRouter.GET("/subject-domains/internal", r.SubjectDomainApi.GetBusinessObjectsInternal)            //查询
		dataSubjectRouter.GET("/subject-domain/internal", r.SubjectDomainApi.GetBusinessObjectInternal)              //查询
		dataSubjectRouter.GET("/subject-domain/attribute/internal", r.SubjectDomainApi.GetAttributeByObjectInternal) //查询属性关联
		dataSubjectInternalRouter.GET("/subject-domain/precision", r.SubjectDomainApi.GetObjectPrecision)            //根据id列表批量获取业务对象详情
		dataSubjectInternalRouter.POST("/subject-domain/paths", r.SubjectDomainApi.GetSubjectDomainByPaths)          //根据业务对象Path批量获取业务对象详情
		// 以下为分类分级标签使用的接口
		dataSubjectInternalRouter.DELETE("/subject-domain/:labelIds", r.SubjectDomainApi.DelLabels)    // 批量删除属性标签
		subjectDomainRouter.GET("/attributes", r.SubjectDomainApi.GetAttribute)                        // 获取属性信息
		dataSubjectInternalRouter.POST("/subject-domain/attributes", r.SubjectDomainApi.GetAttributes) // 根据属性Id批量获取属性信息
		// 以下接口为业务对象导入导出接口
		dataSubjectRouter.POST("/subject-domains/import", r.SubjectDomainApi.ImportSubjectDomain)          // 从Excel中导入业务对象
		dataSubjectRouter.POST("/subject-domains/export", r.SubjectDomainApi.ExportSubjectDomain)          // 导出业务对象到Excel中
		dataSubjectRouter.GET("/subject-domains/template", r.SubjectDomainApi.ExportSubjectDomainTemplate) // 下载业务对象模板

	}
	//业务表和业务对象的关系
	{
		dataSubjectRouter.GET("/forms/subject", r.SubjectDomainApi.GetFormSubjects)
		dataSubjectRouter.POST("/forms/subject", r.SubjectDomainApi.UpdateFormSubjects)
		dataSubjectInternalRouter.DELETE("/forms/subject", r.SubjectDomainApi.DeleteFormSubjects)
	}
	//资产全景-分类分级
	{
		dataSubjectRouter.GET("/classification", r.SubjectDomainApi.GetClassificationFullView)                //统计顶层或者某个主题的分类分级详情
		dataSubjectRouter.GET("/classification/stats", r.SubjectDomainApi.GetClassificationStats)             //分类分级统计详情
		dataSubjectRouter.GET("/classification/field", r.SubjectDomainApi.GetHierarchyViewFieldDetail)        //查询主题节点的分类分级以及关联的字段详情
		dataSubjectRouter.GET("/classification/fields", r.SubjectDomainApi.GetHierarchyViewFieldDetailByPage) //查询主题节点的分类分级以及关联的字段详情
	}
}
