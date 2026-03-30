package gorm

import (
	"github.com/google/wire"

	"github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/gorm/alarm_rule"
	configuration "github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/gorm/configuration"
	"github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/gorm/data_aggregation_inventory"
	data_aggregation_plan "github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/gorm/data_aggregation_plan/impl"
	"github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/gorm/data_aggregation_resource"
	data_comprehension_plan "github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/gorm/data_comprehension_plan/impl"
	data_processing_overview "github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/gorm/data_processing_overview/impl"
	data_processing_plan "github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/gorm/data_processing_plan/impl"
	data_quality_improvement "github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/gorm/data_quality_improvement/impl"
	data_research_report "github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/gorm/data_research_report/impl"
	"github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/gorm/database"
	dbSandbox "github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/gorm/db_sandbox/impl"
	fusion_model "github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/gorm/fusion_model/impl"
	"github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/gorm/notification"
	operationLog "github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/gorm/operation_log/impl"
	points "github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/gorm/points_management/impl"
	quality_audit_model "github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/gorm/quality_audit_model/impl"
	taskRelationData "github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/gorm/task_relation_data/impl"
	tcFlowInfo "github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/gorm/tc_flow_info/impl"
	tcMember "github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/gorm/tc_member/impl"
	tcOss "github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/gorm/tc_oss/impl"
	tcProject "github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/gorm/tc_project/impl"
	tcTask "github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/gorm/tc_task/impl"
	tenant_application "github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/gorm/tenant_application/impl"
	user "github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/gorm/user/impl"
	"github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/gorm/user_single"
	work_order "github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/gorm/work_order/impl"
	"github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/gorm/work_order_alarm"
	work_order_extend "github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/gorm/work_order_extend/impl"
	work_order_manage "github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/gorm/work_order_manage"
	"github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/gorm/work_order_single"
	work_order_task "github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/gorm/work_order_task"
	work_order_template "github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/gorm/work_order_template"
	doc_audit_rest_v1 "github.com/kweaver-ai/idrm-go-common/rest/doc_audit_rest/v1"
)

var RepositoryProviderSet = wire.NewSet(
	tcProject.NewProjectRepo,
	tcTask.NewTaskRepo,
	tcOss.NewOssRepo,
	tcMember.NewMemberRepo,
	tcFlowInfo.NewFlowInfoRepo,
	user.NewUserRepo,
	operationLog.NewOperationLogRepo,
	taskRelationData.NewRepo,
	data_comprehension_plan.NewComprehensionPlanRepo,
	data_aggregation_plan.NewAggregationPlanRepo,
	data_processing_plan.NewProcessinPlanRepo,
	data_processing_overview.NewProcessinOverviewRepo,
	work_order.NewWorkOderRepo,
	data_aggregation_inventory.New,
	data_aggregation_resource.New,
	doc_audit_rest_v1.NewForHTTPClient,
	wire.Bind(new(database.DatabaseInterface), new(*database.DatabaseClient)),
	database.NewForData,
	data_research_report.NewDataResearchReportRepo,
	tenant_application.NewTenantApplicationRepo,
	points.NewPointsRuleConfigRepo,
	points.NewPointsEventImplRepo,
	work_order_task.New,
	fusion_model.NewFusionModelRepo,
	work_order_extend.NewWorkOrderExtendRepo,
	data_quality_improvement.NewDataQualityImprovementRepo,
	quality_audit_model.NewRepo,
	dbSandbox.NewRepo,
	work_order_template.New,
	work_order_manage.New,
	configuration.NewRepo,
	notification.New,
	alarm_rule.New,
	work_order_alarm.New,
	work_order_single.New,
	user_single.New,
)
