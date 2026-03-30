package assessment

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/assessment"
)

type AssessmentRepo interface {
	CreateTarget(ctx context.Context, req assessment.TargetCreateReq, userID string) (uint64, error)
	UpdateTarget(ctx context.Context, id uint64, req assessment.TargetUpdateReq, userID string) error
	DeleteTarget(ctx context.Context, id uint64, userID string) error
	GetTarget(ctx context.Context, id uint64) (*assessment.Target, error)
	ListTargets(ctx context.Context, q assessment.TargetQuery) (*assessment.PageResp[assessment.Target], error)
	UpdateTargetsStatusByDate(ctx context.Context, today string) error
	CompleteTarget(ctx context.Context, id uint64, userID string) error

	CreatePlan(ctx context.Context, req assessment.PlanCreateReq, userID string) (uint64, error)
	UpdatePlan(ctx context.Context, id uint64, req assessment.PlanUpdateReq, userID string) error
	DeletePlan(ctx context.Context, id uint64, userID string) error
	GetPlan(ctx context.Context, id uint64) (*assessment.Plan, error)
	ListPlans(ctx context.Context, q assessment.PlanQuery) (*assessment.PageResp[assessment.Plan], error)
	ListPlansByTargetID(ctx context.Context, targetID uint64) ([]assessment.Plan, error)                          // 新增：根据目标ID查询计划列表
	ListPlansByTargetIDAndName(ctx context.Context, targetID uint64, planName *string) ([]assessment.Plan, error) // 新增：根据目标ID和计划名称查询计划列表

	// 评价相关方法
	UpdatePlanEvaluation(ctx context.Context, planID uint64, actualQuantity *int, modelActualCount *int, flowActualCount *int, tableActualCount *int, userID string) error // 新增：更新计划评价数据
	UpdateTargetEvaluation(ctx context.Context, targetID uint64, evaluationContent string, userID string) error                                                            // 新增：更新目标评价内容

	// 新增：批量评价更新（支持事务）
	SubmitEvaluationWithTransaction(ctx context.Context, targetID uint64, req assessment.EvaluationSubmitReq, userID string) error

	// 新增：获取目标统计数据
	GetTargetStatistics(ctx context.Context, targetID uint64) (*assessment.StatisticsOverview, error)

	// 新增：部门概览相关方法
	GetFirstTargetByDepartment(ctx context.Context, departmentID string) (*assessment.Target, error)
	GetTargetByDepartmentAndName(ctx context.Context, departmentID, targetName string) (*assessment.Target, error)

	// 新增：获取已完成的目标（状态为3，按名称排序）
	GetFirstCompletedTarget(ctx context.Context) (*assessment.Target, error)
	GetCompletedTargetByName(ctx context.Context, targetName string) (*assessment.Target, error)

	// 新增：根据名称获取目标（不管状态）
	GetTargetByName(ctx context.Context, targetName string) (*assessment.Target, error)

	// 运营考核计划相关方法
	CreateOperationPlan(ctx context.Context, req assessment.OperationPlanCreateReq, userID string) (uint64, error)
	UpdateOperationPlan(ctx context.Context, id uint64, req assessment.OperationPlanUpdateReq, userID string) error
	DeleteOperationPlan(ctx context.Context, id uint64, userID string) error
	ListOperationPlansByTargetID(ctx context.Context, targetID uint64) ([]assessment.Plan, error)

	// 新增：获取运营考核目标（支持条件查询）
	GetOperationTargetByCondition(ctx context.Context, responsibleUID, assistantUID, targetID *string) (*assessment.Target, error)

	// 新增：根据部门ID和目标ID获取目标（支持可选参数）
	GetTargetByDepartmentAndTargetID(ctx context.Context, departmentID *string, targetID *uint64) (*assessment.Target, error)

	// 新增：获取运营考核计划详情列表
	GetOperationPlansByTargetID(ctx context.Context, targetID uint64, planName *string) ([]assessment.OperationPlanDetail, error)

	// 新增：获取单个计划详情
	GetOperationPlanDetail(ctx context.Context, id uint64) (*assessment.OperationPlanDetail, error)

	// 数据归集计划相关方法
	GetDataAggregationPlansByIDs(ctx context.Context, planIDs []string) (map[string]assessment.DataAggregationPlanInfo, error)
	GetDataAggregationPlanByID(ctx context.Context, planID string) (*assessment.DataAggregationPlanInfo, error)

	// 数据处理计划相关方法
	GetDataProcessPlansByIDs(ctx context.Context, planIDs []string) (map[string]assessment.DataProcessPlanInfo, error)

	// 数据理解计划相关方法
	GetDataUnderstandingPlansByIDs(ctx context.Context, planIDs []string) (map[string]assessment.DataUnderstandingPlanInfo, error)
}
