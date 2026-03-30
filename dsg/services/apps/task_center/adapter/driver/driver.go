package driver

import (
	"github.com/google/wire"
	db_sandbox "github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driver/db_sandbox/v1"
	"github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driver/mq/data_catalog"

	data_aggregation_inventory "github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driver/data_aggregation_inventory/v1"
	data_aggregation_plan "github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driver/data_aggregation_plan/v1"
	data_comprehension_plan "github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driver/data_comprehension_plan/v1"
	data_processing_overview "github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driver/data_processing_overview/v1"
	data_processing_plan "github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driver/data_processing_plan/v1"
	data_quality "github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driver/data_quality/v1"
	data_research_report "github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driver/data_research_report/v1"
	localMiddleware "github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driver/middleware"
	"github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driver/mq"
	"github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driver/mq/domain"
	"github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driver/mq/points"
	"github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driver/mq/role"
	"github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driver/mq/user_mgm"
	notification "github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driver/notification/v1"
	operationLog "github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driver/operation_log/v1"
	points_management "github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driver/points_management/v1"
	relationData "github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driver/relation_data/v1"
	tcOss "github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driver/tc_oss/v1"
	tcProject "github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driver/tc_project/v1"
	tcTask "github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driver/tc_task/v1"
	tenant_application "github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driver/tenant_application/v1"
	user "github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driver/user/v1"
	work_order "github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driver/work_order/v1"
	work_order_manage "github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driver/work_order_manage/v1"
	work_order_task "github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driver/work_order_task/v1"
	work_order_template "github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driver/work_order_template/v1"
	"github.com/kweaver-ai/idrm-go-common/audit"
	gocephclient "github.com/kweaver-ai/idrm-go-common/go-ceph-client"
	middlewareImpl "github.com/kweaver-ai/idrm-go-common/middleware/v1"
)

// HttpProviderSet is server providers.
var HttpProviderSet = wire.NewSet(
	middleWireSet,
	NewHttpServer,
	NewCommonService,
	// set.Middleware,
)

var middleWireSet = wire.NewSet(
	localMiddleware.NewHydra,
	localMiddleware.NewUserMgnt,
	localMiddleware.NewConfigurationCenterDriven,
	NewAuditLogger,
	middlewareImpl.NewMiddleware,
)

var consumerServiceSet = wire.NewSet(
	mq.NewMQConsumerService,
	user_mgm.NewUserMgmHandler,
	domain.NewBusinessDomainHandler,
	role.NewRoleHandler,
	points.NewPointsEventHandler,
	data_catalog.NewDataCatalogHandler,
)

var ServiceProviderSet = wire.NewSet(
	consumerServiceSet,
	data_aggregation_inventory.New,
	tcProject.NewProjectService,
	tcTask.NewTaskService,
	tcOss.NewOssService,
	operationLog.NewService,
	user.NewUserService,
	data_comprehension_plan.NewUserService,
	data_aggregation_plan.NewUserService,
	data_processing_plan.NewUserService,
	data_processing_overview.NewUserService,
	relationData.NewRelationDataService,
	gocephclient.NewCephClient,
	work_order.NewUserService,
	data_research_report.NewUserService,
	points_management.NewPointsManagementService,
	work_order_task.New,
	data_quality.NewUserService,
	tenant_application.NewUserService,
	db_sandbox.NewService,
	work_order_template.ServiceSet,
	work_order_manage.ServiceSet,
	notification.New,
)

func NewAuditLogger() audit.Logger {
	return audit.Discard()
}
