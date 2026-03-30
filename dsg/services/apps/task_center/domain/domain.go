package domain

import (
	"github.com/google/wire"
	dbSandbox "github.com/kweaver-ai/dsg/services/apps/task_center/domain/db_sandbox/impl"
	"github.com/kweaver-ai/dsg/services/apps/task_center/domain/work_order_alarm"

	"github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/workflow"
	wf_rest "github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/workflow"
	"github.com/kweaver-ai/dsg/services/apps/task_center/domain/data_aggregation_inventory"
	data_aggregation_plan "github.com/kweaver-ai/dsg/services/apps/task_center/domain/data_aggregation_plan/impl"
	data_comprehension_plan "github.com/kweaver-ai/dsg/services/apps/task_center/domain/data_comprehension_plan/impl"
	data_processing_overview "github.com/kweaver-ai/dsg/services/apps/task_center/domain/data_processing_overview/impl"
	data_processing_plan "github.com/kweaver-ai/dsg/services/apps/task_center/domain/data_processing_plan/impl"
	data_quality "github.com/kweaver-ai/dsg/services/apps/task_center/domain/data_quality/impl"
	data_research_report "github.com/kweaver-ai/dsg/services/apps/task_center/domain/data_research_report/impl"
	notification "github.com/kweaver-ai/dsg/services/apps/task_center/domain/notification"
	operationLog "github.com/kweaver-ai/dsg/services/apps/task_center/domain/operation_log/impl"
	points "github.com/kweaver-ai/dsg/services/apps/task_center/domain/points_management/impl"
	relationData "github.com/kweaver-ai/dsg/services/apps/task_center/domain/relation_data/impl"
	tcOss "github.com/kweaver-ai/dsg/services/apps/task_center/domain/tc_oss/impl"
	tcProject "github.com/kweaver-ai/dsg/services/apps/task_center/domain/tc_project/impl"
	tcTask "github.com/kweaver-ai/dsg/services/apps/task_center/domain/tc_task/impl"
	tenant_application "github.com/kweaver-ai/dsg/services/apps/task_center/domain/tenant_application/impl"
	user "github.com/kweaver-ai/dsg/services/apps/task_center/domain/user/impl"
	work_order "github.com/kweaver-ai/dsg/services/apps/task_center/domain/work_order/impl"
	work_order_manage "github.com/kweaver-ai/dsg/services/apps/task_center/domain/work_order_manage"
	work_order_task "github.com/kweaver-ai/dsg/services/apps/task_center/domain/work_order_task"
	work_order_template "github.com/kweaver-ai/dsg/services/apps/task_center/domain/work_order_template"
	demand_management "github.com/kweaver-ai/idrm-go-common/rest/demand_management/impl"
)

// ProviderSet is biz providers.
var ProviderSet = wire.NewSet(
	tcProject.NewProjectUserCase,
	tcTask.NewTaskUserCase,
	tcOss.NewOssUserCase,
	operationLog.NewOperationLogUserCase,
	user.NewUser,
	relationData.NewUseCase,
	data_comprehension_plan.NewDataComprehensionPlan,
	data_aggregation_plan.NewDataComprehensionPlan,
	data_processing_plan.NewDataComprehensionPlan,
	data_processing_overview.NewDataProcessingOverview,
	wf_rest.NewWorkflow,
	wf_rest.NewWFStarter,
	workflow.NewWorkflowRest,
	work_order.NewWorkOrderUseCase,
	work_order.NewWorkOrderInterface,
	// wf_impl.NewWorkflowDriven,
	data_aggregation_inventory.New,
	data_research_report.NewDataResearchReport,
	points.NewPointsManagement,
	work_order_task.New,
	demand_management.NewDemandManagementDriven,
	data_quality.NewDataQualityUseCase,
	tenant_application.NewTenantApplication,
	dbSandbox.NewUseCase,
	work_order_template.New,
	work_order_manage.New,
	notification.New,
	work_order_alarm.New,
)
