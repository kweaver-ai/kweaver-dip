package points_management

import (
	"context"
	"time"
)

// 积分事件code
const (
	// 目录反馈获取评分: catalog_rating
	CatalogRating string = "catalog_rating"
	// 目录反馈提交反馈: catalog_feedback
	CatalogFeedback string = "catalog_feedback"
	// 共享申请成效提交反馈: share_application_feedback
	ShareApplicationFeedback string = "share_application_feedback"
	// 数据归集任务完成: data_aggregation_complete
	DataAggregationComplete string = "data_aggregation_complete"
	// 数据归集任务发布: data_aggregation_release
	DataAggregationRelease string = "data_aggregation_release"
	// 供需申请提交目录: supply_and_demand_application_submission_directory
	SupplyAndDemandApplicationSubmisionDirectory string = "supply_and_demand_application_submission_directory"
	// 共享申请提供资源: share_application_submission_resource
	ShareApplicationSubmissionResource string = "share_application_submission_resource"
)

// 积分事件type
const (
	// 反馈型
	FeedbackType string = "feedback"
	// 任务型
	TaskType string = "task"
	// 需求型
	DemandType string = "demand"
)

// 业务模块
const (
	// 目录反馈
	CatalogModule string = "dir_feedback"
	// 共享申请成效反馈
	ShareApplicationModule string = "share_request_feedback"
	// 数据归集任务
	DataAggregationModule string = "data_connect_task"
	// 供需申请
	SupplyAndDemandModule string = "requirements_request"
	// 共享申请
	ShareModule string = "share_request"
)

// 积分条件
const (
	// 目录评分条件
	CatalogRatingCondition string = "获得目录评分"
	// 目录反馈条件
	CatalogFeedbackCondition string = "提交反馈"
	// 共享申请成效反馈条件
	ShareApplicationFeedbackCondition string = "提交反馈"
	// 数据归集任务完成条件
	DataAggregationCompleteCondition string = "完成任务"
	// 数据归集任务发布条件
	DataAggregationReleaseCondition string = "发布任务"
	// 供需申请提交目录条件
	SupplyAndDemandApplicationSubmisionDirectoryCondition string = "提供目录"
	// 共享申请提供资源条件
	ShareApplicationSubmissionResourceCondition string = "提供资源"
)

// 积分code和积分条件映射
var PointsCode2Condition = map[string]string{
	CatalogRating:                                CatalogRatingCondition,
	CatalogFeedback:                              CatalogFeedbackCondition,
	ShareApplicationFeedback:                     ShareApplicationFeedbackCondition,
	DataAggregationComplete:                      DataAggregationCompleteCondition,
	DataAggregationRelease:                       DataAggregationReleaseCondition,
	SupplyAndDemandApplicationSubmisionDirectory: SupplyAndDemandApplicationSubmisionDirectoryCondition,
	ShareApplicationSubmissionResource:           ShareApplicationSubmissionResourceCondition,
}

func PointsCode2Module(code string) (s string) {
	switch code {
	case CatalogRating, CatalogFeedback:
		s = CatalogModule
	case ShareApplicationFeedback:
		s = ShareApplicationModule
	case DataAggregationComplete, DataAggregationRelease:
		s = DataAggregationModule
	case SupplyAndDemandApplicationSubmisionDirectory:
		s = SupplyAndDemandModule
	case ShareApplicationSubmissionResource:
		s = ShareModule
	}
	return
}

type PointsManagement interface {
	Detail(ctx context.Context, code string) (*PointsRuleConfigResp, error)
	Create(ctx context.Context, req *PointsManagementCreateParam, userID string) (*PointsRuleConfigResp, error)
	Update(ctx context.Context, req *PointsManagementCreateParam, userID string) (*PointsRuleConfigResp, error)
	List(ctx context.Context) (*PointsRuleConfigList, error)
	Delete(ctx context.Context, code string) error
	// 积分事件列表
	PointsEventList(ctx context.Context, req *PointsEventListParam, userID string, limit *int) (*PointsEventList, error)
	// 导出积分事件列表
	ExportPointsEventList(ctx context.Context, req *PointsEventListParam) ([]byte, error)
	// 个人和部门积分汇总
	PersonalAndDepartmentPointsSummary(ctx context.Context, userID string) ([]PointsSummary, error)
	// 部门积分排名前五
	DepartmentPointsTop(ctx context.Context, year string) ([]DepartmentPointsRank, error)
	// 按积分策略分组统计
	PointsEventGroupByCode(ctx context.Context, year string) ([]DepartmentPointsRank, error)
	// 按积分策略和月份分组统计
	PointsEventGroupByCodeAndMonth(ctx context.Context, year string) (map[string]interface{}, error)
	// 创建积分事件
	PointsEventCreate(ctx context.Context, pointsEvent *PointsEventPub)
}

func PointsType2Str(code string) (s string) {
	switch {
	case code == CatalogRating || code == CatalogFeedback || code == ShareApplicationFeedback:
		s = FeedbackType
	case code == DataAggregationComplete || code == DataAggregationRelease:
		s = TaskType
	case code == SupplyAndDemandApplicationSubmisionDirectory || code == ShareApplicationSubmissionResource:
		s = DemandType
	}
	return
}

type PointsManagementCreateParam struct {
	Code     string  `json:"strategy_code" form:"strategy_code" binding:"required,oneof=catalog_rating catalog_feedback share_application_feedback data_aggregation_complete data_aggregation_release supply_and_demand_application_submission_directory share_application_submission_resource"` // 策略code
	RuleType string  // 策略类型
	Config   []int64 `json:"strategy_config" form:"strategy_config" binding:"required"` // 积分规则配置
	Period   []int64 `json:"strategy_period" form:"strategy_period" binding:"required"` // 积分规则配置有效期
}

type PointsRuleConfigResp struct {
	Code        string    `json:"strategy_code"`
	Config      []int64   `json:"strategy_config"`
	Period      []int64   `json:"strategy_period"`
	UpdatedByID string    `json:"updated_by_id"`
	UpdatedBy   string    `json:"updated_by"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type PointsRuleConfigList struct {
	Entries    []*PointsRuleConfigResp `json:"entries"`     // 对象列表
	TotalCount int64                   `json:"total_count"` // 当前筛选条件下的对象数量
}

type PointsCodePathParam struct {
	Code string `json:"strategy_code" uri:"strategy_code" binding:"required,oneof=catalog_rating catalog_feedback share_application_feedback data_aggregation_complete data_aggregation_release supply_and_demand_application_submission_directory share_application_submission_resource"` // 策略code
}

type PointsEventListParam struct {
	ID           string `form:"id" binding:"required,uuid"`                         // 用户ID或部门ID
	IsDepartment string `form:"is_department" binding:"omitempty,oneof=true false"` // 是否为部门积分查询
}

type PointsEventList struct {
	Entries    []*PointsEvent `json:"entries"`     // 对象列表
	TotalCount int64          `json:"total_count"` // 当前筛选条件下的对象数量
}

type PointsEvent struct {
	StrategyCode       string    `json:"strategy_code"`        // 策略code
	BusinessModule     string    `json:"business_module"`      // 所属业务模块
	StrategyObjectID   string    `json:"strategy_object_id"`   // 策略对象ID
	StrategyObjectName string    `json:"strategy_object_name"` // 策略对象名称
	Points             int64     `json:"points"`               // 积分变化
	CreatedAt          time.Time `json:"create_at"`            // 创建时间
}

type PointsSummary struct {
	ID    string `json:"id"`
	Name  string `json:"name"`
	Score int64  `json:"score"`
}

type DepartmentPointsRank struct {
	ID     string `json:"id"`     // 部门ID
	Name   string `json:"name"`   // 部门名称
	Points int64  `json:"points"` // 积分
}

type PointsEventDashBoardParam struct {
	Year string `form:"year" binding:"required"` // 年份，格式：2006
}

type PointsEventPub struct {
	Type             string `json:"type"`
	PointObject      string `json:"point_object"`
	Score            string `json:"score"`
	PointsObjectName string `json:"points_object_name"`
}
