package driver

import (
	"github.com/gin-gonic/gin"
	"github.com/google/wire"
	exploration "github.com/kweaver-ai/dsg/services/apps/data-exploration-service/adapter/driver/exploration/v1"
	task_config "github.com/kweaver-ai/dsg/services/apps/data-exploration-service/adapter/driver/task_config/v1"
	"github.com/kweaver-ai/idrm-go-common/middleware"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/trace"
)

var _ IRouter = (*Router)(nil)

var RouterSet = wire.NewSet(wire.Struct(new(Router), "*"), wire.Bind(new(IRouter), new(*Router)))

type IRouter interface {
	Register(r *gin.Engine) error
}

type Router struct {
	Middleware                middleware.Middleware
	DataExplorationController *exploration.Controller
	TaskConfigController      *task_config.Controller
}

func (r *Router) Register(engine *gin.Engine) error {
	r.registerApi(engine)
	return nil
}

func (r *Router) registerApi(engine *gin.Engine) {
	internalRouter := engine.Group("/api/internal/data-exploration-service/v1")
	desRouter := engine.Group("/api/data-exploration-service/v1", r.Middleware.TokenInterception())
	internalRouter.Use(trace.MiddlewareTrace())
	desRouter.Use(trace.MiddlewareTrace())
	// task
	{
		taskGroup := desRouter.Group("/task")
		{
			// 新增
			taskGroup.POST("", r.TaskConfigController.CreateTaskConfig)
			// 更新
			taskGroup.PUT(":task_id", r.TaskConfigController.UpdateTaskConfig)

			// 获取
			taskGroup.GET(":task_id", r.TaskConfigController.GetTaskConfig)
			// 删除
			taskGroup.DELETE(":task_id", r.TaskConfigController.DeleteTaskConfig)

		}
		internalRouter.POST("/task", r.TaskConfigController.InternalCreateTaskConfig)
		internalRouter.PUT("/task/:task_id", r.TaskConfigController.InternalUpdateTaskConfig)
		internalRouter.GET("/task/status", r.TaskConfigController.GetTaskStatus)
		internalRouter.POST("/task/status", r.TaskConfigController.GetTableTaskStatus)
		internalRouter.POST("/third-party-task", r.TaskConfigController.InternalCreateThirdPartyTaskConfig)
		tasksGroup := desRouter.Group("/tasks")
		{
			// 列表
			tasksGroup.GET("", r.TaskConfigController.GetTaskConfigList)
		}
	}

	{
		reportRouter := desRouter.Group("/report")
		{
			reportRouter.GET("", r.DataExplorationController.GetDataExploreReportByParam)
			reportRouter.GET("/field", r.DataExplorationController.GetFieldDataExploreReport)
			reportRouter.DELETE("/:task_id", r.DataExplorationController.DeleteDataExploreReport)
			reGroup := reportRouter.Group("/:code")
			reGroup.GET("", r.DataExplorationController.GetDataExploreReport)
		}
		internalRouter.POST("/report", r.DataExplorationController.GetDataExploreReports)
		desRouter.GET("/third-party-report", r.DataExplorationController.GetDataExploreThirdPartyReportByParam)
		internalRouter.GET("/third-party-report", r.DataExplorationController.GetDataExploreThirdPartyReportByParam)
		reportsRouter := desRouter.Group("/reports")
		{
			//reportsRouter.POST("", r.DataExplorationController.DataExplore)
			reportsRouter.GET("", r.DataExplorationController.GetDataExploreReportList)
			//internalRouter.POST("/reports", r.DataExplorationController.InternalDataExplore)
			internalRouter.GET("/reports", r.DataExplorationController.InternalGetDataExploreReportList)
		}
		desRouter.GET("/third-party-reports", r.DataExplorationController.GetDataExploreThirdPartyReportList)
		exploreTaskGroup := desRouter.Group("/explore-task")
		{
			exploreTaskGroup.DELETE("/:id", r.DataExplorationController.DeleteTask)
		}

	}
}
