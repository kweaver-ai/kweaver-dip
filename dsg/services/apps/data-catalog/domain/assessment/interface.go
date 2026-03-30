package assessment

import (
	"context"
)

type Target struct {
	ID                uint64  `json:"id"`
	TargetName        string  `json:"target_name"`
	TargetType        uint8   `json:"target_type"`
	DepartmentID      string  `json:"department_id"`
	DepartmentName    string  `json:"department_name"` // 部门名称
	Description       string  `json:"description"`
	StartDate         string  `json:"start_date"`
	EndDate           string  `json:"end_date"`
	Status            uint8   `json:"status"`
	ResponsibleUID    string  `json:"responsible_uid,omitempty"`
	ResponsibleName   *string `json:"responsible_name"`
	EmployeeID        string  `json:"employee_id,omitempty,omitempty"`
	EmployeeName      *string `json:"employee_name,omitempty"`
	EvaluationContent *string `json:"evaluation_content,omitempty"`
	CreatedAt         string  `json:"created_at"`
	CreatedBy         string  `json:"created_by"`
	CreatedByName     string  `json:"created_by_name"` // 创建人姓名
	UpdatedAt         *string `json:"updated_at"`
	UpdatedBy         *string `json:"updated_by"`
	UpdatedByName     *string `json:"updated_by_name"` // 更新人姓名
}

type TargetCreateReq struct {
	TargetName     string `json:"target_name" binding:"required"`
	TargetType     uint8  `json:"target_type" binding:"required,oneof=1 2"`
	DepartmentID   string `json:"department_id" binding:"required"`
	Description    string `json:"description"`
	StartDate      string `json:"start_date" binding:"required"`
	EndDate        string `json:"end_date"`
	ResponsibleUID string `json:"responsible_uid"`
	EmployeeID     string `json:"employee_id"` // 可选，如果为空则使用责任人ID
}

// 运营考核目标创建请求（简化版，复用TargetCreateReq）
type OperationTargetCreateReq struct {
	TargetName     string `json:"target_name" binding:"required"`
	Description    string `json:"description"`
	StartDate      string `json:"start_date" binding:"required"`
	EndDate        string `json:"end_date"`
	ResponsibleUID string `json:"responsible_uid" binding:"required"`
	EmployeeID     string `json:"employee_id"`
}

// 运营考核目标更新请求（简化版，复用TargetUpdateReq）
type OperationTargetUpdateReq struct {
	TargetName     *string `json:"target_name"`
	DepartmentID   *string `json:"department_id"`
	Description    *string `json:"description"`
	StartDate      *string `json:"start_date"`
	EndDate        *string `json:"end_date"`
	Status         *uint8  `json:"status"`
	ResponsibleUID *string `json:"responsible_uid"`
	EmployeeID     *string `json:"employee_id"`
}

// 运营考核目标查询请求（简化版，复用TargetQuery）
type OperationTargetQuery struct {
	TargetName     *string `form:"target_name"`                                                                                             // 目标名称（模糊查询）
	DepartmentID   string  `form:"department_id"`                                                                                           // 责任部门ID
	Status         *uint8  `form:"status" binding:"omitempty,oneof=1 2 3"`                                                                  // 状态：1=未到期，2=待评价，3=已结束
	StartDate      *string `form:"start_date"`                                                                                              // 计划开始日期
	EndDate        *string `form:"end_date"`                                                                                                // 计划结束日期
	ResponsibleUID *string `form:"responsible_uid"`                                                                                         // 责任人
	EmployeeID     *string `form:"employee_id"`                                                                                             // 协助人ID
	Sort           string  `form:"sort,default=created_at" binding:"omitempty,oneof=target_name start_date end_date created_at updated_at"` // 排序字段
	Direction      string  `form:"direction,default=desc" binding:"omitempty,oneof=asc desc"`                                               // 排序方向：asc, desc
	Offset         int     `form:"offset,default=1" binding:"omitempty,min=1"`                                                              // 偏移量（从1开始）
	Limit          int     `form:"limit,default=20" binding:"omitempty,min=1,max=100"`                                                      // 每页数量
}

type TargetUpdateReq struct {
	TargetName     *string `json:"target_name"`
	TargetType     *uint8  `json:"target_type"`
	DepartmentID   *string `json:"department_id"`
	Description    *string `json:"description"`
	StartDate      *string `json:"start_date"`
	EndDate        *string `json:"end_date"`
	Status         *uint8  `json:"status"`
	ResponsibleUID *string `json:"responsible_uid"`
	EmployeeID     *string `json:"employee_id"`
}

type TargetQuery struct {
	TargetName                  *string `form:"target_name"`                                                                               // 目标名称（模糊查询）
	TargetType                  *uint8  `form:"type" binding:"omitempty,oneof=1 2"`                                                        // 目标类型：1=部门考核，2=运营考核
	DepartmentID                string  `form:"department_id"`                                                                             // 责任部门ID
	Status                      *uint8  `form:"status" binding:"omitempty,oneof=1 2 3"`                                                    // 状态：1=未到期，2=待评价，3=已结束
	StartDate                   *string `form:"start_date"`                                                                                // 计划开始日期
	EndDate                     *string `form:"end_date"`                                                                                  // 计划结束日期
	ResponsibleUID              *string `form:"responsible_uid"`                                                                           // 责任人
	EmployeeID                  *string `form:"employee_id"`                                                                               // 协助人ID
	IsOperator                  bool    `form:"is_operator"`                                                                               // 是否按操作人查询：true=按当前用户ID查询，false=按原逻辑
	FilterCurrentUserDepartment bool    `form:"-"`                                                                                         // 是否过滤当前用户部门（内部使用，不从URL参数绑定）
	Sort                        string  `form:"sort" binding:"omitempty,oneof=target_name start_date end_date created_at updated_at plan"` // 排序字段
	Direction                   string  `form:"direction,default=desc" binding:"omitempty,oneof=asc desc"`                                 // 排序方向：asc, desc
	Offset                      int     `form:"offset,default=1" binding:"omitempty,min=1"`                                                // 偏移量（从1开始）
	Limit                       int     `form:"limit,default=20" binding:"omitempty,min=1,max=100"`                                        // 每页数量
}

type PageResp[T any] struct {
	Total int64 `json:"total"`
	List  []T   `json:"entries"`
}

type TargetDomain interface {
	Create(ctx context.Context, req TargetCreateReq, userID string) (uint64, error)
	Update(ctx context.Context, id uint64, req TargetUpdateReq, userID string) error
	Delete(ctx context.Context, id uint64, userID string) error
	Get(ctx context.Context, id uint64) (*Target, error)
	GetTargetDetailWithPlans(ctx context.Context, id uint64, q TargetDetailQuery) (*TargetDetailWithPlans, error) // 新增：获取目标详情（包含考核计划）
	List(ctx context.Context, q TargetQuery) (*PageResp[Target], error)
	AutoUpdateStatusByDate(ctx context.Context) error
	CompleteTarget(ctx context.Context, id uint64, userID string) error
	GetEvaluationPage(ctx context.Context, id uint64, q EvaluationPageQuery) (*EvaluationPageResp, error) // 新增：获取评价页面数据
	SubmitEvaluation(ctx context.Context, id uint64, req EvaluationSubmitReq, userID string) error        // 新增：提交评价
	GetTargetOverview(ctx context.Context, id uint64) (*TargetOverview, error)
	GetDepartmentOverview(ctx context.Context, q DepartmentOverviewQuery) (*DepartmentOverviewResp, error)
}

// 运营考核目标领域接口
type OperationTargetDomain interface {
	Create(ctx context.Context, req OperationTargetCreateReq, userID string) (uint64, error)
	Update(ctx context.Context, id uint64, req OperationTargetUpdateReq, userID string) error
	Delete(ctx context.Context, id uint64, userID string) error
	Get(ctx context.Context, id uint64) (*Target, error)
	GetDetailWithPlans(ctx context.Context, id uint64, q OperationTargetDetailQuery) (*OperationTargetDetailWithPlans, error)
	List(ctx context.Context, q OperationTargetQuery) (*PageResp[Target], error)
	AutoUpdateStatusByDate(ctx context.Context) error
	CompleteTarget(ctx context.Context, id uint64, userID string) error
	GetOperationOverview(ctx context.Context, q OperationOverviewQuery) (*OperationOverviewResp, error) // 新增：获取运营考核概览
}
type Plan struct {
	ID             uint64  `json:"id"`
	TargetID       uint64  `json:"target_id"`
	PlanType       uint8   `json:"plan_type"`
	PlanName       string  `json:"plan_name"`
	PlanDesc       string  `json:"plan_desc"`
	ResponsibleUID *string `json:"responsible_uid,omitempty"`
	PlanQuantity   int     `json:"plan_quantity"`
	ActualQuantity *int    `json:"actual_quantity"`
	Status         uint8   `json:"status"`
	// 已删除冗余字段：reason, evaluation_content, content, priority
	RelatedDataCollectionPlanID *string        `json:"related_data_collection_plan_id,omitempty"` // 关联数据归集计划ID（逗号分隔）
	BusinessItems               []BusinessItem `json:"business_items,omitempty"`                  // 业务梳理事项配置（API层使用JSON数组）
	// 新增：业务梳理实际完成数量字段
	BusinessModelActualQuantity   *int `json:"business_model_actual_quantity,omitempty"`   // 实际构建业务模型数量
	BusinessProcessActualQuantity *int `json:"business_process_actual_quantity,omitempty"` // 实际梳理业务流程数量
	BusinessTableActualQuantity   *int `json:"business_table_actual_quantity,omitempty"`   // 实际设计业务表数量
	// 新增：运营考核相关字段
	DataCollectionQuantity           *int    `json:"data_collection_quantity,omitempty"`             // 计划归集资源数量（运营考核）
	DataProcessExploreQuantity       *int    `json:"data_process_explore_quantity,omitempty"`        // 计划探查表数量（运营考核）
	DataProcessFusionQuantity        *int    `json:"data_process_fusion_quantity,omitempty"`         // 计划融合表数量（运营考核）
	DataUnderstandingQuantity        *int    `json:"data_understanding_quantity,omitempty"`          // 计划理解数据资源目录数量（运营考核）
	DataProcessExploreActualQuantity *int    `json:"data_process_explore_actual_quantity,omitempty"` // 实际探查表数量（运营考核）
	DataProcessFusionActualQuantity  *int    `json:"data_process_fusion_actual_quantity,omitempty"`  // 实际融合表数量（运营考核）
	DataUnderstandingActualQuantity  *int    `json:"data_understanding_actual_quantity,omitempty"`   // 实际理解数据资源目录数量（运营考核）
	RelatedDataProcessPlanID         *string `json:"related_data_process_plan_id,omitempty"`         // 关联数据处理计划ID（运营考核）
	RelatedDataUnderstandingPlanID   *string `json:"related_data_understanding_plan_id,omitempty"`   // 关联数据理解计划ID（运营考核）
	// 新增：考核类型字段
	AssessmentType uint8 `json:"assessment_type"` // 考核类型：1=部门考核，2=运营考核
	// 新增：业务梳理计划数量字段（运营考核使用）
	BusinessModelQuantity   *int `json:"business_model_quantity,omitempty"`   // 计划构建业务模型数量
	BusinessProcessQuantity *int `json:"business_process_quantity,omitempty"` // 计划梳理业务流程数量
	BusinessTableQuantity   *int `json:"business_table_quantity,omitempty"`   // 计划设计业务表数量
	// 新增：数据获取实际数量字段（运营考核使用）
	DataCollectionActualQuantity *int    `json:"data_collection_actual_quantity,omitempty"` // 实际归集资源数量（运营考核）
	CreatedBy                    string  `json:"created_by"`
	UpdatedBy                    *string `json:"updated_by"`
	CreatedByName                string  `json:"created_by_name"`
	UpdatedByName                *string `json:"updated_by_name"`
	CreatedAt                    string  `json:"created_at"`
	UpdatedAt                    *string `json:"updated_at"`
}

type PlanCreateReq struct {
	TargetID       uint64 `json:"target_id" binding:"required"`
	AssessmentType uint8  `json:"assessment_type" binding:"required,oneof=1 2"` // 考核类型：1=部门考核，2=运营考核
	PlanType       uint8  `json:"plan_type" binding:"required"`                 // 计划类型
	PlanName       string `json:"plan_name" binding:"required"`
	PlanDesc       string `json:"plan_desc"`
	ResponsibleUID string `json:"responsible_uid" binding:"required"` // 责任人ID（必填）
	PlanQuantity   *int   `json:"plan_quantity,omitempty"`            // 计划数量（部门考核类型使用）
	ActualQuantity *int   `json:"actual_quantity,omitempty"`
	Status         *uint8 `json:"status,omitempty"`
	// 已删除冗余字段：reason, evaluation_content, content, priority
	RelatedDataCollectionPlanID *string        `json:"related_data_collection_plan_id,omitempty"` // 关联数据归集计划ID（逗号分隔）
	BusinessItems               []BusinessItem `json:"business_items,omitempty"`                  // 业务梳理事项配置（API层使用JSON数组）
	// 运营考核相关字段
	DataCollectionQuantity         *int    `json:"data_collection_quantity,omitempty"`           // 计划归集资源数量（运营考核）
	DataProcessExploreQuantity     *int    `json:"data_process_explore_quantity,omitempty"`      // 计划探查表数量（运营考核）
	DataProcessFusionQuantity      *int    `json:"data_process_fusion_quantity,omitempty"`       // 计划融合表数量（运营考核）
	DataUnderstandingQuantity      *int    `json:"data_understanding_quantity,omitempty"`        // 计划理解数据资源目录数量（运营考核）
	RelatedDataProcessPlanID       *string `json:"related_data_process_plan_id,omitempty"`       // 关联数据处理计划ID（运营考核）
	RelatedDataUnderstandingPlanID *string `json:"related_data_understanding_plan_id,omitempty"` // 关联数据理解计划ID（运营考核）
}

type PlanUpdateReq struct {
	AssessmentType *uint8  `json:"assessment_type"` // 考核类型：1=部门考核，2=运营考核
	PlanType       *uint8  `json:"plan_type"`
	PlanName       *string `json:"plan_name"`
	PlanDesc       *string `json:"plan_desc"`
	ResponsibleUID *string `json:"responsible_uid"`
	PlanQuantity   *int    `json:"plan_quantity"`
	ActualQuantity *int    `json:"actual_quantity"`
	Status         *uint8  `json:"status"`
	// 已删除冗余字段：reason, evaluation_content, content, priority
	RelatedDataCollectionPlanID *string         `json:"related_data_collection_plan_id,omitempty"`
	BusinessItems               *[]BusinessItem `json:"business_items,omitempty"`
	// 运营考核相关字段
	DataCollectionQuantity         *int    `json:"data_collection_quantity,omitempty"`           // 计划归集资源数量（运营考核）
	DataProcessExploreQuantity     *int    `json:"data_process_explore_quantity,omitempty"`      // 计划探查表数量（运营考核）
	DataProcessFusionQuantity      *int    `json:"data_process_fusion_quantity,omitempty"`       // 计划融合表数量（运营考核）
	DataUnderstandingQuantity      *int    `json:"data_understanding_quantity,omitempty"`        // 计划理解数据资源目录数量（运营考核）
	RelatedDataProcessPlanID       *uint64 `json:"related_data_process_plan_id,omitempty"`       // 关联数据处理计划ID（运营考核）
	RelatedDataUnderstandingPlanID *uint64 `json:"related_data_understanding_plan_id,omitempty"` // 关联数据理解计划ID（运营考核）
}

type PlanQuery struct {
	TargetID  *uint64 `form:"target_id"`                                                                                // 所属目标ID
	PlanType  *uint8  `form:"plan_type" binding:"omitempty,oneof=1 2 3 4"`                                              // 计划类型：1=数据获取，2=数据质量整改，3=数据资源编目，4=业务梳理
	Status    *uint8  `form:"status" binding:"omitempty,oneof=0 1 2"`                                                   // 状态：0=未填，1=已填，2=异常
	Sort      string  `form:"sort,default=created_at" binding:"omitempty,oneof=plan_name status created_at updated_at"` // 排序字段
	Direction string  `form:"direction,default=desc" binding:"omitempty,oneof=asc desc"`                                // 排序方向：asc, desc
	Offset    int     `form:"offset,default=0" binding:"omitempty,min=0"`                                               // 偏移量
	Limit     int     `form:"limit,default=20" binding:"omitempty,min=1,max=100"`                                       // 每页数量
}

type PlanDomain interface {
	Create(ctx context.Context, req PlanCreateReq, userID string) (uint64, error)
	Update(ctx context.Context, id uint64, req PlanUpdateReq, userID string) error
	Delete(ctx context.Context, id uint64, userID string) error
	ListPlansByTargetID(ctx context.Context, targetID uint64) ([]Plan, error) // 新增：根据目标ID查询计划列表
	// Get(ctx context.Context, id uint64) (*Plan, error)
	// List(ctx context.Context, q PlanQuery) (*PageResp[Plan], error)
}

// 新增：获取目标详情（包含考核计划）的查询参数
type TargetDetailQuery struct {
	PlanName *string `form:"plan_name"` // 计划名称（模糊查询）
}

// 新增：评价页面查询参数
type EvaluationPageQuery struct {
	PlanName *string `form:"plan_name"` // 计划名称（模糊查询）
}

// 新增：管理目标详情接口的复合响应结构
type TargetDetailWithPlans struct {
	ID                uint64                `json:"id"`
	TargetName        string                `json:"target_name"`
	TargetType        uint8                 `json:"target_type"`
	DepartmentID      string                `json:"department_id"`
	DepartmentName    string                `json:"department_name"` // 部门名称
	Description       string                `json:"description"`
	StartDate         string                `json:"start_date"`
	EndDate           string                `json:"end_date"`
	Status            uint8                 `json:"status"`
	ResponsibleUID    string                `json:"responsible_uid"`
	EmployeeID        string                `json:"employee_id"`
	EvaluationContent *string               `json:"evaluation_content,omitempty"` // 评价内容
	CreatedAt         string                `json:"created_at"`
	CreatedBy         string                `json:"created_by"`
	CreatedByName     string                `json:"created_by_name"` // 创建人姓名
	UpdatedAt         *string               `json:"updated_at"`
	UpdatedBy         *string               `json:"updated_by"`
	UpdatedByName     *string               `json:"updated_by_name"`            // 更新人姓名
	EvaluationPlans   []EvaluationPlanGroup `json:"evaluation_plans,omitempty"` // 考核计划分组
}

// 考核计划分组
type EvaluationPlanGroup struct {
	PlanType int           `json:"plan_type"` // 计划类型：1=数据获取，2=数据质量整改，3=数据资源编目，4=业务梳理
	Plans    PlanGroupData `json:"plans"`     // 计划数据
}

// 计划分组数据
type PlanGroupData struct {
	List       []PlanListItem `json:"list"`        // 计划列表
	TotalCount int            `json:"total_count"` // 总数
}

// 计划列表项（简化版，用于详情接口）
type PlanListItem struct {
	ID              uint64 `json:"id"`
	PlanName        string `json:"plan_name"`
	Description     string `json:"description"`
	Owner           string `json:"owner"`
	CollectionCount *int   `json:"collection_count,omitempty"`   // 数据获取/质量整改/编目/数据处理/数据理解数量
	Unit            string `json:"unit,omitempty"`               // 单位
	ModelCount      *int   `json:"model_target_count,omitempty"` // 业务梳理-构建业务模型数量
	FlowCount       *int   `json:"flow_target_count,omitempty"`  // 业务梳理-梳理业务流程数量
	TableCount      *int   `json:"table_target_count,omitempty"` // 业务梳理-设计业务表数量
	// 新增：实际完成数量字段
	ActualCollectionCount *int          `json:"actual_collection_count,omitempty"` // 实际完成数量（数据获取/质量整改/编目/数据处理/数据理解）
	ActualModelCount      *int          `json:"model_actual_count,omitempty"`      // 实际构建业务模型数量
	ActualFlowCount       *int          `json:"flow_actual_count,omitempty"`       // 实际梳理业务流程数量
	ActualTableCount      *int          `json:"table_actual_count,omitempty"`      // 实际设计业务表数量
	RelatedPlans          []RelatedPlan `json:"related_plans,omitempty"`           // 关联计划（数据获取类型）
	CreatedAt             string        `json:"created_at"`
	UpdatedAt             string        `json:"updated_at"`
	// 新增：运营考核专用字段
	AssessmentType             uint8 `json:"assessment_type"`                       // 考核类型：1=部门考核，2=运营考核
	DataProcessExploreQuantity *int  `json:"data_process_explore_target,omitempty"` // 数据处理-探查表数量
	DataProcessFusionQuantity  *int  `json:"data_process_fusion_target,omitempty"`  // 数据处理-融合表数量
	DataUnderstandingQuantity  *int  `json:"data_understanding_target,omitempty"`   // 数据理解-目标数量
	DataProcessExploreActual   *int  `json:"data_process_explore_actual,omitempty"` // 数据处理-实际探查数量
	DataProcessFusionActual    *int  `json:"data_process_fusion_actual,omitempty"`  // 数据处理-实际融合数量
	DataUnderstandingActual    *int  `json:"data_understanding_actual,omitempty"`   // 数据理解-实际理解数量
}

// 关联计划
type RelatedPlan struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

// 评价相关请求和响应结构
type EvaluationPageResp struct {
	Target          *Target               `json:"entries"`          // 目标基本信息
	EvaluationPlans []EvaluationPlanGroup `json:"evaluation_plans"` // 考核计划列表
}

// 重新设计：按计划类型分组的评价提交请求
type EvaluationSubmitReq struct {
	EvaluationContent string                       `json:"evaluation_content"` // 整体评价内容
	DataCollection    []DataCollectionEvaluation   `json:"data_collection"`    // 数据获取类型评价
	QualityImprove    []QualityImproveEvaluation   `json:"quality_improve"`    // 数据质量整改类型评价
	ResourceCatalog   []ResourceCatalogEvaluation  `json:"resource_catalog"`   // 数据资源编目类型评价
	BusinessAnalysis  []BusinessAnalysisEvaluation `json:"business_analysis"`  // 业务梳理类型评价
	// 新增：运维考核类型评价
	OperationDataCollection    []OperationDataCollectionEvaluation    `json:"operation_data_collection"`    // 运维考核-数据获取类型评价
	OperationDataProcess       []OperationDataProcessEvaluation       `json:"operation_data_process"`       // 运维考核-数据处理类型评价
	OperationDataUnderstanding []OperationDataUnderstandingEvaluation `json:"operation_data_understanding"` // 运维考核-数据理解类型评价
}

// 数据获取类型评价
type DataCollectionEvaluation struct {
	ID             uint64 `json:"id"`              // 计划ID
	ActualQuantity int    `json:"actual_quantity"` // 已归集资源数量
}

// 数据质量整改类型评价
type QualityImproveEvaluation struct {
	ID             uint64 `json:"id"`              // 计划ID
	ActualQuantity int    `json:"actual_quantity"` // 已整改表数量
}

// 数据资源编目类型评价
type ResourceCatalogEvaluation struct {
	ID             uint64 `json:"id"`              // 计划ID
	ActualQuantity int    `json:"actual_quantity"` // 已编目数量
}

// 业务梳理类型评价
type BusinessAnalysisEvaluation struct {
	ID               uint64 `json:"id"`                 // 计划ID
	ModelActualCount int    `json:"model_actual_count"` // 已构建业务模型数量
	FlowActualCount  int    `json:"flow_actual_count"`  // 已梳理业务流程数量
	TableActualCount int    `json:"table_actual_count"` // 已设计业务表数量
}

// 新增：运维考核-数据获取类型评价
type OperationDataCollectionEvaluation struct {
	ID             uint64 `json:"id"`              // 计划ID
	ActualQuantity int    `json:"actual_quantity"` // 已归集资源数量
}

// 新增：运维考核-数据处理类型评价
type OperationDataProcessEvaluation struct {
	ID                       uint64 `json:"id"`                          // 计划ID
	DataProcessExploreActual int    `json:"data_process_explore_actual"` // 已探查表数据量
	DataProcessFusionActual  int    `json:"data_process_fusion_actual"`  // 已融合表数量
}

// 新增：运维考核-数据理解类型评价
type OperationDataUnderstandingEvaluation struct {
	ID                      uint64 `json:"id"`                        // 计划ID
	DataUnderstandingActual int    `json:"data_understanding_actual"` // 已理解数据资源目标数量
}

// 保留原有结构用于向后兼容（可选）
type EvaluationPlanSubmitReq struct {
	ID               uint64 `json:"id"`                 // 计划ID（必填）
	PlanType         uint8  `json:"plan_type"`          // 计划类型（必填）
	ActualQuantity   *int   `json:"actual_quantity"`    // 实际完成数量（类型1,2,3使用）
	ModelActualCount *int   `json:"model_actual_count"` // 实际构建业务模型数量（类型4使用）
	FlowActualCount  *int   `json:"flow_actual_count"`  // 实际梳理业务流程数量（类型4使用）
	TableActualCount *int   `json:"table_actual_count"` // 实际设计业务表数量（类型4使用）
}

// 新增：部门概览相关DTO
type DepartmentOverviewQuery struct {
	DepartmentID *string `form:"department_id"` // 部门ID（可选）
	TargetID     *uint64 `form:"target_id"`     // 目标ID（可选）
}

type DepartmentOverviewResp struct {
	Target     *TargetOverview     `json:"entries"`    // 目标基本信息
	Statistics *StatisticsOverview `json:"statistics"` // 统计数据概览
}

type EvaluationPlanItem struct {
	ID              uint64  `json:"id"`               // 计划ID
	PlanName        string  `json:"plan_name"`        // 计划名称
	PlanDesc        *string `json:"plan_desc"`        // 计划描述
	ResponsibleUID  *string `json:"responsible_uid"`  // 责任人ID
	ResponsibleName *string `json:"responsible_name"` // 责任人姓名
	Status          uint8   `json:"status"`           // 状态：0=未填，1=已填，2=异常

	// 部门考核相关字段
	CollectionCount            *int `json:"collection_count"`              // 计划归集资源数量（数据获取类型）
	ActualCollectionCount      *int `json:"actual_collection_count"`       // 已归集资源数量
	QualityImproveCount        *int `json:"quality_improve_count"`         // 计划整改表数量（数据质量整改类型）
	ActualQualityImproveCount  *int `json:"actual_quality_improve_count"`  // 已整改表数量
	ResourceCatalogCount       *int `json:"resource_catalog_count"`        // 计划编目数量（数据资源编目类型）
	ActualResourceCatalogCount *int `json:"actual_resource_catalog_count"` // 已编目数量
	BusinessModelCount         *int `json:"business_model_count"`          // 计划构建业务模型数量（业务梳理类型）
	BusinessProcessCount       *int `json:"business_process_count"`        // 计划梳理业务流程数量
	BusinessTableCount         *int `json:"business_table_count"`          // 计划设计业务表数量
	BusinessModelActualCount   *int `json:"business_model_actual_count"`   // 已构建业务模型数量
	BusinessProcessActualCount *int `json:"business_process_actual_count"` // 已梳理业务流程数量
	BusinessTableActualCount   *int `json:"business_table_actual_count"`   // 已设计业务表数量

	// 运营考核相关字段
	OperationDataCollectionCount           *int `json:"operation_data_collection_count"`             // 计划归集资源数量（运营考核-数据获取类型）
	OperationDataCollectionActualCount     *int `json:"operation_data_collection_actual_count"`      // 已归集资源数量
	OperationDataProcessExploreCount       *int `json:"operation_data_process_explore_count"`        // 计划探查表数量（运营考核-数据处理类型）
	OperationDataProcessFusionCount        *int `json:"operation_data_process_fusion_count"`         // 计划融合表数量
	OperationDataProcessExploreActualCount *int `json:"operation_data_process_explore_actual_count"` // 已探查表数量
	OperationDataProcessFusionActualCount  *int `json:"operation_data_process_fusion_actual_count"`  // 已融合表数量
	OperationDataUnderstandingCount        *int `json:"operation_data_understanding_count"`          // 计划理解数据资源目录数量（运营考核-数据理解类型）
	OperationDataUnderstandingActualCount  *int `json:"operation_data_understanding_actual_count"`   // 已理解数据资源目录数量
}

// 新增：目标概览信息（简化版，专门用于概览页面）
type TargetOverview struct {
	ID                uint64  `json:"id"`
	TargetName        string  `json:"target_name"`
	TargetType        uint8   `json:"target_type"`
	DepartmentID      string  `json:"department_id"`
	DepartmentName    string  `json:"department_name"`
	Description       string  `json:"description"`
	StartDate         string  `json:"start_date"`
	EndDate           string  `json:"end_date"`
	Status            uint8   `json:"status"`
	ResponsibleUID    string  `json:"responsible_uid,omitempty"`  // 责任人ID
	ResponsibleName   *string `json:"responsible_name,omitempty"` // 责任人姓名
	AssistantUID      string  `json:"assistant_uid,omitempty"`    // 协助成员ID
	AssistantName     *string `json:"assistant_name,omitempty"`   // 协助成员姓名
	EmployeeName      *string `json:"employee_name,omitempty"`    // 保留字段，兼容性
	CreatedAt         string  `json:"created_at"`
	CreatedBy         string  `json:"created_by"`
	CreatedByName     string  `json:"created_by_name"`
	UpdatedAt         string  `json:"updated_at"`
	UpdatedBy         string  `json:"updated_by"`
	UpdatedByName     string  `json:"updated_by_name"`
	EvaluationContent *string `json:"evaluation_content,omitempty"`
}

// 新增：统计数据概览
type StatisticsOverview struct {
	DataCollection   *DataCollectionStatistics   `json:"data_collection,omitempty"`   // 数据获取统计
	QualityImprove   *QualityImproveStatistics   `json:"quality_improve,omitempty"`   // 数据质量整改统计
	ResourceCatalog  *ResourceCatalogStatistics  `json:"resource_catalog,omitempty"`  // 数据资源编目统计
	BusinessAnalysis *BusinessAnalysisStatistics `json:"business_analysis,omitempty"` // 业务梳理统计
}

// 数据获取统计
type DataCollectionStatistics struct {
	PlanCount      int     `json:"plan_count"`      // 计划归集资源量
	ActualCount    int     `json:"actual_count"`    // 已归集量
	CompletionRate float64 `json:"completion_rate"` // 完成率
}

// 数据质量整改统计
type QualityImproveStatistics struct {
	PlanCount      int     `json:"plan_count"`      // 计划整改数量
	ActualCount    int     `json:"actual_count"`    // 已整改数量
	CompletionRate float64 `json:"completion_rate"` // 完成率
}

// 数据资源编目统计
type ResourceCatalogStatistics struct {
	PlanCount      int     `json:"plan_count"`      // 计划编目数量
	ActualCount    int     `json:"actual_count"`    // 已编目数量
	CompletionRate float64 `json:"completion_rate"` // 完成率
}

// 业务梳理统计
type BusinessAnalysisStatistics struct {
	ModelPlanCount      int     `json:"model_plan_count"`      // 计划构建业务模型数量
	ModelActualCount    int     `json:"model_actual_count"`    // 已构建数量
	ModelCompletionRate float64 `json:"model_completion_rate"` // 模型完成率
	FlowPlanCount       int     `json:"flow_plan_count"`       // 计划梳理业务流程数量
	FlowActualCount     int     `json:"flow_actual_count"`     // 已梳理数量
	FlowCompletionRate  float64 `json:"flow_completion_rate"`  // 流程完成率
	TablePlanCount      int     `json:"table_plan_count"`      // 计划设计业务表数量
	TableActualCount    int     `json:"table_actual_count"`    // 已设计数量
	TableCompletionRate float64 `json:"table_completion_rate"` // 表完成率
}

// 运营考核计划创建请求（新增）
type OperationPlanCreateReq struct {
	TargetID       uint64 `json:"target_id" binding:"required"`
	PlanType       uint8  `json:"plan_type" binding:"required,oneof=1 2 3 4 5 6"` // 1=数据获取，5=数据处理，6=数据理解
	PlanName       string `json:"plan_name" binding:"required"`
	PlanDesc       string `json:"plan_desc"`
	ResponsibleUID string `json:"responsible_uid" binding:"required"` // 责任人ID（必填）
	// plan_quantity
	PlanQuantity int `json:"plan_quantity,omitempty"` // 计划数量（可选）
	// related_data_collection_plan_id
	BusinessItems *[]BusinessItem `json:"business_items,omitempty"`
	// AssessmentType
	AssessmentType uint8 `json:"assessment_type" binding:"required,oneof=1 2"`

	// 数据获取类型字段
	DataCollectionQuantity      *int    `json:"data_collection_quantity,omitempty"`        // 计划归集资源数量
	RelatedDataCollectionPlanID *string `json:"related_data_collection_plan_id,omitempty"` // 关联数据归集计划ID（逗号分隔）
	// 数据处理类型字段
	DataProcessExploreQuantity *int    `json:"data_process_explore_quantity,omitempty"` // 计划探查表数量
	DataProcessFusionQuantity  *int    `json:"data_process_fusion_quantity,omitempty"`  // 计划融合表数量
	RelatedDataProcessPlanID   *string `json:"related_data_process_plan_id,omitempty"`  // 关联数据处理计划ID
	// 数据理解类型字段
	DataUnderstandingQuantity      *int    `json:"data_understanding_quantity,omitempty"`        // 计划理解数据资源目录数量
	RelatedDataUnderstandingPlanID *string `json:"related_data_understanding_plan_id,omitempty"` // 关联数据理解计划ID
}

// 运营考核计划更新请求（新增）
type OperationPlanUpdateReq struct {
	AssessmentType *uint8  `json:"assessment_type"` // 考核类型：1=部门考核，2=运营考核
	PlanType       *uint8  `json:"plan_type"`
	PlanName       *string `json:"plan_name"`
	PlanDesc       *string `json:"plan_desc"`
	ResponsibleUID *string `json:"responsible_uid"`
	// 部门考核相关字段
	PlanQuantity                *int            `json:"plan_quantity,omitempty"`
	BusinessItems               *[]BusinessItem `json:"business_items,omitempty"`
	RelatedDataCollectionPlanID *string         `json:"related_data_collection_plan_id,omitempty"`
	// 运营考核相关字段
	DataCollectionQuantity         *int    `json:"data_collection_quantity,omitempty"`
	DataProcessExploreQuantity     *int    `json:"data_process_explore_quantity,omitempty"`
	DataProcessFusionQuantity      *int    `json:"data_process_fusion_quantity,omitempty"`
	RelatedDataProcessPlanID       *string `json:"related_data_process_plan_id,omitempty"`
	DataUnderstandingQuantity      *int    `json:"data_understanding_quantity,omitempty"`
	RelatedDataUnderstandingPlanID *string `json:"related_data_understanding_plan_id,omitempty"`
}

// 运营考核计划查询请求（新增）
type OperationPlanQuery struct {
	TargetID  *uint64 `form:"target_id"`                                                                                // 所属目标ID
	PlanType  *uint8  `form:"plan_type" binding:"omitempty,oneof=1 5 6"`                                                // 计划类型：1=数据获取，5=数据处理，6=数据理解
	Status    *uint8  `form:"status" binding:"omitempty,oneof=0 1 2"`                                                   // 状态：0=未填，1=已填，2=异常
	Sort      string  `form:"sort,default=created_at" binding:"omitempty,oneof=plan_name status created_at updated_at"` // 排序字段
	Direction string  `form:"direction,default=desc" binding:"omitempty,oneof=asc desc"`                                // 排序方向：asc, desc
	Offset    int     `form:"offset,default=0" binding:"omitempty,min=0"`                                               // 偏移量
	Limit     int     `form:"limit,default=20" binding:"omitempty,min=1,max=100"`                                       // 每页数量
}

// 运营考核计划领域接口（新增）
type OperationPlanDomain interface {
	Create(ctx context.Context, req OperationPlanCreateReq, userID string) (uint64, error)
	Update(ctx context.Context, id uint64, req OperationPlanUpdateReq, userID string) error
	Delete(ctx context.Context, id uint64, userID string) error
	GetDetail(ctx context.Context, id uint64) (*OperationPlanDetail, error)   // 获取单个计划详情
	ListPlansByTargetID(ctx context.Context, targetID uint64) ([]Plan, error) // 根据目标ID查询运营考核计划列表
}

// 运营考核概览查询参数
type OperationOverviewQuery struct {
	ResponsibleUID *string `form:"responsible_uid"` // 责任人ID
	AssistantUID   *string `form:"employee_id"`     // 协助成员ID TargetID     *uint64 `form:"target_id"`     // 目标ID（可选）
	TargetID       *string `form:"target_id"`
}

// 运营考核概览响应
type OperationOverviewResp struct {
	Target     *TargetOverview      `json:"entries"`    // 目标基本信息
	Statistics *OperationStatistics `json:"statistics"` // 统计数据
}

// 运营考核统计数据
type OperationStatistics struct {
	DataCollection    *DataCollectionStatistics    `json:"data_collection,omitempty"`    // 数据归集统计
	DataUnderstanding *DataUnderstandingStatistics `json:"data_understanding,omitempty"` // 数据理解统计
	DataProcess       *DataProcessStatistics       `json:"data_process,omitempty"`       // 数据处理统计
}

// 数据理解统计
type DataUnderstandingStatistics struct {
	PlanCount      int     `json:"plan_count"`      // 计划理解数据资源目录数量
	ActualCount    int     `json:"actual_count"`    // 已理解数量
	CompletionRate float64 `json:"completion_rate"` // 完成率
}

// 数据处理统计
type DataProcessStatistics struct {
	ExplorePlanCount      int     `json:"explore_plan_count"`      // 计划探查表数量
	ExploreActualCount    int     `json:"explore_actual_count"`    // 已探查数量
	ExploreCompletionRate float64 `json:"explore_completion_rate"` // 探查完成率
	FusionPlanCount       int     `json:"fusion_plan_count"`       // 计划融合表数量
	FusionActualCount     int     `json:"fusion_actual_count"`     // 已融合数量
	FusionCompletionRate  float64 `json:"fusion_completion_rate"`  // 融合完成率
}

// 运营考核目标详情查询参数
type OperationTargetDetailQuery struct {
	PlanName *string `form:"plan_name"` // 计划名称（模糊查询）
}

// 运营考核目标详情响应（包含计划列表）
type OperationTargetDetailWithPlans struct {
	ID                uint64                `json:"id"`
	TargetName        string                `json:"target_name"`
	TargetType        uint8                 `json:"target_type"`
	DepartmentID      string                `json:"department_id"`
	DepartmentName    string                `json:"department_name"` // 部门名称
	Description       string                `json:"description"`
	StartDate         string                `json:"start_date"`
	EndDate           string                `json:"end_date"`
	Status            uint8                 `json:"status"`
	ResponsibleUID    string                `json:"responsible_uid"`
	ResponsibleName   *string               `json:"responsible_name,omitempty"` // 责任人姓名
	AssistantUID      string                `json:"assistant_uid,omitempty"`    // 协助成员ID
	AssistantName     *string               `json:"assistant_name,omitempty"`   // 协助成员姓名
	EmployeeID        string                `json:"employee_id"`
	EvaluationContent *string               `json:"evaluation_content,omitempty"` // 评价内容
	CreatedAt         string                `json:"created_at"`
	CreatedBy         string                `json:"created_by"`
	CreatedByName     string                `json:"created_by_name"` // 创建人姓名
	UpdatedAt         *string               `json:"updated_at"`
	UpdatedBy         *string               `json:"updated_by"`
	UpdatedByName     *string               `json:"updated_by_name"` // 更新人姓名
	Plans             []OperationPlanDetail `json:"plans,omitempty"` // 计划详情列表
}

// 业务梳理事项配置（与创建计划参数一致）
type BusinessItem struct {
	Type     string `json:"type" binding:"required"`     // 事项类型：model=构建业务模型, process=梳理业务流程, table=设计业务表
	Quantity int    `json:"quantity" binding:"required"` // 计划数量
}

// 运营考核计划详情（与创建计划参数完全一致）
type OperationPlanDetail struct {
	ID              uint64  `json:"id"`
	TargetID        uint64  `json:"target_id"`
	PlanType        uint8   `json:"plan_type"`
	AssessmentType  uint8   `json:"assessment_type"` // 考核类型：1=部门考核，2=运营考核
	PlanName        string  `json:"plan_name"`
	PlanDesc        string  `json:"plan_desc"`
	ResponsibleUID  string  `json:"responsible_uid"`
	ResponsibleName *string `json:"responsible_name,omitempty"`
	// 与创建计划参数一致的字段
	PlanQuantity   int  `json:"plan_quantity"`             // 计划数量
	ActualQuantity *int `json:"actual_quantity,omitempty"` // 实际数量（通用）
	// 数据获取类型字段（plan_type=1）
	DataCollectionQuantity       *int          `json:"data_collection_quantity,omitempty"`        // 计划归集资源数量
	DataCollectionActualQuantity *int          `json:"data_collection_actual_quantity,omitempty"` // 实际归集资源数量
	RelatedDataCollectionPlanID  *string       `json:"related_data_collection_plan_id,omitempty"` // 关联数据归集计划ID
	RelatedDataCollectionPlans   []RelatedPlan `json:"related_data_collection_plans,omitempty"`   // 关联数据归集计划详情（包含名称）
	// 数据处理类型字段（plan_type=5）
	DataProcessExploreQuantity       *int    `json:"data_process_explore_quantity,omitempty"`        // 计划探查表数量
	DataProcessExploreActualQuantity *int    `json:"data_process_explore_actual_quantity,omitempty"` // 实际探查表数量
	DataProcessFusionQuantity        *int    `json:"data_process_fusion_quantity,omitempty"`         // 计划融合表数量
	DataProcessFusionActualQuantity  *int    `json:"data_process_fusion_actual_quantity,omitempty"`  // 实际融合表数量
	RelatedDataProcessPlanID         *string `json:"related_data_process_plan_id,omitempty"`         // 关联数据处理计划ID
	// 数据理解类型字段（plan_type=6）
	DataUnderstandingQuantity       *int    `json:"data_understanding_quantity,omitempty"`        // 计划理解数据资源目录数量
	DataUnderstandingActualQuantity *int    `json:"data_understanding_actual_quantity,omitempty"` // 实际理解数据资源目录数量
	RelatedDataUnderstandingPlanID  *string `json:"related_data_understanding_plan_id,omitempty"` // 关联数据理解计划ID
	// 业务梳理类型字段（plan_type=4）
	BusinessItems []BusinessItem `json:"business_items,omitempty"` // 业务梳理事项配置
}

// 数据归集计划信息（用于返回给前端）
type DataAggregationPlanInfo struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

// 数据处理计划信息
type DataProcessPlanInfo struct {
	ID   string `json:"id"`   // 对象ID (UUID)
	Name string `json:"name"` // 计划名称
}

// 数据理解计划信息
type DataUnderstandingPlanInfo struct {
	ID   string `json:"id"`   // 对象ID (UUID)
	Name string `json:"name"` // 计划名称
}
