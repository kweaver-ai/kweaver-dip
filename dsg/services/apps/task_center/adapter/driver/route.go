package driver

import (
	"github.com/gin-gonic/gin"
	"github.com/google/wire"

	dataAggregationInventory "github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driver/data_aggregation_inventory/v1"
	aggregationPlan "github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driver/data_aggregation_plan/v1"
	comprehensionPlan "github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driver/data_comprehension_plan/v1"
	processingOverview "github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driver/data_processing_overview/v1"
	processingPlan "github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driver/data_processing_plan/v1"
	dataQuality "github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driver/data_quality/v1"
	data_research_report "github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driver/data_research_report/v1"
	db_sandbox "github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driver/db_sandbox/v1"
	notification "github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driver/notification/v1"
	operationLog "github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driver/operation_log/v1"
	points_management "github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driver/points_management/v1"
	relationData "github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driver/relation_data/v1"
	tcOss "github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driver/tc_oss/v1"
	tcProject "github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driver/tc_project/v1"
	tcTask "github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driver/tc_task/v1"
	tenant_application "github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driver/tenant_application/v1"
	user "github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driver/user/v1"
	workOrder "github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driver/work_order/v1"
	work_order_manage "github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driver/work_order_manage/v1"
	work_order_task "github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driver/work_order_task/v1"
	work_order_template "github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driver/work_order_template/v1"
	"github.com/kweaver-ai/idrm-go-common/access_control"
	"github.com/kweaver-ai/idrm-go-common/middleware"
	af_trace "github.com/kweaver-ai/idrm-go-frame/core/telemetry/trace"
)

var _ IRouter = (*Router)(nil)

var RouterSet = wire.NewSet(wire.Struct(new(Router), "*"), wire.Bind(new(IRouter), new(*Router)))

type IRouter interface {
	Register(r *gin.Engine) error
}

type Router struct {
	ProjectApi                   *tcProject.ProjectService
	TaskApi                      *tcTask.TaskService
	OssApi                       *tcOss.OssService
	UserApi                      *user.UserService
	OpLogApi                     *operationLog.Service
	RelationDataApi              *relationData.RelationDataService
	ComprehensionPlanServiceApi  *comprehensionPlan.ComprehensionPlanService
	AggregationPlanServiceApi    *aggregationPlan.AggregationPlanService
	DataResearchReportServiceApi *data_research_report.DataResearchReportService
	TenantApplicationServiceApi  *tenant_application.TenantApplicationService
	ProcessingPlanServiceApi     *processingPlan.ProcessingPlanService
	PointsManagementServiceApi   *points_management.PointsManagementService
	Middleware                   middleware.Middleware
	WorkOrderServiceApi          *workOrder.WorkOrderService
	// 工单任务
	WorkOrderTask *work_order_task.Service
	// 数据归集清单
	DataAggregationInventoryApi *dataAggregationInventory.Service
	DataQualityServiceApi       *dataQuality.DataQualityService
	DBSandboxApi                *db_sandbox.Service
	// 工单模板
	WorkOrderTemplateApi *work_order_template.Service
	// 工单模板管理（新接口）
	WorkOrderManageApi *work_order_manage.Service
	ProcessingOverview *processingOverview.ProcessingOverviewService
	NotificationApi    *notification.Service
}

func (a *Router) Register(r *gin.Engine) error {
	a.RegisterInternalApi(r)
	a.RegisterApi(r)
	return nil
}

func (a *Router) RegisterApi(r *gin.Engine) {
	r.Use(af_trace.MiddlewareTrace())

	//taskCenterRouter := r.Group("/api/task-center/v1", localMiddleware.LocalToken())
	taskCenterRouter := r.Group("/api/task-center/v1", a.Middleware.TokenInterception())
	taskCenterInternalRouterV2 := r.Group("/api/internal/task-center/v1")

	//register project router
	{
		{
			projectsRouter := taskCenterRouter.Group("", a.Middleware.AccessControl(access_control.Project))

			projectsRouter.POST("/projects", a.ProjectApi.NewProject)
			projectsRouter.PUT("/projects/:pid", a.ProjectApi.EditProject)
			projectsRouter.GET("/projects/:pid", a.ProjectApi.GetProject)                    //根据项目ID查询项目详情
			projectsRouter.GET("/projects/third-project/:pid", a.ProjectApi.GetThirdProject) //根据第三方项目ID查询项目详情
			projectsRouter.GET("/projects/:pid/flowchart", a.ProjectApi.GetFlowchart)
			projectsRouter.GET("/projects", a.ProjectApi.CardPageQueryProject)
			projectsRouter.GET("/projects/repeat", a.ProjectApi.CheckRepeat)
			projectsRouter.GET("/projects/candidate", a.ProjectApi.ProjectCandidate)
			projectsRouter.GET("/projects/candidate/task-type", a.ProjectApi.ProjectCandidateByTaskType)
			projectsRouter.DELETE("/projects/:pid", a.ProjectApi.DeleteProject)

			taskCenterRouter.GET("/projects/:pid/flowchart/nodes", a.TaskApi.GetFlowchartNodes)
			taskCenterRouter.GET("/projects/:pid/rate", a.TaskApi.GetRate)

			projectsRouter.GET("/projects/:pid/workitem", a.ProjectApi.GetProjectWorkItems) //获取项目下所有工单和任务（工单/任务看板）
			projectsRouter.GET("/projects/users", a.UserApi.ProjectUsers)                   //查询项目负责人用户

		}

		{
			tasksRouter := taskCenterRouter.Group("", a.Middleware.AccessControl(access_control.Task))

			tasksRouter.POST("/projects/task", a.TaskApi.NewTask)
			tasksRouter.PUT("/projects/tasks/:id", a.TaskApi.UpdateTask)
			tasksRouter.GET("/projects/tasks/:id", a.TaskApi.GetTaskById)
			tasksRouter.GET("/projects/tasks/model/:id", a.TaskApi.GetTaskByModelID)
			tasksRouter.GET("/tasks/brief", a.TaskApi.GetTaskBrief)
			tasksRouter.GET("/tasks", a.TaskApi.GetTasks)
			tasksRouter.GET("/projects/:pid/task/:task_type/members", a.TaskApi.GetTaskMember)
			tasksRouter.GET("/executors", a.TaskApi.GetMyTaskExecutors)
			tasksRouter.GET("/projects/:pid/executors", a.TaskApi.GetProjectTaskExecutors)
			tasksRouter.DELETE("/projects/tasks/:id", a.TaskApi.DeleteTask)
			tasksRouter.DELETE("/projects/tasks/batch/ids", a.TaskApi.BatchDeleteTask)
		}
		//taskCenterRouter.POST("/oss", a.OssApi.OssUpload)
		//taskCenterRouter.GET("/oss/:uuid", a.OssApi.GetObj)
		taskCenterRouter.GET("/users", a.UserApi.AllUsers)

		taskCenterRouter.GET("/operation", a.OpLogApi.QueryOperationLog)
	}

	{
		//项目任务关联数据的接口，业务治理使用，
		taskCenterRouter.PUT("/internal/relation/data", a.RelationDataApi.UpdateRelation) //插入任务关系数据
		taskCenterRouter.GET("/internal/relation/data", a.RelationDataApi.QueryRelation)  //查询关系数据
	}

	//oss
	taskCenterRouter.POST("/oss", a.OssApi.OssUpload)
	taskCenterRouter.GET("/oss/:uuid", a.OssApi.GetObj)

	taskCenterInternalRouter := r.Group("/api/task-center/v1")
	{
		taskCenterInternalRouter.GET("/internal/tasks/:id", a.TaskApi.GetTaskInfoById)
	}

	dataRouter := taskCenterRouter.Group("/data")
	// data_comprehension_plan
	dataRouter.POST("/comprehension-plan", a.ComprehensionPlanServiceApi.Create)                    // 创建数据理解计划
	dataRouter.DELETE("/comprehension-plan/:id", a.ComprehensionPlanServiceApi.Delete)              // 删除数据理解计划
	dataRouter.PUT("/comprehension-plan/:id", a.ComprehensionPlanServiceApi.Update)                 // 修改数据理解计划
	dataRouter.PUT("/comprehension-plan/:id/status", a.ComprehensionPlanServiceApi.UpdateStatus)    // 修改工单状态
	dataRouter.GET("/comprehension-plan/:id", a.ComprehensionPlanServiceApi.GetById)                // 查看数据理解计划详情
	dataRouter.GET("/comprehension-plan", a.ComprehensionPlanServiceApi.List)                       // 查看数据理解计划列表
	dataRouter.GET("/comprehension-plan/name-check", a.ComprehensionPlanServiceApi.CheckNameRepeat) // 检查理解计划是否同名
	dataRouter.PUT("/comprehension-plan/:id/audit/cancel", a.ComprehensionPlanServiceApi.Cancel)    // 撤回数据理解计划审核
	dataRouter.GET("/comprehension-plan/audit", a.ComprehensionPlanServiceApi.AuditList)            // 查看数据理解计划审核列表

	// data_aggregation_plan
	dataRouter.POST("/aggregation-plan", a.AggregationPlanServiceApi.Create)                    // 创建数据归集计划
	dataRouter.DELETE("/aggregation-plan/:id", a.AggregationPlanServiceApi.Delete)              // 删除数据归集计划
	dataRouter.PUT("/aggregation-plan/:id", a.AggregationPlanServiceApi.Update)                 // 修改数据归集计划
	dataRouter.PUT("/aggregation-plan/:id/status", a.AggregationPlanServiceApi.UpdateStatus)    // 修改工单状态
	dataRouter.GET("/aggregation-plan/:id", a.AggregationPlanServiceApi.GetById)                // 查看数据归集计划详情
	dataRouter.GET("/aggregation-plan", a.AggregationPlanServiceApi.List)                       // 查看数据归集计划列表
	dataRouter.GET("/aggregation-plan/name-check", a.AggregationPlanServiceApi.CheckNameRepeat) // 检查数据归集计划是否同名
	dataRouter.PUT("/aggregation-plan/:id/audit/cancel", a.AggregationPlanServiceApi.Cancel)    // 撤回数据归集计划审核
	dataRouter.GET("/aggregation-plan/audit", a.AggregationPlanServiceApi.AuditList)            // 查看数据归集计划审核列表

	// data_processing_plan
	dataRouter.POST("/processing-plan", a.ProcessingPlanServiceApi.Create)                    // 创建数据处理计划
	dataRouter.DELETE("/processing-plan/:id", a.ProcessingPlanServiceApi.Delete)              // 删除数据处理计划
	dataRouter.PUT("/processing-plan/:id", a.ProcessingPlanServiceApi.Update)                 // 修改数据处理计划
	dataRouter.PUT("/processing-plan/:id/status", a.ProcessingPlanServiceApi.UpdateStatus)    // 修改工单状态
	dataRouter.GET("/processing-plan/:id", a.ProcessingPlanServiceApi.GetById)                // 查看数据处理计划详情
	dataRouter.GET("/processing-plan", a.ProcessingPlanServiceApi.List)                       // 查看数据处理计划列表
	dataRouter.GET("/processing-plan/name-check", a.ProcessingPlanServiceApi.CheckNameRepeat) // 检查数据处理计划是否同名
	dataRouter.PUT("/processing-plan/:id/audit/cancel", a.ProcessingPlanServiceApi.Cancel)    // 撤回数据处理计划审核
	dataRouter.GET("/processing-plan/audit", a.ProcessingPlanServiceApi.AuditList)            // 查看数据处理计划审核列表

	// work_order
	workOrderRouter := taskCenterRouter.Group("", a.Middleware.AccessControl(access_control.WorkOrder))

	workOrderRouter.POST("/work-order", a.WorkOrderServiceApi.Create)                                                  // 创建工单
	workOrderRouter.PUT("/work-order/:id", a.WorkOrderServiceApi.Update)                                               // 修改工单
	workOrderRouter.PUT("/work-order/:id/status", a.WorkOrderServiceApi.UpdateStatus)                                  // 修改工单状态
	workOrderRouter.GET("/work-order/name-check", a.WorkOrderServiceApi.CheckNameRepeat)                               // 检查工单是否同名
	workOrderRouter.GET("/work-order", a.WorkOrderServiceApi.List)                                                     // 查看工单列表
	workOrderRouter.GET("/work-order/:id", a.WorkOrderServiceApi.GetById)                                              // 查看工单详情
	workOrderRouter.DELETE("/work-order/:id", a.WorkOrderServiceApi.Delete)                                            // 删除工单
	workOrderRouter.GET("/work-order/created-by-me", a.WorkOrderServiceApi.ListCreatedByMe)                            // 查看工单列表，创建人是我
	workOrderRouter.GET("/work-order/my-responsibilities", a.WorkOrderServiceApi.ListMyResponsibilities)               // 查看工单列表，责任人是我。如果配置了工单审核，则排除未通过审核的工单。
	workOrderRouter.GET("/work-order/acceptance", a.WorkOrderServiceApi.AcceptanceList)                                // 查看工单签收列表
	workOrderRouter.GET("/work-order/processing", a.WorkOrderServiceApi.ProcessingList)                                // 查看工单处理列表
	workOrderRouter.PUT("/work-order/:id/audit/cancel", a.WorkOrderServiceApi.Cancel)                                  // 撤回工单审核
	workOrderRouter.GET("/work-order/audit", a.WorkOrderServiceApi.AuditList)                                          // 查看工单审核列表
	workOrderRouter.PUT("/work-order/:id/remind", a.WorkOrderServiceApi.Remind)                                        // 催办
	workOrderRouter.PUT("/work-order/:id/feedback", a.WorkOrderServiceApi.Feedback)                                    // 反馈
	workOrderRouter.PUT("/work-order/:id/reject", a.WorkOrderServiceApi.Reject)                                        // 驳回工单
	workOrderRouter.POST("/work-order/:id/sync", a.WorkOrderServiceApi.Sync)                                           // 同步工单到第三方
	workOrderRouter.GET("/work-order/data-quality-improvement", a.WorkOrderServiceApi.DataQualityImprovement)          // 查看质量工单整改信息
	workOrderRouter.POST("/work-order/quality-audit-check", a.WorkOrderServiceApi.CheckQualityAuditRepeat)             // 检查质量稽核是否重复
	workOrderRouter.POST("/work-order/list", a.WorkOrderServiceApi.GetList)                                            // 根据来源id或者工单id批量查询工单列表
	workOrderRouter.POST("/work-order/quality-report", a.DataQualityServiceApi.ReceiveQualityReport)                   // 接收质量报告
	workOrderRouter.POST("/work-order/fusion-preview-sql", a.WorkOrderServiceApi.DataFusionPreviewSQL)                 //预览融合工单sql                  // 接收质量报告
	workOrderRouter.GET("/work-order/aggregation-for-quality-audit", a.WorkOrderServiceApi.AggregationForQualityAudit) // 给质检工单使用的归集工单列表
	workOrderRouter.GET("/work-order/:id/quality-audit-resource", a.WorkOrderServiceApi.QualityAuditResource)          // 查看质量检测资源

	workOrderRouter.POST("/work-order/:id/re-explore", a.WorkOrderServiceApi.ReExplore) // 质量检测工单探查
	
	// 工单任务 WorkOrderTask
	{
		g := taskCenterRouter.Group("work-order-tasks")
		g.POST("", a.WorkOrderTask.Create)   // 创建工单任务
		g.GET("", a.WorkOrderTask.List)      // 获取工单任务列表
		g.GET(":id", a.WorkOrderTask.Get)    // 获取工单任务
		g.PUT(":id", a.WorkOrderTask.Update) // 更新工单任务
		f := taskCenterRouter.Group("frontend/work-order-tasks")
		f.GET("", a.WorkOrderTask.ListFrontend)                                                                      // 获取工单任务列表
		taskCenterInternalRouterV2.GET("/work-order-tasks/data-aggregation", a.WorkOrderTask.GetDataAggregationTask) // 获取归集任务详情
	}
	{
		taskCenterInternalRouterV2.GET("/catalog-task-status", a.WorkOrderTask.CatalogTaskStatus) // 获取目录任务状态
		taskCenterRouter.GET("/catalog-task", a.WorkOrderTask.CatalogTask)                        // 获取目录任务详情
	}
	// 工单任务批量接口
	{
		g := taskCenterRouter.Group("batch/work-order-tasks")
		g.POST("", a.WorkOrderTask.BatchCreate) // 批量创建
		g.PUT("", a.WorkOrderTask.BatchUpdate)  // 批量更新
	}

	// 数据归集清单 DataAggregationInventory
	{
		g := taskCenterRouter.Group("data-aggregation-inventories")
		g.POST("", a.DataAggregationInventoryApi.Create)                                                                             // 创建
		g.DELETE(":id", a.DataAggregationInventoryApi.Delete)                                                                        // 删除
		g.PUT(":id", a.DataAggregationInventoryApi.Update)                                                                           // 更新，全量
		g.GET(":id", a.DataAggregationInventoryApi.Get)                                                                              // 获取
		g.GET("", a.DataAggregationInventoryApi.List)                                                                                // 获取列表
		taskCenterInternalRouterV2.GET("/data-aggregation-inventories/data-tables", a.DataAggregationInventoryApi.BatchGetDataTable) // 批量获取物化的数据表
		g.GET("check-name", a.DataAggregationInventoryApi.CheckName)                                                                 // 检查归集清单名称是否存在
	}

	// 数据质量工单
	{
		g := taskCenterRouter.Group("data-quality")
		g.GET("/reports", a.DataQualityServiceApi.ReportList)       // 数据质量报告列表
		g.GET("/improvement", a.DataQualityServiceApi.Improvement)  // 数据质量工单整改内容对比
		g.GET("/status", a.DataQualityServiceApi.DataQualityStatus) // 数据质量工单整改状态
		// g.POST("/reports", a.DataQualityServiceApi.ReceiveQualityReport) // 接收质量报告
	}

	// 工单模板管理
	{
		g := taskCenterRouter.Group("work-order-template")
		g.POST("", a.WorkOrderTemplateApi.Create)                // 创建工单模板
		g.GET("", a.WorkOrderTemplateApi.List)                   // 获取工单模板列表
		g.GET(":id", a.WorkOrderTemplateApi.Get)                 // 获取工单模板详情
		g.PUT(":id", a.WorkOrderTemplateApi.Update)              // 更新工单模板
		g.PUT(":id/:state", a.WorkOrderTemplateApi.UpdateStatus) // 更新工单模板状态
		g.DELETE(":id", a.WorkOrderTemplateApi.Delete)           // 删除工单模板
	}

	pointsRouter := taskCenterRouter.Group("/points-management")
	pointsRouter.POST("/", a.PointsManagementServiceApi.Create)                                                       // 创建积分规则
	pointsRouter.PUT("/", a.PointsManagementServiceApi.Update)                                                        // 更新积分规则
	pointsRouter.GET("/:strategy_code", a.PointsManagementServiceApi.Detail)                                          // 查看积分规则详情
	pointsRouter.DELETE("/:strategy_code", a.PointsManagementServiceApi.Delete)                                       // 删除积分规则
	pointsRouter.GET("/", a.PointsManagementServiceApi.List)                                                          // 查看积分规则列表
	pointsRouter.GET("/events", a.PointsManagementServiceApi.PointsEventList)                                         // 查看积分事件列表
	pointsRouter.GET("/events/download", a.PointsManagementServiceApi.ExportPointsEventList)                          // 导出积分事件列表
	pointsRouter.GET("/summary", a.PointsManagementServiceApi.PersonalAndDepartmentPointsSummary)                     // 个人和部门积分汇总
	pointsRouter.GET("/dashboard/department-top", a.PointsManagementServiceApi.DepartmentPointsTop)                   // 部门积分排名前五
	pointsRouter.GET("/dashboard/business-module", a.PointsManagementServiceApi.PointsEventGroupByCode)               // 按积分策略分组统计
	pointsRouter.GET("/dashboard/business-module/group", a.PointsManagementServiceApi.PointsEventGroupByCodeAndMonth) // 按积分策略和月份分组统计
	dataRouter.POST("/research-report", a.DataResearchReportServiceApi.Create)                                        // 创建数据调研报告
	dataRouter.DELETE("/research-report/:id", a.DataResearchReportServiceApi.Delete)                                  // 删除数据调研报告
	dataRouter.PUT("/research-report/:id", a.DataResearchReportServiceApi.Update)                                     // 修改数据调研报告
	dataRouter.GET("/research-report/:id", a.DataResearchReportServiceApi.GetById)                                    // 查看数据调研报告详情
	dataRouter.GET("/research-report/work-order/:id", a.DataResearchReportServiceApi.GetByWorkOrderId)                // 查看数据调研报告详情(根据工单id)
	dataRouter.GET("/research-report", a.DataResearchReportServiceApi.List)                                           // 查看数据调研报告列表
	dataRouter.GET("/research-report/name-check", a.DataResearchReportServiceApi.CheckNameRepeat)                     // 检查数据调研报告是否同名
	dataRouter.PUT("/research-report/:id/audit/cancel", a.DataResearchReportServiceApi.Cancel)                        // 撤回数据调研报告审核
	dataRouter.GET("/research-report/audit", a.DataResearchReportServiceApi.AuditList)                                // 查看数据调研报告审核列表

	// 租户申请管理
	taskCenterRouter.POST("/tenant-application", a.TenantApplicationServiceApi.Create)                    // 创建租户申请
	taskCenterRouter.DELETE("/tenant-application/:id", a.TenantApplicationServiceApi.Delete)              // 删除租户申请
	taskCenterRouter.PUT("/tenant-application/:id", a.TenantApplicationServiceApi.Update)                 // 修改租户申请
	taskCenterRouter.GET("/tenant-application/:id", a.TenantApplicationServiceApi.GetDetails)             // 查看租户申请详情
	taskCenterRouter.GET("/tenant-application", a.TenantApplicationServiceApi.GetList)                    // 查看租户申请列表
	taskCenterRouter.GET("/tenant-application/name-check", a.TenantApplicationServiceApi.CheckNameRepeat) // 检查租户申请是否同名
	taskCenterRouter.PUT("/tenant-application/:id/audit/cancel", a.TenantApplicationServiceApi.Cancel)    // 撤回租户申请审核
	taskCenterRouter.GET("/tenant-application/audit", a.TenantApplicationServiceApi.AuditList)            // 查看租户申请审核列表
	taskCenterRouter.PUT("/tenant-application/:id/status", a.TenantApplicationServiceApi.UpdateTenantApplicationStatus)

	// 数据库沙箱管理
	dbSandboxGroup := taskCenterRouter.Group("/sandbox")
	{
		//申请
		dbSandboxGroup.POST("/apply", a.DBSandboxApi.Apply)      //沙箱申请
		dbSandboxGroup.POST("/extend", a.DBSandboxApi.Extend)    //沙箱扩容
		dbSandboxGroup.GET("/:id", a.DBSandboxApi.SandboxDetail) //沙箱详情
		dbSandboxGroup.GET("", a.DBSandboxApi.ApplyList)         //沙箱申请列表
		//实施
		dbSandboxGroup.POST("/execution", a.DBSandboxApi.Executing)          //沙箱实施
		dbSandboxGroup.PUT("/execution", a.DBSandboxApi.Executed)            //完成实施
		dbSandboxGroup.GET("/execution", a.DBSandboxApi.ExecutionList)       //沙箱实施列表
		dbSandboxGroup.GET("/execution/:id", a.DBSandboxApi.ExecutionDetail) //沙箱实施详情
		dbSandboxGroup.GET("/execution/logs", a.DBSandboxApi.ExecutionLogs)  //沙箱实施日志
		//沙箱空间
		dbSandboxGroup.GET("/space", a.DBSandboxApi.SandboxSpaceList)       //沙箱空间列表
		dbSandboxGroup.GET("/space/:id", a.DBSandboxApi.SandboxSpaceSimple) //沙箱简略信息
		//审核
		dbSandboxGroup.GET("/audit", a.DBSandboxApi.AuditList)             //待审核列表
		dbSandboxGroup.PUT("/audit/revocation", a.DBSandboxApi.Revocation) //撤回审核
	}

	// 数据获取概览
	dateProcessingOverviewGroup := taskCenterRouter.Group("/date_processing")
	{
		dateProcessingOverviewGroup.GET("/overview", a.ProcessingOverview.GetOverview)                                            //数据处理概览
		dateProcessingOverviewGroup.GET("/overview/results_table_catalog", a.ProcessingOverview.GetResultsTableCatalog)           //成果表数据资源目录列表
		dateProcessingOverviewGroup.GET("/overview/quality_department", a.ProcessingOverview.GetQualityTableDepartment)           //应检测部门详情
		dateProcessingOverviewGroup.GET("/overview/department_quality_process", a.ProcessingOverview.GetDepartmentQualityProcess) //部门整改情况详情
		dateProcessingOverviewGroup.GET("/overview/process_task", a.ProcessingOverview.GetProcessTask)                            //加工任务详情
		dateProcessingOverviewGroup.GET("/overview/target_table", a.ProcessingOverview.GetTargetTable)                            //成果表详情
		dateProcessingOverviewGroup.GET("/overview/sync", a.ProcessingOverview.SyncOverview)                                      //手动同步接口

	}

	// 工单模板管理（新接口）
	{
		g := taskCenterRouter.Group("work-order-manage")
		g.POST("", a.WorkOrderManageApi.Create)                   // 创建工单模板
		g.GET("", a.WorkOrderManageApi.List)                      // 获取工单模板列表
		g.GET("check-name", a.WorkOrderManageApi.CheckNameExists) // 校验模板名称是否存在
		// 版本相关路由需要先注册（更具体的路径优先匹配）
		g.GET(":id/versions/:version", a.WorkOrderManageApi.GetVersion) // 获取历史版本详情
		g.GET(":id/versions", a.WorkOrderManageApi.ListVersions)        // 获取历史版本列表
		// 主路由（通用路径，最后匹配）
		g.GET(":id", a.WorkOrderManageApi.Get)       // 获取工单模板详情
		g.PUT(":id", a.WorkOrderManageApi.Update)    // 更新工单模板
		g.DELETE(":id", a.WorkOrderManageApi.Delete) // 删除工单模板
	}

	// 用户通知
	{
		assetPortalRouter := taskCenterRouter.Group("notifications")
		assetPortalRouter.GET("", a.NotificationApi.List)
		assetPortalRouter.PUT("", a.NotificationApi.ReadAll)
		assetPortalRouter.GET("/:id", a.NotificationApi.Get)
		assetPortalRouter.PUT("/:id", a.NotificationApi.Read)
	}

}
func (a *Router) RegisterInternalApi(r *gin.Engine) {
	taskCenterInternalRouter := r.Group("/api/internal/task-center/v1", af_trace.MiddlewareTrace())
	taskCenterInternalRouter.POST("/data-comprehension-template", a.TaskApi.GetComprehensionTemplateRelation) // 查询该数据理解模板是否绑定任务
	taskCenterInternalRouter.GET("/projects/:pid/process", a.ProjectApi.QueryDomainCreatedByProject)          // 查询项目内创造的业务流程
	taskCenterInternalRouter.POST("/work-order/list", a.WorkOrderServiceApi.GetList)                          // 根据来源id批量查询工单列表
	//沙箱
	taskCenterInternalRouter.GET("/sandbox/:id", a.DBSandboxApi.SandboxSpaceSimple)   //沙箱简略信息
	taskCenterInternalRouter.GET("/sandbox/detail/:id", a.DBSandboxApi.SandboxDetail) //沙箱详情
}
