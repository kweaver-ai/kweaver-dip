package workflow

import (
	"github.com/samber/lo"
)

const (
	AF_TASKS_DATA_AGGREGATION_INVENTORY         = "af-data-aggregation-inventory"          // 任务中心数据归集清单审核
	AF_TASKS_DATA_AGGREGATION_WORK_ORDER        = "af-data-aggregation-work-order"         // 任务中心数据归集工单审核
	AF_TASKS_DATA_STANDARDIZATION_WORK_ORDER    = "af-data-standardization-work-order"     // 任务中心数据标准化工单审核
	AF_TASKS_DATA_AGGREGATOPM_PLAN              = "af-task-center-data-aggregation-plan"   // 任务中心数据归集计划审核
	AF_TASKS_DATA_PROCESSING_PLAN               = "af-task-center-data-processing-plan"    // 任务中心数据处理计划审核
	AF_TASKS_DATA_COMPREHENSION_PLAN            = "af-task-center-data-comprehension-plan" // 任务中心数据理解计划审核
	AF_TASKS_DATA_COMPREHENSION_WORK_ORDER      = "af-data-comprehension-work-order"       // 任务中心数据理解工单审核
	AF_TASKS_DATA_RESEARCH_REPORT               = "af-task-center-data-search-report"      // 配置中心数据调研报告审核
	AF_TASKS_DATA_FUSION_WORK_ORDER             = "af-data-fusion-work-order"              // 任务中心数据融合工单审核
	AF_TASKS_DATA_QUALITY_WORK_ORDER            = "af-data-quality-work-order"             // 任务中心数据质量工单审核
	AF_TASKS_DATA_QUALITY_AUDIT_WORK_ORDER      = "af-data-quality-audit-work-order"       // 任务中心数据质量稽核工单审核
	AF_TASKS_DATA_PROCESSING_TENANT_APPLICATION = "af-data-processing-tenant-application"  // 数据处理租户申请审核
	AF_TASKS_DB_SANDBOX_APPLY                   = "af-db-sandbox-apply"                    // 数据沙箱申请审核

	AF_BG_PUBLISH_BUSINESS_DIAGNOSIS = "af-bg-publish-business-diagnosis" // 业务诊断发布审核

	AF_TASKS_RESEARCH_REPORT_WORK_ORDER      = "af-research-report-work-order"      // 任务中心调研工单任务
	AF_TASKS_DATA_CATALOG_WORK_ORDER         = "af-data-catalog-work-order"         // 任务中心资源编目工单任务
	AF_TASKS_FRONT_END_PROCESSORS_WORK_ORDER = "af-front-end-processors-work-order" // 任务中心前置机申请工单任务
)

// AuditTypeSlice 审核类型数组方便参数检查
var AuditTypeSlice = []string{
	AF_TASKS_DATA_AGGREGATION_INVENTORY,
	AF_TASKS_DATA_AGGREGATION_WORK_ORDER,
	AF_TASKS_DATA_STANDARDIZATION_WORK_ORDER,
	AF_TASKS_DATA_AGGREGATOPM_PLAN,
	AF_TASKS_DATA_PROCESSING_PLAN,
	AF_TASKS_DATA_COMPREHENSION_WORK_ORDER,
	AF_TASKS_DATA_COMPREHENSION_PLAN,
	AF_TASKS_DATA_RESEARCH_REPORT,
	AF_TASKS_DATA_FUSION_WORK_ORDER,
	AF_TASKS_DATA_QUALITY_WORK_ORDER,
	AF_TASKS_DATA_QUALITY_AUDIT_WORK_ORDER,
	AF_TASKS_DB_SANDBOX_APPLY,
}

var AuditTypeMap = lo.SliceToMap(AuditTypeSlice, func(t string) (string, any) {
	return t, 1
})
