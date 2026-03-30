package driver

import (
	data_set "github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driver/data_set/v1"
	explore_rule "github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driver/explore_rule/v1"
	graph_model "github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driver/graph_model/v1"
	"github.com/gin-gonic/gin"

	"github.com/kweaver-ai/idrm-go-common/middleware"
	common_form_view "github.com/kweaver-ai/idrm-go-common/rest/data_view"
	classification_rule "github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driver/classification_rule/v1"
	data_lineage "github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driver/data_lineage/v1"
	data_privacy_policy "github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driver/data_privacy_policy/v1"
	explore_task "github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driver/explore_task/v1"
	form_view "github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driver/form_view/v1"
	grade_rule "github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driver/grade_rule/v1"
	grade_rule_group "github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driver/grade_rule_group/v1"
	logic_view "github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driver/logic_view/v1"
	recognition_algorithm "github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driver/recognition_algorithm/v1"
	sub_view "github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driver/sub_view/v1"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/trace"
)

type IRouter interface {
	Register(engine *gin.Engine)
	RegisterInternal(engine *gin.Engine)
	RegisterMigration(engine *gin.Engine)
}

type Router struct {
	middleware                    middleware.Middleware
	FormViewDomainApi             *form_view.FormViewService
	DataLineageApi                *data_lineage.Service
	LogicViewDomainApi            *logic_view.LogicViewService
	ExploreTaskDomainApi          *explore_task.ExploreTaskService
	SubViewDomainApi              *sub_view.SubViewService
	DataPrivacyPolicyDomainApi    *data_privacy_policy.DataPrivacyPolicyService
	RecognitionAlgorithmDomainApi *recognition_algorithm.RecognitionAlgorithmService
	ClassificationRuleDomainApi   *classification_rule.ClassificationRuleService
	GradeRuleDomainApi            *grade_rule.GradeRuleService
	GradeRuleGroupDomainApi       *grade_rule_group.GradeRuleGroupService
	DataSetDomainApi              *data_set.DataSetService
	GraphModelApi                 *graph_model.Service
	ExploreRuleApi                *explore_rule.ExploreRuleService
}

func NewRouter(middleware middleware.Middleware,
	FormViewDomainApi *form_view.FormViewService,
	DataLineageApi *data_lineage.Service,
	LogicViewDomainApi *logic_view.LogicViewService,
	SubViewDomainApi *sub_view.SubViewService,
	ExploreTaskDomainApi *explore_task.ExploreTaskService,
	DataPrivacyPolicyDomainApi *data_privacy_policy.DataPrivacyPolicyService,
	RecognitionAlgorithmDomainApi *recognition_algorithm.RecognitionAlgorithmService,
	ClassificationRuleDomainApi *classification_rule.ClassificationRuleService,
	GradeRuleDomainApi *grade_rule.GradeRuleService,
	GradeRuleGroupDomainApi *grade_rule_group.GradeRuleGroupService,
	DataSetDomainApi *data_set.DataSetService,
	GraphModelApi *graph_model.Service,
	ExploreRuleApi *explore_rule.ExploreRuleService,
) IRouter {
	return &Router{
		middleware:                    middleware,
		FormViewDomainApi:             FormViewDomainApi,
		DataLineageApi:                DataLineageApi,
		LogicViewDomainApi:            LogicViewDomainApi,
		ExploreTaskDomainApi:          ExploreTaskDomainApi,
		SubViewDomainApi:              SubViewDomainApi,
		DataPrivacyPolicyDomainApi:    DataPrivacyPolicyDomainApi,
		RecognitionAlgorithmDomainApi: RecognitionAlgorithmDomainApi,
		ClassificationRuleDomainApi:   ClassificationRuleDomainApi,
		GradeRuleDomainApi:            GradeRuleDomainApi,
		GradeRuleGroupDomainApi:       GradeRuleGroupDomainApi,
		DataSetDomainApi:              DataSetDomainApi,
		GraphModelApi:                 GraphModelApi,
		ExploreRuleApi:                ExploreRuleApi,
	}
}

func (r *Router) Register(engine *gin.Engine) {
	dataViewRouter := engine.Group("/api/data-view/v1", trace.MiddlewareTrace(), r.middleware.TokenInterception())
	//dataViewRouter := engine.Group("/api/data-view/v1", trace.MiddlewareTrace(), localmiddleware.AddToken())

	//formView 元数据视图相关接口，及部分逻辑视图公共接口
	{
		//formViewRouter with access_control.FormView
		{
			formViewRouter := dataViewRouter.Group("/form-view")
			formViewRouter.GET("", r.FormViewDomainApi.PageList)                  // 获取逻辑视图列表
			formViewRouter.GET("/published", r.FormViewDomainApi.PublishPageList) // 获取发布的逻辑视图列表
			//formViewRouter.POST("/scan", r.middleware.AuditLogger(), r.FormViewDomainApi.Scan)                        // 扫描数据源
			formViewRouter.GET("/repeat", r.FormViewDomainApi.NameRepeat)                                             // 逻辑视图重名校验
			formViewRouter.PUT("/:id", r.middleware.AuditLogger(), r.FormViewDomainApi.UpdateFormView)                // 编辑元数据视图
			formViewRouter.DELETE("/:id", r.middleware.AuditLogger(), r.FormViewDomainApi.DeleteFormView)             // 删除逻辑视图
			formViewRouter.PUT("/:id/details", r.middleware.AuditLogger(), r.FormViewDomainApi.UpdateFormViewDetails) // 编辑逻辑视图基本信息
			formViewRouter.GET("/by-audit-status", r.FormViewDomainApi.GetByAuditStatus)                              // 根据稽核状态获取逻辑视图列表
			formViewRouter.GET("/basic", r.FormViewDomainApi.GetBasicViewList)                                        // 根据ID批量查询逻辑视图基本信息
			formViewRouter.POST("/is-allow-clear-grade", r.FormViewDomainApi.IsAllowClearGrade)                       // 是否允许清除分级标签

			formViewRouter.GET("/:id/filter-rule", r.FormViewDomainApi.GetFilterRule)           // 获取逻辑视图过滤规则
			formViewRouter.PUT("/:id/filter-rule", r.FormViewDomainApi.UpdateFilterRule)        // 更新逻辑视图过滤规则
			formViewRouter.DELETE("/:id/filter-rule", r.FormViewDomainApi.DeleteFilterRule)     // 删除逻辑视图过滤规则
			formViewRouter.POST("/:id/filter-rule/test", r.FormViewDomainApi.ExecFilterRule)    // 预览过滤规则执行结果
			formViewRouter.GET("/explore-conf/status", r.FormViewDomainApi.GetExploreJobStatus) // 获取探查执行状态
			formViewRouter.POST("/convert-rule/verify", r.FormViewDomainApi.ConvertRulesVerify) // 转换规则校验

			formViewRouter.POST("/excel-view", r.middleware.AuditLogger(), r.FormViewDomainApi.CreateExcelView) //创建excel元数据视图
			formViewRouter.PUT("/excel-view", r.FormViewDomainApi.UpdateExcelView)                              //编辑excel元数据视图
			dataViewRouter.GET("/department/overview", r.FormViewDomainApi.GetOverview)                         // 获取单个部门视图概览

			dataViewRouter.GET("/datasource", r.FormViewDomainApi.GetDatasourceList) // 获取数据源列表
			dataViewRouter.PUT("/batch/publish", r.FormViewDomainApi.BatchPublish)
			dataViewRouter.PUT("/excel/batch/publish", r.FormViewDomainApi.ExcelBatchPublish)

			dataViewRouter.GET("/white-list-policy/list", r.FormViewDomainApi.GetWhiteListPolicyList)
			dataViewRouter.GET("/white-list-policy/:id", r.FormViewDomainApi.GetWhiteListPolicyDetails)
			dataViewRouter.POST("/white-list-policy", r.FormViewDomainApi.CreateWhiteListPolicy)
			dataViewRouter.PUT("/white-list-policy/:id", r.FormViewDomainApi.UpdateWhiteListPolicy)
			dataViewRouter.DELETE("/white-list-policy/:id", r.FormViewDomainApi.DeleteWhiteListPolicy)
			dataViewRouter.POST("/white-list-policy/execute", r.FormViewDomainApi.ExecuteWhiteListPolicy)
			dataViewRouter.GET("/white-list-policy/:id/where-sql", r.FormViewDomainApi.GetWhiteListPolicyWhereSql)
			dataViewRouter.POST("/white-list-policy/relate-form-view", r.FormViewDomainApi.GetFormViewRelateWhiteListPolicy)

			dataViewRouter.GET("/desensitization-rule/list", r.FormViewDomainApi.GetDesensitizationRuleList)
			dataViewRouter.POST("/desensitization-rule/ids", r.FormViewDomainApi.GetDesensitizationRuleByIds)
			dataViewRouter.GET("/desensitization-rule/:id", r.FormViewDomainApi.GetDesensitizationRuleDetails)
			dataViewRouter.POST("/desensitization-rule", r.FormViewDomainApi.CreateDesensitizationRule)
			dataViewRouter.PUT("/desensitization-rule/:id", r.FormViewDomainApi.UpdateDesensitizationRule)
			dataViewRouter.DELETE("/desensitization-rule/:id", r.FormViewDomainApi.DeleteDesensitizationRule)
			dataViewRouter.POST("/desensitization-rule/execute", r.FormViewDomainApi.ExecuteDesensitizationRule)
			dataViewRouter.POST("/desensitization-rule/export", r.FormViewDomainApi.ExportDesensitizationRule)
			dataViewRouter.POST("/desensitization-rule/relate-policy", r.FormViewDomainApi.GetDesensitizationRuleRelatePolicy)
			dataViewRouter.GET("/desensitization-rule/internal-algorithm", r.FormViewDomainApi.GetDesensitizationRuleInternalAlgorithm)
			dataViewRouter.GET("/desensitization/:id/filed-info", r.FormViewDomainApi.GetDesensitizationFieldInfos)
		}

		//formViewRouter without access_control
		{
			formViewRouter := dataViewRouter.Group("/form-view")
			formViewRouter.GET("/:id", r.FormViewDomainApi.GetFields)                   // 查看逻辑视图字段
			formViewRouter.GET("/:id/details", r.FormViewDomainApi.GetFormViewDetails)  // 获取逻辑视图基本信息
			formViewRouter.POST("/filter", r.FormViewDomainApi.FormViewFilter)          // 传入视图ID列表，返回未被删除的
			formViewRouter.GET("/explore-report", r.FormViewDomainApi.GetExploreReport) // 探查报告查询
			formViewRouter.POST("/explore-report/batch", r.FormViewDomainApi.BatchGetExploreReport)
			formViewRouter.GET("/explore-report/field", r.FormViewDomainApi.GetFieldExploreReport)                          // 获取字段探查结果
			formViewRouter.GET("/:id/business-update-time", r.FormViewDomainApi.GetBusinessUpdateTime)                      // 查看逻辑视图业务更新时间
			formViewRouter.GET("/data-type/mapping", r.FormViewDomainApi.DataTypeMapping)                                   // 数据类型映射
			formViewRouter.POST("/data-preview", r.middleware.AuditLogger(), r.FormViewDomainApi.DataPreview)               // 逻辑视图数据预览
			formViewRouter.POST("/desensitization-field/data-preview", r.FormViewDomainApi.DesensitizationFieldDataPreview) // 逻辑视图脱敏字段数据预览
			formViewRouter.POST("/preview-config", r.FormViewDomainApi.DataPreviewConfig)                                   // 保存逻辑视图数据预览配置
			formViewRouter.GET("/preview-config", r.FormViewDomainApi.GetDataPreviewConfig)                                 // 查看逻辑视图数据预览配置
			formViewRouter.GET("/by-technical-name-and-hua-ao-id", r.FormViewDomainApi.GetViewByTechnicalNameAndHuaAoId)    // 通过技术名称和华傲ID查询视图
			dataViewRouter.GET("/department/explore-reports", r.FormViewDomainApi.GetExploreReports)                        // 单个部门探查报告列表查询
			dataViewRouter.POST("/department/explore-reports/export", r.FormViewDomainApi.ExportExploreReports)             // 单个部门导出探查报告
			formViewRouter.GET("/explore-reports", r.FormViewDomainApi.GetDepartmentExploreReports)                         // 所有部门探查报告列表查询
		}
	}

	//dataViewRouter without access_control
	{
		dvRouter := dataViewRouter.Group("")
		dvRouter.GET("/overview", r.FormViewDomainApi.GetDatasourceOverview)                           // 获取数据源概览
		dvRouter.GET("/explore-conf", r.FormViewDomainApi.GetExploreConfig)                            // 获取探查配置
		dvRouter.GET("/user/form-view", r.FormViewDomainApi.GetUsersFormViews)                         // 获取用户有权限下的视图
		dvRouter.GET("/user/form-all-view", r.FormViewDomainApi.GetUsersAllFormViews)                  // 获取用户有权限下与授权的所有视图
		dvRouter.GET("/user/form-view/:id", r.FormViewDomainApi.GetUsersFormViewsFields)               // 获取用户有权限下的视图字段
		dvRouter.POST("/user/form-view/field/multi", r.FormViewDomainApi.GetUsersMultiFormViewsFields) // 获取用户有权限下的多个视图字段
		dvRouter.GET("/subject-domain/logical-view", r.FormViewDomainApi.QueryLogicalEntityByView)     //根据逻辑视图的名称查询逻辑实体的树信息
		dvRouter.POST("/query-stream/start", r.FormViewDomainApi.QueryStreamStart)                     // 流式查询开始
		dvRouter.POST("/query-stream/next", r.FormViewDomainApi.QueryStreamNext)                       // 流式查询下一页
	}

	//dataPrivacyPolicyRouter
	dataPrivacyPolicyRouter := dataViewRouter.Group("/data-privacy-policy")
	{
		dataPrivacyPolicyRouter.GET("", r.DataPrivacyPolicyDomainApi.PageList)                                              // 获取数据隐私策略列表
		dataPrivacyPolicyRouter.POST("", r.DataPrivacyPolicyDomainApi.Create)                                               // 创建数据隐私策略
		dataPrivacyPolicyRouter.PUT("/:id", r.DataPrivacyPolicyDomainApi.Update)                                            // 更新数据隐私策略
		dataPrivacyPolicyRouter.DELETE("/:id", r.DataPrivacyPolicyDomainApi.Delete)                                         // 删除数据隐私策略
		dataPrivacyPolicyRouter.GET("/:id", r.DataPrivacyPolicyDomainApi.GetDetailById)                                     // 获取数据隐私策略详情
		dataPrivacyPolicyRouter.GET("/:id/by-form-view", r.DataPrivacyPolicyDomainApi.GetDetailByFormViewId)                // 根据视图ID获取数据隐私策略详情
		dataPrivacyPolicyRouter.POST("/:id/is-exist", r.DataPrivacyPolicyDomainApi.IsExistByFormViewId)                     // 校验数据隐私策略字段是否存在
		dataPrivacyPolicyRouter.POST("/list/form-view-ids", r.DataPrivacyPolicyDomainApi.GetFormViewIdsByFormViewIds)       // 获取数据隐私策略关联的视图ID列表
		dataPrivacyPolicyRouter.POST("/list/desensitization-data", r.DataPrivacyPolicyDomainApi.GetDesensitizationDataById) // 获取数据隐私策略脱敏数据
	}
	//recognitionAlgorithmRouter
	recognitionAlgorithmRouter := dataViewRouter.Group("/recognition-algorithm")
	{
		recognitionAlgorithmRouter.GET("", r.RecognitionAlgorithmDomainApi.PageList)                            // 获取识别算法列表
		recognitionAlgorithmRouter.POST("", r.RecognitionAlgorithmDomainApi.Create)                             // 创建识别算法
		recognitionAlgorithmRouter.PUT("/:id", r.RecognitionAlgorithmDomainApi.Update)                          // 更新识别算法
		recognitionAlgorithmRouter.DELETE("/:id", r.RecognitionAlgorithmDomainApi.Delete)                       // 删除识别算法
		recognitionAlgorithmRouter.GET("/:id", r.RecognitionAlgorithmDomainApi.GetDetailById)                   // 获取识别算法详情
		recognitionAlgorithmRouter.POST("/:id/start", r.RecognitionAlgorithmDomainApi.Start)                    // 启动识别算法
		recognitionAlgorithmRouter.POST("/:id/stop", r.RecognitionAlgorithmDomainApi.Stop)                      // 停止识别算法
		recognitionAlgorithmRouter.POST("/delete-batch", r.RecognitionAlgorithmDomainApi.DeleteBatch)           // 批量删除识别算法
		recognitionAlgorithmRouter.POST("/working-ids", r.RecognitionAlgorithmDomainApi.GetWorkingAlgorithmIds) // 获取生效的识别算法ID列表
		recognitionAlgorithmRouter.POST("/export", r.RecognitionAlgorithmDomainApi.Export)                      // 导出识别算法
		recognitionAlgorithmRouter.GET("/inner-type/list", r.RecognitionAlgorithmDomainApi.GetInnerType)        // 获取识别算法内置类型
		recognitionAlgorithmRouter.POST("/duplicate-check", r.RecognitionAlgorithmDomainApi.DuplicateCheck)     // 重名校验
		recognitionAlgorithmRouter.POST("/subjects-by-ids", r.RecognitionAlgorithmDomainApi.GetSubjectsByIds)   // 获取识别算法分类属性
	}
	//classificationRuleRouter
	classificationRuleRouter := dataViewRouter.Group("/classification-rule")
	{
		classificationRuleRouter.GET("", r.ClassificationRuleDomainApi.PageList)              // 获取分类规则列表
		classificationRuleRouter.POST("", r.ClassificationRuleDomainApi.Create)               // 创建分类规则
		classificationRuleRouter.PUT("/:id", r.ClassificationRuleDomainApi.Update)            // 更新分类规则
		classificationRuleRouter.DELETE("/:id", r.ClassificationRuleDomainApi.Delete)         // 删除分类规则
		classificationRuleRouter.GET("/:id", r.ClassificationRuleDomainApi.GetDetailById)     // 获取分类规则详情
		classificationRuleRouter.POST("/:id/start", r.ClassificationRuleDomainApi.Start)      // 启动分类规则
		classificationRuleRouter.POST("/:id/stop", r.ClassificationRuleDomainApi.Stop)        // 停止分类规则
		classificationRuleRouter.POST("/export", r.ClassificationRuleDomainApi.Export)        // 导出分类规则
		classificationRuleRouter.GET("/statistics", r.ClassificationRuleDomainApi.Statistics) // 统计分类规则
	}

	// dataSetRouter
	dataSetRouter := dataViewRouter.Group("/data-set")
	{
		dataSetRouter.POST("", r.DataSetDomainApi.Create)                                     // 创建数据集
		dataSetRouter.PUT("/:id", r.DataSetDomainApi.Update)                                  // 更新数据集
		dataSetRouter.DELETE("/:id", r.DataSetDomainApi.Delete)                               // 删除数据集
		dataSetRouter.GET("", r.DataSetDomainApi.PageList)                                    // 获取数据集列表
		dataSetRouter.GET("/view/:id", r.DataSetDomainApi.GetFormViewByIdByDataSetId)         // 获取数据集逻辑视图列表
		dataSetRouter.POST("/add-data-set", r.DataSetDomainApi.AddDataSet)                    //数据集下批量添加视图
		dataSetRouter.POST("/remove-data-set", r.DataSetDomainApi.RemoveFormViewsFromDataSet) //数据集下批量移除视图
		dataSetRouter.GET("/validate", r.DataSetDomainApi.CheckDataSetByName)                 //查询数据集名称是否存在
		dataSetRouter.GET("/view-tree", r.DataSetDomainApi.GetDataSetViewTree)                // 获取数据集视图树结构

	}

	//gradeRuleRouter
	gradeRuleRouter := dataViewRouter.Group("/grade-rule")
	{
		gradeRuleRouter.GET("", r.GradeRuleDomainApi.PageList)                  // 获取分级规则列表
		gradeRuleRouter.POST("", r.GradeRuleDomainApi.Create)                   // 创建分级规则
		gradeRuleRouter.PUT("/:id", r.GradeRuleDomainApi.Update)                // 更新分级规则
		gradeRuleRouter.DELETE("/:id", r.GradeRuleDomainApi.Delete)             // 删除分级规则
		gradeRuleRouter.GET("/:id", r.GradeRuleDomainApi.GetDetailById)         // 获取分级规则详情
		gradeRuleRouter.POST("/:id/start", r.GradeRuleDomainApi.Start)          // 启动分级规则
		gradeRuleRouter.POST("/:id/stop", r.GradeRuleDomainApi.Stop)            // 停止分级规则
		gradeRuleRouter.POST("/export", r.GradeRuleDomainApi.Export)            // 导出分级规则
		gradeRuleRouter.GET("/statistics", r.GradeRuleDomainApi.Statistics)     // 统计分级规则
		gradeRuleRouter.PUT("/group/bind", r.GradeRuleDomainApi.BindGroup)      // 调整规则分组
		gradeRuleRouter.POST("/delete/batch", r.GradeRuleDomainApi.BatchDelete) // 批量删除规则
	}

	// 规则组
	gradeRuleGroupRouter := dataViewRouter.Group("/grade-rule-group")
	{
		gradeRuleGroupRouter.GET("", r.GradeRuleGroupDomainApi.List)            // 获取规则组数据
		gradeRuleGroupRouter.POST("", r.GradeRuleGroupDomainApi.Create)         // 新增规则组
		gradeRuleGroupRouter.PUT("/:id", r.GradeRuleGroupDomainApi.Update)      // 编辑规则组
		gradeRuleGroupRouter.DELETE("/:id", r.GradeRuleGroupDomainApi.Delete)   // 删除规则组
		gradeRuleGroupRouter.POST("/repeat", r.GradeRuleGroupDomainApi.Repeat)  // 规则组名验重
		gradeRuleGroupRouter.GET("/limited", r.GradeRuleGroupDomainApi.Limited) // 规则组数量上限检查
	}

	//数据血缘, 从数据目录迁移过来的
	dataLineageRouter := dataViewRouter.Group("/data-lineage")
	{
		dataLineageRouter.GET("/:id/base", r.DataLineageApi.GetBase)     // 前端展示下的获取base节点及相关信息
		dataLineageRouter.GET("/pre/:vid", r.DataLineageApi.ListLineage) // 前端展示下的分页获取指定节点上一度血缘关系

	}

	//logicView 逻辑视图相关接口
	{
		//logicViewRouter without access_control
		{
			logicViewRouter := dataViewRouter.Group("/logic-view")
			logicViewRouter.GET("/authorizable", r.LogicViewDomainApi.AuthorizableViewList)   // 可授权逻辑视图列表
			logicViewRouter.GET("/subject-domains", r.LogicViewDomainApi.SubjectDomainList)   // 用户有权限的主题域列表
			logicViewRouter.GET("/:id/draft", r.LogicViewDomainApi.GetDraft)                  // 查询视图草稿
			logicViewRouter.DELETE("/:id/draft", r.LogicViewDomainApi.DeleteDraft)            // 删除草稿(恢复到发布)
			logicViewRouter.GET("/:id/synthetic-data", r.LogicViewDomainApi.GetSyntheticData) // 获取合成数据
			logicViewRouter.GET("/:id/sample-data", r.LogicViewDomainApi.GetSampleData)       // 获取样例数据
		}

		//formViewRouter with access_control.FormView
		{
			logicViewRouter := dataViewRouter.Group("/logic-view")
			logicViewRouter.POST("", r.middleware.AuditLogger(), r.LogicViewDomainApi.CreateLogicView)                                  // 创建自定义视图和逻辑实体视图（字段+基本信息）
			logicViewRouter.PUT("", r.LogicViewDomainApi.UpdateLogicView)                                                               // 编辑自定义视图和逻辑实体视图（字段）
			logicViewRouter.POST("audit-process-instance", r.middleware.AuditLogger(), r.LogicViewDomainApi.CreateAuditProcessInstance) //审核流程实例创建
			logicViewRouter.PUT("revoke", r.LogicViewDomainApi.UndoAudit)                                                               //审核撤回
			logicViewRouter.POST("/field/multi", r.FormViewDomainApi.GetMultiViewsFields)                                               // 获取多个逻辑视图字段

		}
	}

	downloadTaskRouter := dataViewRouter.Group("/download-task")
	{
		downloadTaskRouter.POST("", r.middleware.AuditLogger(), r.FormViewDomainApi.CreateDataDownloadTask)                   // 创建下载任务
		downloadTaskRouter.DELETE("/:taskID", r.middleware.AuditLogger(), r.FormViewDomainApi.DeleteDataDownloadTask)         // 删除下载任务
		downloadTaskRouter.GET("", r.FormViewDomainApi.GetDataDownloadTaskList)                                               // 获取下载任务列表
		downloadTaskRouter.GET("/:taskID/download-link", r.middleware.AuditLogger(), r.FormViewDomainApi.GetDataDownloadLink) // 获取下载任务导出文件下载链接
	}

	// 子视图
	subViewRouter := dataViewRouter.Group("sub-views")
	{
		subViewRouter.POST("", r.SubViewDomainApi.Create)      // 创建子视图
		subViewRouter.GET("", r.SubViewDomainApi.List)         // 获取子视图列表
		subViewRouter.DELETE(":id", r.SubViewDomainApi.Delete) // 删除指定子视图
		subViewRouter.PUT(":id", r.SubViewDomainApi.Update)    // 更新指定子视图
		subViewRouter.GET(":id", r.SubViewDomainApi.Get)       // 获取指定子视图
	}

	ExploreTaskRouter := dataViewRouter.Group("/explore-task")
	{
		ExploreTaskRouter.POST("", r.ExploreTaskDomainApi.CreateTask)         // 新建探查任务
		ExploreTaskRouter.GET("", r.ExploreTaskDomainApi.List)                // 探查任务列表
		ExploreTaskRouter.GET("/:id", r.ExploreTaskDomainApi.GetTask)         // 探查任务详情
		ExploreTaskRouter.PUT("/:id", r.ExploreTaskDomainApi.CancelTask)      // 取消探查任务
		ExploreTaskRouter.DELETE("/:id", r.ExploreTaskDomainApi.DeleteRecord) // 删除探查记录
	}
	formViewCompletionRouter := dataViewRouter.Group("/form-view")
	{
		formViewCompletionRouter.POST("/:id/completion/task", r.FormViewDomainApi.CreateCompletion) // 新建逻辑视图补全结果
		formViewCompletionRouter.GET("/:id/completion", r.FormViewDomainApi.GetCompletion)          // 获取逻辑视图补全结果
		formViewCompletionRouter.PUT("/:id/completion", r.FormViewDomainApi.UpdateCompletion)       // 更新逻辑视图补全结果
	}
	exploreConfRuleRouter := dataViewRouter.Group("/explore-config")
	{
		exploreConfRuleRouter.POST("/rule", r.ExploreTaskDomainApi.CreateRule)              // 添加规则
		exploreConfRuleRouter.GET("/rule", r.ExploreTaskDomainApi.GetRuleList)              // 查看视图规则列表
		exploreConfRuleRouter.GET("/rule/:id", r.ExploreTaskDomainApi.GetRule)              // 查看规则详情
		exploreConfRuleRouter.GET("/rule/repeat", r.ExploreTaskDomainApi.NameRepeat)        // 规则重名校验
		exploreConfRuleRouter.PUT("/rule/:id", r.ExploreTaskDomainApi.UpdateRule)           // 修改规则
		exploreConfRuleRouter.PUT("/rule/status", r.ExploreTaskDomainApi.UpdateRuleStatus)  // 修改规则启用状态
		exploreConfRuleRouter.DELETE("/rule/:id", r.ExploreTaskDomainApi.DeleteRule)        // 删除规则
		exploreConfRuleRouter.GET("/internal-rule", r.ExploreTaskDomainApi.GetInternalRule) // 查看内置规则
	}
	templateRuleRouter := dataViewRouter.Group("/template-rule")
	{
		templateRuleRouter.POST("", r.ExploreRuleApi.CreateTemplateRule)             // 添加模板规则
		templateRuleRouter.GET("", r.ExploreRuleApi.GetTemplateRuleList)             // 查看模板规则列表
		templateRuleRouter.GET("/:id", r.ExploreRuleApi.GetTemplateRule)             // 查看模板规则详情
		templateRuleRouter.GET("/repeat", r.ExploreRuleApi.TemplateRuleNameRepeat)   // 模板规则重名校验
		templateRuleRouter.PUT("/:id", r.ExploreRuleApi.UpdateTemplateRule)          // 修改模板规则
		templateRuleRouter.PUT("/status", r.ExploreRuleApi.UpdateTemplateRuleStatus) // 修改模板规则启用状态
		templateRuleRouter.DELETE("/:id", r.ExploreRuleApi.DeleteTemplateRule)       // 删除模板规则
	}
	exploreRuleRouter := dataViewRouter.Group("/explore-rule")
	{
		exploreRuleRouter.POST("", r.ExploreRuleApi.CreateRule)             // 添加规则
		exploreRuleRouter.POST("/batch", r.ExploreRuleApi.BatchCreateRule)  // 批量添加规则
		exploreRuleRouter.GET("", r.ExploreRuleApi.GetRuleList)             // 查看视图规则列表
		exploreRuleRouter.GET("/:id", r.ExploreRuleApi.GetRule)             // 查看规则详情
		exploreRuleRouter.GET("/repeat", r.ExploreRuleApi.NameRepeat)       // 规则重名校验
		exploreRuleRouter.PUT("/:id", r.ExploreRuleApi.UpdateRule)          // 修改规则
		exploreRuleRouter.PUT("/status", r.ExploreRuleApi.UpdateRuleStatus) // 修改规则启用状态
		exploreRuleRouter.DELETE("/:id", r.ExploreRuleApi.DeleteRule)       // 删除规则
	}
	graphModelRouter := dataViewRouter.Group("/graph-model")
	{
		//模型
		graphModelRouter.POST("", r.GraphModelApi.Create)          //创建模型
		graphModelRouter.GET("/check", r.GraphModelApi.CheckExist) //模型名称校验
		graphModelRouter.PUT("/:id", r.GraphModelApi.Update)       //更新模型
		graphModelRouter.GET("/:id", r.GraphModelApi.Get)          //模型详情
		graphModelRouter.GET("", r.GraphModelApi.List)             //模型列表
		graphModelRouter.DELETE("/:id", r.GraphModelApi.Delete)    //删除模型
		//画布
		graphModelRouter.POST("/canvas", r.GraphModelApi.SaveCanvas)   //保存模型画布
		graphModelRouter.GET("/canvas/:id", r.GraphModelApi.GetCanvas) //获模型画布

		// 主题模型设置密级
		graphMJModelRouter := graphModelRouter.Group("/topic-confidential")
		graphMJModelRouter.PUT("/:id", r.GraphModelApi.UpdateMj) //设置主题模型密级

		// 主题模型标签推荐配置
		graphLabelRecModelRouter := graphModelRouter.Group("/topic-label-rec")
		graphLabelRecModelRouter.GET("", r.GraphModelApi.QueryTopicModelLabelRecList)     //主题模型标签推荐配置列表
		graphLabelRecModelRouter.POST("", r.GraphModelApi.CreateTopicModelLabelRec)       //新增主题模型标签推荐配置
		graphLabelRecModelRouter.PUT("/:id", r.GraphModelApi.UpdateTopicModelLabelRec)    //修改主题模型标签推荐配置
		graphLabelRecModelRouter.GET("/:id", r.GraphModelApi.GetTopicModelLabelRec)       //主题模型标签推荐配置详情
		graphLabelRecModelRouter.DELETE("/:id", r.GraphModelApi.DeleteTopicModelLabelRec) //删除主题模型标签推荐配置
	}
}

func (r *Router) RegisterInternal(engine *gin.Engine) {
	internalRouter := engine.Group("/api/internal/data-view/v1", trace.MiddlewareTrace(), r.middleware.TokenPassThrough())

	//internalRouter.POST("/task-project", r.FormViewDomainApi.FinishProject)
	internalRouter.GET("/subject-domain/logical-view/precision", r.FormViewDomainApi.QueryViewDetail) //根据逻辑实体ID查询视图的详细信息
	internalRouter.DELETE("/subject-domain/logic-view/related", r.FormViewDomainApi.DeleteRelated)
	internalRouter.GET("/subject-domain/logic-view/fields", r.FormViewDomainApi.GetRelatedFieldInfo)
	internalRouter.GET("/audits/:apply_id/auditors", r.LogicViewDomainApi.GetViewAuditorsByApplyId) //根据接口申请id获取数据 owner 审核员
	internalRouter.GET("/logic-view/:id/auditors", r.LogicViewDomainApi.GetViewAuditors)            //根据视图ID获取 owner 审核员
	internalRouter.GET("/logic-view/simple", r.LogicViewDomainApi.GetViewBasicInfo)                 //根据ID批量查询逻辑视图
	internalRouter.POST("/sub-views", r.SubViewDomainApi.Create)
	internalRouter.PUT("/sub-views/:id", r.SubViewDomainApi.Update)
	internalRouter.DELETE("/logic-view/:id/synthetic-data", r.LogicViewDomainApi.ClearSyntheticDataCache) // 清除合成数据缓存
	// 获取子视图（行列规则）所属逻辑视图的 ID
	internalRouter.GET("/sub-views/:id/logic_view_id", r.SubViewDomainApi.GetLogicViewID)
	// 获取子视图（行列规则）的 ID 列表
	internalRouter.GET("/sub-view-ids", r.SubViewDomainApi.ListID)
	internalRouter.GET("/sub-view/batch", r.SubViewDomainApi.ListSubViews)
	internalRouter.GET("/form-view/:id", r.FormViewDomainApi.GetFields)                          // 查看逻辑视图字段
	internalRouter.GET("/form-view/authed", r.FormViewDomainApi.HasSubViewAuth)                  // 过滤用户可以授权的视图ID
	internalRouter.GET("/form-view/fields", r.FormViewDomainApi.BatchViewsFields)                // 查看逻辑视图字段
	internalRouter.GET("/form-view/simple", r.FormViewDomainApi.GetViewBasicInfoByTechnicalName) //根据技术名称查询视图基本信息
	internalRouter.GET("/form-view/:id/details", r.FormViewDomainApi.GetFormViewDetails)         // 获取逻辑视图基本信息
	internalRouter.POST("/logic-view/report-info", r.FormViewDomainApi.GetLogicViewReportInfo)   // 获取逻辑视图上报信息
	internalRouter.GET("/form-view/simple/:key", r.FormViewDomainApi.GetViewByKey)

	internalRouter.GET("/data-lineage/parser", r.DataLineageApi.ParserLineage)                                                                    // 解析得到视图血缘数据
	internalRouter.GET("/form-view", r.FormViewDomainApi.PageList)                                                                                // 获取逻辑视图列表
	engine.POST(common_form_view.GetViewListByTechnicalNameInMultiDatasourceUrl, r.FormViewDomainApi.GetViewListByTechnicalNameInMultiDatasource) // 查询多个数据源下根据技术名称数组查询视图
	internalRouter.GET("/explore-config/rule", r.ExploreTaskDomainApi.GetRuleList)                                                                // 查看视图规则列表
	internalRouter.GET("/logic-view/:id/synthetic-data", r.LogicViewDomainApi.GetSyntheticDataCatalog)                                            // 获取合成数据
	internalRouter.GET("/form-view/count", r.FormViewDomainApi.GetTableCount)                                                                     // 获取库表总数
	internalRouter.POST("/form-view/explore-report/batch", r.FormViewDomainApi.BatchGetExploreReport)                                             // 批量获取质量得分报告
	internalRouter.POST("/explore-task/work-order", r.ExploreTaskDomainApi.CreateWorkOrderTask)                                                   // 新建工单探查任务
	internalRouter.POST("/form-view/sync", r.FormViewDomainApi.Sync)                                                                              // 同步统一视图服务视图信息
	internalRouter.GET("/explore-task", r.ExploreTaskDomainApi.GetList)                                                                           // 探查任务列表
	internalRouter.POST("/department/explore-reports", r.FormViewDomainApi.CreateExploreReports)                                                  // 定时更新探查报告表

	internalRouter.GET("/explore-task/progress", r.ExploreTaskDomainApi.GetWorkOrderExploreProgress) // 获取工单探查进度                                                                          // 探查任务列表
}

// RegisterMigration 版本升级接口，发布后不可修改
func (r *Router) RegisterMigration(engine *gin.Engine) {
	internalRouter := engine.Group("/api/internal/data-view/v1", trace.MiddlewareTrace())
	internalRouter.POST("/push-view-to-es", r.LogicViewDomainApi.PushViewToEs)
}
