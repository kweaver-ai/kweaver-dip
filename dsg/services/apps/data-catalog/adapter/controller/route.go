package controller

import (
	"github.com/gin-gonic/gin"
	"github.com/google/wire"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/category/apply_scope_config"

	apply_scope "github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/controller/apply-scope"
	assessment_ctl "github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/controller/assessment/v1"
	audit_process "github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/controller/audit_process/v1"
	catalog_feedback "github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/controller/catalog_feedback/v1"
	category "github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/controller/category/v1"
	cognitive_service_system "github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/controller/cognitive_service_system/v1"
	data_assets_frontend "github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/controller/data_assets/frontend/v1"
	data_assets "github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/controller/data_assets/v1"
	data_catalog_frontend "github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/controller/data_catalog/frontend/v1"
	data_catalog_frontend_v2 "github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/controller/data_catalog/frontend/v2"
	data_catalog "github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/controller/data_catalog/v1"
	data_catalog_score "github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/controller/data_catalog_score/v1"
	data_comprehension_frontend "github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/controller/data_comprehension/frontend/v1"
	data_push "github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/controller/data_push/v1"
	data_resource_frontend "github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/controller/data_resource/frontend/v1"
	data_resource "github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/controller/data_resource/v1"
	elec_licence "github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/controller/elec_licence/v1"
	file_resource "github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/controller/file_resource/v1"
	info_catalog "github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/controller/info_catalog/v1"
	info_system_frontend "github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/controller/info_system/frontend/v1"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/controller/middleware"
	my_frontend "github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/controller/my/frontend/v1"
	my_favorite "github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/controller/my_favorite/v1"
	open_catalog "github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/controller/open_catalog/v1"
	res_feedback "github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/controller/res_feedback/v1"
	statistics "github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/controller/statistics/v1"
	system_operation "github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/controller/system_operation/v1"
	tree "github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/controller/tree/v1"
	tree_node_frontend "github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/controller/tree_node/frontend/v1"
	tree_node "github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/controller/tree_node/v1"
	category_domain "github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/category"
	tree_nodoe_domain "github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/tree_node"
	"github.com/kweaver-ai/idrm-go-common/access_control"
	gocommon_middleware "github.com/kweaver-ai/idrm-go-common/middleware"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/trace"
)

var _ IRouter = (*Router)(nil)

var RouterSet = wire.NewSet(wire.Struct(new(Router), "*"), wire.Bind(new(IRouter), new(*Router)))

type IRouter interface {
	Register(r *gin.Engine)
	RegisterInternal(engine *gin.Engine)
}

type Router struct {
	DcController                       *data_catalog.Controller
	TreeApi                            *tree.Service
	TreeNodeApi                        *tree_node.Service
	MyController                       *my_frontend.Controller
	FrontendDcController               *data_catalog_frontend.Controller
	FrontendTreeNodeApi                *tree_node_frontend.Service
	Middleware                         gocommon_middleware.Middleware
	FrontendDcControllerV2             *data_catalog_frontend_v2.Controller
	AuditProcessController             *audit_process.Controller
	DataComprehensionController        *data_comprehension_frontend.Controller
	FrontendDaController               *data_assets_frontend.Controller
	DaController                       *data_assets.Controller
	CategoryController                 *category.Service
	CategoryTreeController             *category.TreeService
	CategoryApplyScopeConfigController *category.CategoryApplyScopeConfigService
	FrontendDRController               *data_resource_frontend.Controller
	DataResourceController             *data_resource.Controller
	CatalogFeedbackController          *catalog_feedback.Controller
	OpenCatalogController              *open_catalog.Controller
	InfoCatalogController              *info_catalog.Controller
	DataCatalogScoreController         *data_catalog_score.Controller
	ElecLicenceController              *elec_licence.Controller
	MyFavoriteController               *my_favorite.Controller
	DataPushController                 *data_push.Controller
	CognitiveServiceSystem             *cognitive_service_system.Controller
	FileResourceController             *file_resource.Controller
	// 前端：信息系统
	FrontendInfoSystemController *info_system_frontend.Controller
	//首页统计
	StatisticsController                 *statistics.Controller
	SystemOperationController            *system_operation.Controller
	CategoryApplyScopeRelationController *apply_scope.Controller
	AssessmentController                 *assessment_ctl.Controller
	ResFeedbackController                *res_feedback.Controller
}

func (r *Router) Register(engine *gin.Engine) {
	// 总的Auth()加在这里，因为中间件有先后顺序，这里要先加这个Auth()中间件
	//router := engine.Group("/api/data-catalog", middleware.LocalToken())
	router := engine.Group("/api/data-catalog", r.Middleware.TokenInterception())
	router.Use(trace.MiddlewareTrace())
	menu := r.Middleware.MenuPermissionMarker()
	// 前台v2接口
	//frontendRouterV2 := router.Group("/frontend/v2")
	{
		// data-catalog
		{
			//dataCataRouter := frontendRouterV2.Group("/data-catalog")
			//dataCataRouter.GET("/:catalogID", r.FrontendDcControllerV2.GetDataCatalogDetail) // 查询数据资源目录详情V2
		}
	}
	// [信息资源编目]
	{
		// [后台接口]
		infoCatalogBackendRouter := router.Group("/v1/info-resource-catalog")
		infoCatalogBackendRouter.POST("", r.InfoCatalogController.CreateInfoResourceCatalog)
		infoCatalogBackendRouter.PUT("/:id", r.InfoCatalogController.UpdateInfoResourceCatalog)
		infoCatalogBackendRouter.PATCH("/:id", r.InfoCatalogController.ModifyInfoResourceCatalog)
		infoCatalogBackendRouter.DELETE("/:id", r.InfoCatalogController.DeleteInfoResourceCatalog)
		infoCatalogBackendRouter.GET("/conflicts", r.InfoCatalogController.GetConflictItems)
		infoCatalogBackendRouter.GET("/auto-related", r.InfoCatalogController.GetAutoRelatedInfoClasses)
		infoCatalogBackendRouter.POST("/business-form/search", r.InfoCatalogController.QueryUncatalogedBusinessForms)
		infoCatalogBackendRouter.POST("/search", r.InfoCatalogController.QueryInfoResourceCatalogCatalogingList)
		infoCatalogBackendRouter.POST("/audit/search", r.InfoCatalogController.QueryInfoResourceCatalogAuditList) // [/]
		// [前台接口]
		infoCatalogFrontendRouter := router.Group("/frontend/v1/info-resource-catalog")
		infoCatalogFrontendRouter.POST("/search", r.InfoCatalogController.SearchInfoResourceCatalogByUser)
		infoCatalogFrontendRouter.POST("/operation/search", r.InfoCatalogController.SearchInfoResourceCatalogByAdmin)
		infoCatalogFrontendRouter.GET("/:id", r.InfoCatalogController.GetInfoResourceCatalogCardBaseInfo)
		infoCatalogFrontendRouter.GET("/:id/data-resource-catalogs", r.InfoCatalogController.GetInfoResourceCatalogRelatedDataResourceCatalogs) // [/]
		// [通用接口]
		infoCatalogBackendRouter.GET("/:id", r.InfoCatalogController.GetInfoResourceCatalogDetailByUser)
		infoCatalogBackendRouter.GET("/:id/operation", r.InfoCatalogController.GetInfoResourceCatalogDetailByAdmin)
		infoCatalogBackendRouter.GET("/:id/columns", r.InfoCatalogController.GetInfoResourceCatalogColumns) // [/]
		// [信息资源目录变更]
		infoCatalogBackendRouter.PUT("/:id/alter", r.InfoCatalogController.AlterInfoResourceCatalog)
		infoCatalogBackendRouter.PUT("/:id/alter/audit/cancel", r.InfoCatalogController.AlterAuditCancel)
		infoCatalogBackendRouter.DELETE("/:id/version/:alterID", r.InfoCatalogController.AlterRecover)
		infoCatalogBackendRouter.GET("/statistics", r.InfoCatalogController.QueryInfoResourceCatalogStatistics) // [/]

		// [信息资源目录概览]
		infoCatalogBackendRouter.GET("/catalog-statistic", r.InfoCatalogController.GetCatalogStatistics)
		infoCatalogBackendRouter.GET("/business-form-statistic", r.InfoCatalogController.GetBusinessFormStatistics)
		infoCatalogBackendRouter.GET("/dept-catalog-statistic", r.InfoCatalogController.GetDeptCatalogStatistics)
		infoCatalogBackendRouter.GET("/share-statistic", r.InfoCatalogController.GetShareStatistics)
		infoCatalogBackendRouter.POST("/export", r.InfoCatalogController.ExportInfoCatalog)
	} // [/]
	// 前台v1接口
	frontendRouter := router.Group("/frontend/v1")
	{
		// my favorite
		{
			myFavoriteRouter := frontendRouter.Group("/favorite")

			myFavoriteRouter.POST("", r.MyFavoriteController.Create)               // 新增收藏接口
			myFavoriteRouter.DELETE("/:favor_id", r.MyFavoriteController.Delete)   // 取消收藏接口
			myFavoriteRouter.GET("", r.MyFavoriteController.GetList)               // 我的收藏列表接口
			myFavoriteRouter.POST("/check", r.MyFavoriteController.CheckIsFavored) // 资源是否已收藏查询接口
		}

		// tree node
		{
			routerGroup := frontendRouter.Group("/trees/nodes")
			routerGroup.GET("", middleware.GinReqParamValidator[tree_nodoe_domain.ListReqParam](), r.FrontendTreeNodeApi.List) // 获取父节点下的子节点列表
		}

		// 数据目录
		{

			dataCataRouter := frontendRouter.Group("/data-catalog")
			//dataCataRouter.GET("/:catalogID/common", r.FrontendDcController.GetBusinessObjectCommonDetail)        // 查询公共详情
			//dataCataRouter.GET("/:catalogID/basic-info", r.FrontendDcController.GetBusinessObjectDetailBasicInfo) // 查询详情基本信息
			dataCataRouter.POST("/:catalogID/preview-save", r.FrontendDcController.DataCatalogPreviewHook) // 摘要信息预览量埋点
			//dataCataRouter.POST("/:catalogID/audit-flow/:auditType/instance", r.FrontendDcController.CreateAuditInstance) // 创建数据资产目录相关审核实例

			dataCataRouter.POST("search", r.FrontendDcController.SearchDataCatalog)                        // 服务超市 - 搜索数据资源目录(普通用户视角)
			dataCataRouter.POST("/operation/search", r.FrontendDcController.SearchDataCatalogForOperation) // 服务超市 - 搜索数据资源目录(运营&开发工程师)                                                                // 查询数据目录信息项列表

			dataCataRouter.POST("/search/subgraph", r.FrontendDcController.SubGraph) // 服务超市-认知搜索-子图谱

			dataCataRouter.GET("/:catalog_id", r.FrontendDcController.GetDataCatalogDetail)    // 查询数据资源目录详情
			dataCataRouter.GET("/:catalog_id/column", r.DcController.GetDataCatalogColumnList) // 查询数据目录信息项列表
			dataCataRouter.GET("/:catalog_id/mount", r.DcController.GetDataCatalogMountList)   // 查询数据目录信息挂载资源列表
			dataCataRouter.GET("/:catalog_id/sample-data", r.DcController.GetSampleData)       // 获取目录样例数据

		}
		//elec-licence
		{
			elecLicence := frontendRouter.Group("/elec-licence")
			elecLicence.POST("/search", r.ElecLicenceController.Search)
			elecLicence.GET("/:elec_licence_id", r.ElecLicenceController.GetElecLicenceDetailFrontend)            // 查询电子证照详情
			elecLicence.GET("/:elec_licence_id/column", r.ElecLicenceController.GetElecLicenceColumnListFrontend) // 查询电子证照信息项列表
		}

		// data-assets
		{
			dataAssetsRouter := frontendRouter.Group("/data-assets")
			dataAssetsRouter.GET("/count", r.FrontendDaController.GetDataAssetsCount)                                              // 获取数据资产L1-L5数量
			dataAssetsRouter.GET("/business-domain/business-logic-entity", r.FrontendDaController.GetBusinessLogicEntityInfo)      // 获取业务逻辑实体分布信息(业务域视角)
			dataAssetsRouter.GET("/department/business-logic-entity", r.FrontendDaController.GetDepartmentBusinessLogicEntityInfo) // 获取业务逻辑实体分布信息(部门视角)
			dataAssetsRouter.GET("/standardized-rate", r.FrontendDaController.GetStandardizedRate)                                 // 获取数据标准化率
		}

		// 我的
		{
			myRouter := frontendRouter.Group("/my/data-catalog")

			// 数据目录维度下，我的资产申请
			myRouter.GET("/apply", r.MyController.GetMyApplyList)          // 资产申请列表(数据目录维度)
			myRouter.GET("/apply/:applyID", r.MyController.GetApplyDetail) // 资产申请详情(数据目录维度)

		}

		// 服务超市搜索
		{
			dataResourceRouter := frontendRouter.Group("/data-resources")
			dataResourceRouter.POST("search", r.FrontendDRController.Search)               // 服务超市 - 搜索数据资源(普通用户视角)
			dataResourceRouter.POST("searchForOper", r.FrontendDRController.SearchForOper) // 服务超市 - 搜索数据资源(运营视角)
		}

		// 信息系统
		{
			// 搜索信息系统
			engine.POST("/api/data-catalog/frontend/v1/info-systems/search", r.FrontendInfoSystemController.Search)
		}
	}

	// 后台v1接口
	dataCatalogRouter := router.Group("/v1")
	{
		// 目录类别
		{
			routerGroup := dataCatalogRouter.Group("/trees/nodes")
			routerGroup.POST("", middleware.GinReqParamValidator[tree_nodoe_domain.AddReqParam](), r.TreeNodeApi.Add)               // 添加一个目录类别，位置在尾部
			routerGroup.GET("", middleware.GinReqParamValidator[tree_nodoe_domain.ListReqParam](), r.TreeNodeApi.List)              // 获取父类别下的子目录类别列表
			routerGroup.GET("/tree", middleware.GinReqParamValidator[tree_nodoe_domain.ListTreeReqParam](), r.TreeNodeApi.ListTree) // 获取整棵树结构（数结构表格使用）
			{
				group := routerGroup.Group("/:node_id")
				group.DELETE("", middleware.GinReqParamValidator[tree_nodoe_domain.DeleteReqParam](), r.TreeNodeApi.Delete)        // 删除指定目录类别
				group.PUT("", middleware.GinReqParamValidator[tree_nodoe_domain.EditReqParam](), r.TreeNodeApi.Edit)               // 修改指定目录类别基本信息
				group.GET("", middleware.GinReqParamValidator[tree_nodoe_domain.GetReqParam](), r.TreeNodeApi.Get)                 // 获取指定目录类别详情
				group.PUT("/reorder", middleware.GinReqParamValidator[tree_nodoe_domain.ReorderReqParam](), r.TreeNodeApi.Reorder) // 对父类别下的子目录类别重新排序
			}
			routerGroup.POST("/check", middleware.GinReqParamValidator[tree_nodoe_domain.NameExistReqParam](), r.TreeNodeApi.NameExistCheck) // 检测目录类别名称是否已存在
		}

		// 类目管理
		{
			categoryRouter := dataCatalogRouter.Group("/category")
			categoryRouter.POST("", middleware.GinReqParamValidator[category_domain.AddReqParama](), r.CategoryController.Add)                           // 添加一个类目
			categoryRouter.PUT("", r.CategoryController.BatchEdit)                                                                                       // 批量修改指定类目排序（仅排序）
			categoryRouter.GET("/name-check", middleware.GinReqParamValidator[category_domain.NameExistReqParam](), r.CategoryController.NameExistCheck) // 检查类目名称是否存在
			categoryRouter.GET("", middleware.GinReqParamValidator[category_domain.ListReqParam](), r.CategoryController.GetAll)                         // 获取所有类目和类目树

			// 类目-应用范围（右侧固定模块项）配置
			// GET查询接口：不需要category_id，返回所有类目及配置
			categoryRouter.GET("/apply-scope-config", middleware.GinReqParamValidator[apply_scope_config.GetReqParam](), r.CategoryApplyScopeConfigController.Get)

			group := categoryRouter.Group("/:category_id")
			{
				group.DELETE("", middleware.GinReqParamValidator[category_domain.DeleteReqParam](), r.CategoryController.Delete)          // 删除指定类目
				group.PUT("", middleware.GinReqParamValidator[category_domain.EditReqParam](), r.CategoryController.Edit)                 // 修改指定类目基本信息
				group.PUT("/using", middleware.GinReqParamValidator[category_domain.EditUsingReqParam](), r.CategoryController.EditUsing) // 停用启用类目
				group.GET("", middleware.GinReqParamValidator[category_domain.GetReqParam](), r.CategoryController.Get)                   // 获取指定类目详情
				// PUT接口：全量覆盖指定类目的模块树配置
				group.PUT("/apply-scope-config", middleware.GinReqParamValidator[apply_scope_config.UpdateReqParam](), r.CategoryApplyScopeConfigController.Update)
			}
			// 类目树节点管理
			{
				group.POST("/trees-node", middleware.GinReqParamValidator[category_domain.AddTreeReqParama](), r.CategoryTreeController.Add)                           // 添加一个类目树节点，位置在首部
				group.DELETE("/trees-node/:node_id", middleware.GinReqParamValidator[category_domain.DeleteTreeReqParam](), r.CategoryTreeController.Delete)           // 删除指定类目树节点
				group.PUT("/trees-node/:node_id", middleware.GinReqParamValidator[category_domain.EditTreeReqParam](), r.CategoryTreeController.Edit)                  // 修改指定类目树节点基本信息
				group.GET("/trees-node/name-check", middleware.GinReqParamValidator[category_domain.NameTreeExistReqParam](), r.CategoryTreeController.NameExistCheck) // 检测类目树节点名称是否已存在, 同一层级下节点
				group.PUT("/trees-node", middleware.GinReqParamValidator[category_domain.RecoderReqParam](), r.CategoryTreeController.Reorder)                         // 类目树节点重新排序
			}
			// 应用范围
			applyScopeRouter := dataCatalogRouter.Group("/apply-scope")
			{
				applyScopeRouter.GET("/list", r.CategoryApplyScopeRelationController.AllList) // 获取应用范围列表
			}
		}

		// 数据资源目录
		{
			catalogACRouter := dataCatalogRouter.Group("/data-catalog")
			catalogACRouter.GET("/count", r.DataResourceController.GetCount)
			catalogACRouter.GET("/data-resource", r.DataResourceController.DataResourceList)
			catalogACRouter.POST("", r.DcController.SaveDataCatalogDraft) // 暂存数据资源目录
			catalogACRouter.PUT("", r.DcController.SaveDataCatalog)       // 保存数据资源目录
			dataCatalogRouter.GET("/data-catalog",
				r.Middleware.MultipleAccessControl(access_control.DataResourceCatalog, access_control.Task),
				r.DcController.GetDataCatalogList) // 查询数据资源目录列表
			catalogACRouter.GET("/:catalog_id", r.DcController.GetDataCatalogDetail)                                 // 查询数据资源目录详情
			catalogACRouter.GET("/check", r.DcController.CheckDataCatalogNameRepeat)                                 // 检查数据资源目录名称是否重复
			catalogACRouter.DELETE("/:catalog_id", r.DcController.DeleteDataCatalog)                                 // 删除数据资源目录（逻辑删除）
			catalogACRouter.GET("/:catalog_id/column", r.DcController.GetDataCatalogColumnList)                      // 查询数据目录信息项列表
			catalogACRouter.GET("/:catalog_id/mount", r.DcController.GetDataCatalogMountList)                        // 查询数据目录信息挂载资源列表
			catalogACRouter.POST("/:catalog_id/audit-flow/:audit_type/instance", r.DcController.CreateAuditInstance) // 创建数据目录审核实例
			catalogACRouter.POST("/import", r.DcController.ImportDataCatalog)                                        // 导入暂存数据资源目录

			catalogACRouter.POST("/overview/total", r.DcController.TotalOverview)                                               // 概览-总览
			catalogACRouter.POST("/overview/statistics", r.DcController.StatisticsOverview)                                     // 概览-分类统计
			dataCatalogRouter.POST("/overview/data-get", r.DcController.DataGetOverview)                                        //数据获取概览
			dataCatalogRouter.POST("/overview/data-get-department", r.DcController.DataGetDepartmentDetail)                     //数据获取部门详情
			dataCatalogRouter.POST("/overview/data-get-aggregation", r.DcController.DataGetAggregationOverview)                 //归集任务详情
			dataCatalogRouter.GET("/overview/data-understand", r.DcController.DataUnderstandOverview)                           //数据理解概览
			dataCatalogRouter.GET("/overview/data-understand-depart-top", r.DcController.DataUnderstandDepartTopOverview)       //数据理解概览-部门完成率top30-部门详情
			dataCatalogRouter.GET("/overview/data-understand-domain-detail", r.DcController.DataUnderstandDomainOverview)       //数据理解概览-服务领域详情
			dataCatalogRouter.GET("/overview/data-understand-task-detail", r.DcController.DataUnderstandTaskDetailOverview)     //数据理解概览-理解任务详情
			dataCatalogRouter.GET("/overview/data-understand-depart-detail", r.DcController.DataUnderstandDepartDetailOverview) //数据理解概览-部门理解目录

			catalogRouter := dataCatalogRouter.Group("/data-catalog") // no AC
			catalogRouter.GET("/push-resource", r.DataResourceController.DataPushResourceList)
			catalogRouter.GET("/normal", r.DcController.GetDataCatalogList)                               // 普通用户查询数据资源目录列表
			dataCatalogRouter.POST("/data-resources/data-catalog", r.DcController.GetResourceCatalogList) // 查询数据资源的数据目录列表
			catalogACRouter.GET("/:catalog_id/task", r.DcController.GetDataCatalogTask)                   // 查询目录任务信息
		}
		dataCatalogRouter.GET("/data-catalog/:catalog_id/relation", r.DcController.GetDataCatalogRelation) // 查询数据目录信息相关目录

		//data-comprehension
		//有数据理解和数据理解报告之一的菜单即可
		dcacGroup := menu.Set(gocommon_middleware.DataComprehension, gocommon_middleware.DataComprehensionReport)
		{
			frontendRouter.GET("/data-comprehension/:catalog_id", r.DataComprehensionController.Detail)
			dataComprehensionRouter := frontendRouter.Group("/data-comprehension")
			// router
			frontendRouter.PUT("/data-comprehension/:catalog_id", r.DataComprehensionController.Upsert)
			dataComprehensionRouter.GET("/config", r.DataComprehensionController.DimensionConfigs)
			dataComprehensionRouter.DELETE("/:catalog_id", r.DataComprehensionController.Delete)
			dataComprehensionRouter.PUT("/mark", r.DataComprehensionController.CancelMark)
			dataComprehensionRouter.POST("/json", r.DataComprehensionController.UploadReport)
			dataComprehensionRouter.GET("/task/catalog/list", r.DataComprehensionController.GetTaskCatalogList)
			//dcacGroup.Read()  标记读取动作，校验用户是否有该菜单的读取权限
			dataComprehensionRouter.GET("/list", dcacGroup.Read(), r.DataComprehensionController.GetReportList)
			dataComprehensionRouter.GET("/catalog", r.DataComprehensionController.GetCatalogList)
			//dataComprehensionRouter.POST("/:id/audit-flow/:audit_type/instance", r.DataComprehensionController.CreateAuditInstance)

			templateRouter := dataComprehensionRouter.Group("template")
			templateRouter.GET("repeat", r.DataComprehensionController.TemplateNameExist)
			templateRouter.POST("", r.DataComprehensionController.CreateTemplate)
			templateRouter.PUT("", r.DataComprehensionController.UpdateTemplate)
			templateRouter.GET("", r.DataComprehensionController.GetTemplateList)
			templateRouter.GET("/detail", r.DataComprehensionController.GetTemplateDetail)
			templateRouter.GET("/config", r.DataComprehensionController.GetTemplateConfig)
			templateRouter.DELETE("", r.DataComprehensionController.DeleteTemplate)
		}

		// 开放目录管理
		{
			openCatalogRouter := dataCatalogRouter.Group("/open-catalog")
			openCatalogRouter.GET("/openable-catalog", r.OpenCatalogController.GetOpenableCatalogList) // 获取可开放的数据资源目录列表
			openCatalogRouter.POST("", r.OpenCatalogController.CreateOpenCatalog)                      // 添加开放目录
			openCatalogRouter.GET("", r.OpenCatalogController.GetOpenCatalogList)                      // 获取开放目录列表
			openCatalogRouter.GET("/:id", r.OpenCatalogController.GetOpenCatalogDetail)                // 获取开放目录详情
			openCatalogRouter.PUT("/:id", r.OpenCatalogController.UpdateOpenCatalog)                   // 编辑开放目录
			openCatalogRouter.DELETE("/:id", r.OpenCatalogController.DeleteOpenCatalog)                // 删除开放目录（逻辑删除）
			openCatalogRouter.PUT("/cancel/:id", r.OpenCatalogController.CancelAudit)                  // 撤销开放目录审核
			openCatalogRouter.GET("/audit", r.OpenCatalogController.GetAuditList)                      // 获取待审核开放目录列表
			openCatalogRouter.GET("/overview", r.OpenCatalogController.GetOverview)                    // 获取开放目录概览
		}

		// 数据目录评分
		{
			catalogScoreRouter := dataCatalogRouter.Group("/data-catalog/score")
			catalogScoreRouter.POST("/:catalog_id", r.DataCatalogScoreController.CreateDataCatalogScore)   // 添加数据资源目录评分
			catalogScoreRouter.PUT("/:catalog_id", r.DataCatalogScoreController.UpdateDataCatalogScore)    // 修改数据资源目录评分
			catalogScoreRouter.GET("", r.DataCatalogScoreController.GetCatalogScoreList)                   // 获取数据资源目录评分列表
			catalogScoreRouter.GET("/:catalog_id", r.DataCatalogScoreController.GetDataCatalogScoreDetail) // 获取数据资源目录评分详情
			catalogScoreRouter.GET("/summary", r.DataCatalogScoreController.GetDataCatalogScoreSummary)    // 获取数据资源目录评分汇总列表

		}
		// 部门考核目标 & 数据考核目标管理
		{
			assessmentRouter := dataCatalogRouter.Group("/assessment")
			assessmentRouter.POST("", r.AssessmentController.CreateTarget)
			assessmentRouter.PUT("/:id", r.AssessmentController.UpdateTarget)
			assessmentRouter.DELETE("/:id", r.AssessmentController.DeleteTarget)
			assessmentRouter.GET("", r.AssessmentController.ListTargets)
			assessmentRouter.GET("/:id", r.AssessmentController.GetTarget)
			assessmentRouter.GET("/:id/detail", r.AssessmentController.GetTargetDetailWithPlans) // 新增：获取目标详情（包含考核计划）
			assessmentRouter.PUT("/:id/complete", r.AssessmentController.CompleteTarget)         // 完成目标（设置状态为已结束）
			// 评价相关路由
			assessmentRouter.GET("/:id/evaluation", r.AssessmentController.GetEvaluationPage) // 获取评价页面数据（支持待评价和已结束状态）
			assessmentRouter.PUT("/:id/evaluation", r.AssessmentController.SubmitEvaluation)  // 提交评价

			// 新增：部门数据概览
			assessmentRouter.GET("/overview", r.AssessmentController.GetDepartmentOverview) // 获取部门概览数据

			// 运营考核目标管理
			opAssessmentRouter := dataCatalogRouter.Group("/operation-assessment")
			opAssessmentRouter.POST("", r.AssessmentController.CreateOperationTarget)                       // 创建运营考核目标
			opAssessmentRouter.PUT("/:id", r.AssessmentController.UpdateOperationTarget)                    // 更新运营考核目标
			opAssessmentRouter.DELETE("/:id", r.AssessmentController.DeleteOperationTarget)                 // 删除运营考核目标
			opAssessmentRouter.GET("/:id", r.AssessmentController.GetOperationTarget)                       // 获取运营考核目标详情
			opAssessmentRouter.GET("/:id/detail", r.AssessmentController.GetOperationTargetDetailWithPlans) // 获取运营考核目标详情（包含计划信息）
			opAssessmentRouter.GET("", r.AssessmentController.ListOperationTargets)                         // 获取运营考核目标列表
			opAssessmentRouter.GET("/overview", r.AssessmentController.GetOperationOverview)                // 新增：获取运营考核概览

			// 运营考核计划管理
			opAssessmentRouter.POST("/plans", r.AssessmentController.CreateOperationPlan)       // 创建运营考核计划
			opAssessmentRouter.PUT("/plans/:id", r.AssessmentController.UpdateOperationPlan)    // 更新运营考核计划
			opAssessmentRouter.DELETE("/plans/:id", r.AssessmentController.DeleteOperationPlan) // 删除运营考核计划
			opAssessmentRouter.GET("/plans", r.AssessmentController.ListOperationPlans)         // 获取运营考核计划列表
			opAssessmentRouter.GET("/plans/:id", r.AssessmentController.GetOperationPlanDetail) // 获取运营考核计划详情
		}
		//elec-licence
		{
			elecLicence := dataCatalogRouter.Group("/elec-licence")
			//elecLicence := dataCatalogRouter.Group("/elec-licence")
			elecLicence.GET("", r.ElecLicenceController.GetElecLicenceList)                                                    // 查询电子证照列表
			elecLicence.GET("/:elec_licence_id", r.ElecLicenceController.GetElecLicenceDetail)                                 // 查询电子证照详情
			elecLicence.GET("/:elec_licence_id/column", r.ElecLicenceController.GetElecLicenceColumnList)                      // 查询电子证照信息项列表
			elecLicence.POST("/import", r.ElecLicenceController.Import)                                                        // 电子证照导入
			elecLicence.POST("/export", r.ElecLicenceController.Export)                                                        // 电子证照导出
			elecLicence.POST("/:elec_licence_id/audit-flow/:audit_type/instance", r.ElecLicenceController.CreateAuditInstance) // 创建电子证照审核实例

			elecLicenceExceptSystemMgmAC := dataCatalogRouter.Group("/elec-licence")
			elecLicenceExceptSystemMgmAC.GET("/industry-department/tree", r.ElecLicenceController.GetClassifyTree) // 查询行业部门类别树
			elecLicenceExceptSystemMgmAC.GET("/industry-department", r.ElecLicenceController.GetClassify)          // 查询行业部门类别
		}

		// 文件资源管理
		{
			fileResourceRouter := dataCatalogRouter.Group("/file-resource")
			fileResourceRouter.POST("", r.FileResourceController.CreateFileResource)                // 新建文件资源
			fileResourceRouter.GET("", r.FileResourceController.GetFileResourceList)                // 获取文件资源列表
			fileResourceRouter.GET("/:id", r.FileResourceController.GetFileResourceDetail)          // 获取文件资源详情
			fileResourceRouter.PUT("/:id", r.FileResourceController.UpdateFileResource)             // 编辑文件资源
			fileResourceRouter.DELETE("/:id", r.FileResourceController.DeleteFileResource)          // 删除文件资源（逻辑删除）
			fileResourceRouter.POST("/audit/:id", r.FileResourceController.PublishFileResource)     // 发布文件资源
			fileResourceRouter.PUT("/cancel/:id", r.FileResourceController.CancelAudit)             // 撤销文件资源审核
			fileResourceRouter.GET("/audit", r.FileResourceController.GetAuditList)                 // 获取待审核文件资源列表
			fileResourceRouter.GET("/:id/attachment", r.FileResourceController.GetAttachmentList)   // 获取附件列表
			fileResourceRouter.POST("/:id/attachment", r.FileResourceController.UploadAttachment)   // 上传附件
			fileResourceRouter.GET("/attachment/preview-pdf", r.FileResourceController.PreviewPdf)  // 文件预览
			fileResourceRouter.DELETE("/attachment/:id", r.FileResourceController.DeleteAttachment) // 移除附件（逻辑删除）

		}
		// 数据资产管理统计接口
		{
			dataAssetsRouter := dataCatalogRouter.Group("/data-assets")
			dataAssetsRouter.GET("overview", r.DcController.DataAssetsOverview) // 数据资产概览统计
			dataAssetsRouter.GET("detail", r.DcController.DataAssetsDetail)     // 资产部门详情统计
		}
	}

	// 目录反馈v1接口
	dataCatalogFeedbackRouter := router.Group("/v1/data-catalog/feedback")
	{
		dataCatalogFeedbackRouter.POST("", r.CatalogFeedbackController.Create)
		dataCatalogFeedbackRouter.PUT("/:feedback_id/reply", r.CatalogFeedbackController.Reply)
		dataCatalogFeedbackRouter.GET("/:feedback_id", r.CatalogFeedbackController.GetDetail)
		dataCatalogFeedbackRouter.GET("", r.CatalogFeedbackController.GetList)
		dataCatalogFeedbackRouter.GET("/count", r.CatalogFeedbackController.GetCount)
	}

	//数据推送相关接口
	dataPushRouter := dataCatalogRouter.Group("/data-push")

	{
		//管理接口
		dataPushRouter.POST("", r.DataPushController.Create)                   //新增数据推送模型
		dataPushRouter.PUT("", r.DataPushController.Update)                    //修改数据推送模型
		dataPushRouter.PUT("/statues", r.DataPushController.BatchUpdateStatus) //批量更新推送状态
		dataPushRouter.GET("/:id", r.DataPushController.Get)                   //数据推送模型详情
		dataPushRouter.GET("", r.DataPushController.List)                      //数据推送列表
		dataPushRouter.DELETE("/:id", r.DataPushController.Delete)             //删除数据推送模型
		//调度相关
		dataPushRouter.GET("/schedule", r.DataPushController.ListSchedule)        //数据推送监控
		dataPushRouter.POST("/execute/:id", r.DataPushController.Execute)         //立即执行任务
		dataPushRouter.PUT("/switch", r.DataPushController.Switch)                //停用，启用数据推送模型
		dataPushRouter.PUT("/schedule", r.DataPushController.Schedule)            //修改数据推送模型调度模型
		dataPushRouter.PUT("/schedule/check", r.DataPushController.ScheduleCheck) //检查调度计划
		dataPushRouter.GET("/schedule/history", r.DataPushController.History)     //查询调度执行日志
		//统计的两个接口
		dataPushRouter.GET("/overview", r.DataPushController.Overview)                  //数据推送概览
		dataPushRouter.GET("/annual-statistics", r.DataPushController.AnnualStatistics) //数据推送近一年总量
		//审核
		dataPushRouter.GET("/audit", r.DataPushController.AuditList)             //待审核列表
		dataPushRouter.PUT("/audit/revocation", r.DataPushController.Revocation) //撤回审核
	}

	// 业务认知系统
	dataCognitiveServiceSystemSearchRouter := dataCatalogRouter.Group("/cognitive-service-system")
	{
		//单目录数据目录查询
		dataCognitiveServiceSystemSearchRouter.GET("/single-catalog/info", r.CognitiveServiceSystem.GetSingleCatalogInfo)
		dataCognitiveServiceSystemSearchRouter.POST("/single-catalog/data-search", r.CognitiveServiceSystem.SearchSingleCatalog)
		dataCognitiveServiceSystemSearchRouter.POST("/single-catalog/template", r.CognitiveServiceSystem.CreateSingleCatalogTemplate)
		dataCognitiveServiceSystemSearchRouter.GET("/single-catalog/template/list", r.CognitiveServiceSystem.GetSingleCatalogTemplateList)
		dataCognitiveServiceSystemSearchRouter.GET("/single-catalog/template/:id", r.CognitiveServiceSystem.GetSingleCatalogTemplateDetails)
		dataCognitiveServiceSystemSearchRouter.PUT("/single-catalog/template/:id", r.CognitiveServiceSystem.UpdateSingleCatalogTemplate)
		dataCognitiveServiceSystemSearchRouter.DELETE("/single-catalog/template/:id", r.CognitiveServiceSystem.DeleteSingleCatalogTemplate)
		dataCognitiveServiceSystemSearchRouter.GET("/single-catalog/history/list", r.CognitiveServiceSystem.GetSingleCatalogHistoryList)
		dataCognitiveServiceSystemSearchRouter.GET("/single-catalog/history/:id", r.CognitiveServiceSystem.GetSingleCatalogHistoryDetails)
		dataCognitiveServiceSystemSearchRouter.GET("/single-catalog/template/unique-check", r.CognitiveServiceSystem.GetSingleCatalogTemplateNameUnique)

	}

	//首页数据统计
	statisticsDataRouter := router.Group("/api/data-catalog/v1/statistics")
	{
		statisticsDataRouter.GET("/overview", r.StatisticsController.GetOverviewStatistics)
		statisticsDataRouter.GET("/service/:id", r.StatisticsController.GetServiceStatistics)
		statisticsDataRouter.POST("/save", r.StatisticsController.SaveStatistics)
		statisticsDataRouter.GET("/interface", r.StatisticsController.GetDataInterface)
	}

	// 系统运行评价
	systemOperationRouter := dataCatalogRouter.Group("/system-operation")
	{
		systemOperationRouter.GET("/details", r.SystemOperationController.GetDetails) // 系统运行明细列表
		//systemOperationRouter.POST("/white-list", r.systemOperationController.CreateWhiteList)                          // 系统运行白名单
		systemOperationRouter.PUT("/white-list/:id", r.SystemOperationController.UpdateWhiteList)                       // 修改系统运行白名单设置
		systemOperationRouter.GET("/rule", r.SystemOperationController.GetRule)                                         // 获取系统运行规则设置
		systemOperationRouter.PUT("/rule", r.SystemOperationController.UpdateRule)                                      // 修改系统运行规则设置
		systemOperationRouter.POST("/details/export", r.SystemOperationController.ExportDetails)                        // 系统运行明细导出
		systemOperationRouter.GET("/overall-evaluations", r.SystemOperationController.OverallEvaluations)               // 整体评价结果列表
		systemOperationRouter.POST("/overall-evaluations/export", r.SystemOperationController.ExportOverallEvaluations) // 整体评价结果导出
	}
	// feedback
	{
		catalogFeedbackRouter := dataCatalogRouter.Group("data-resource/feedback")
		catalogFeedbackRouter.POST("", r.ResFeedbackController.Create)
		catalogFeedbackRouter.PUT("/:feedback_id/reply", r.ResFeedbackController.Reply)
		catalogFeedbackRouter.GET("/:feedback_id/:res_type", r.ResFeedbackController.GetDetail)
		catalogFeedbackRouter.GET("", r.ResFeedbackController.GetList)
		catalogFeedbackRouter.GET("/count", r.ResFeedbackController.GetCount)
	}
}

func (r *Router) RegisterInternal(engine *gin.Engine) {
	dataCatalogRouter := engine.Group("/api/internal/data-catalog/v1")

	{
		catalogRouter := dataCatalogRouter.Group("/data-catalog")
		catalogRouter.POST("/es-index", r.DcController.CreateESIndex)
		catalogRouter.POST("/apply-audit-cancel", r.DcController.OfflineCancelApplyAudit)
		catalogRouter.GET("/audits/:applyID/auditors", r.DcController.GetOwnerAuditors)
		catalogRouter.PUT("/business-object/download-access", r.FrontendDcController.ExpiredAccessClear)
		catalogRouter.GET("/data-assets/count", r.DaController.Count)

		catalogRouter.POST("/push-all-to-es", r.DcController.PushCatalogToEs)
		dataCatalogRouter.POST("/elec-licence/push-all-to-es", r.ElecLicenceController.PushToEs)

		catalogRouter.GET("/:catalog_id", r.DcController.GetDataCatalogDetail)
		catalogRouter.GET("/:catalog_id/column", r.DcController.GetDataCatalogColumnList)
		catalogRouter.GET("/resource/:id/column", r.DcController.GetDataCatalogColumnByViewID)
		catalogRouter.GET("/:catalog_id/mount", r.DcController.GetDataCatalogMountList)
		catalogRouter.GET("/brief", r.DcController.GetDataCatalogBriefList) // 根据数据资源目录IDS批量查询数据资源目录列表

		catalogRouter.GET("/standard/catalog", r.InfoCatalogController.GetCatalogByStandardForm) //根据业务标准表查询目录

		dataCatalogRouter.GET("/data-push/schedule/history", r.DataPushController.History) //查询调度执行日志

		catalogRouter.POST("/column", r.DcController.GetColumnListByIds) // 根据信息项id批量查询数据目录信息项

		dataCatalogRouter.GET("/data-push/sandbox", r.DataPushController.QuerySandboxPushCount) //数据推送监控

		dataCatalogRouter.POST("/data-resources/data-catalog", r.DcController.GetResourceCatalogList) // 查询数据资源的数据目录列表

		catalogRouter.POST("/system-operation/detail", r.SystemOperationController.CreateDetail)           // 定时更新明细表
		catalogRouter.POST("/system-operation/data-count", r.SystemOperationController.DataCount)          // 定时更新数据量表
		catalogRouter.POST("/favorite", r.MyFavoriteController.CheckIsFavoredByResID)                      // 收藏检查
		dataCatalogRouter.GET("/category/:category_id", r.CategoryController.GetcategoryDetailForInternal) // 获取指定类目详情内部接口

	}

}
