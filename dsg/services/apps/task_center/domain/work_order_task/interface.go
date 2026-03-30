package work_order_task

import (
	"context"

	"github.com/kweaver-ai/idrm-go-frame/core/enum"

	task_center_v1 "github.com/kweaver-ai/idrm-go-common/api/task_center/v1"
	task_center_v1_frontend "github.com/kweaver-ai/idrm-go-common/api/task_center/v1/frontend"
)

type Domain interface {
	// 创建工单任务
	Create(ctx context.Context, task *task_center_v1.WorkOrderTask) error
	// 获取工单任务
	Get(ctx context.Context, id string) (*task_center_v1.WorkOrderTask, error)
	// 更新工单任务
	Update(ctx context.Context, task *task_center_v1.WorkOrderTask) error
	// 获取工单任务列表
	List(ctx context.Context, opts *task_center_v1.WorkOrderTaskListOptions) (*task_center_v1.WorkOrderTaskList, error)
	// 获取工单任务列表
	ListFrontend(ctx context.Context, opts *task_center_v1.WorkOrderTaskListOptions) (*task_center_v1_frontend.WorkOrderTaskList, error)
	// 批量创建工单任务
	BatchCreate(ctx context.Context, list *task_center_v1.WorkOrderTaskList) error
	// 批量更新工单任务
	BatchUpdate(ctx context.Context, list *task_center_v1.WorkOrderTaskList) error
	// 获取目录任务状态
	CatalogTaskStatus(ctx context.Context, req *CatalogTaskStatusReq) (*CatalogTaskStatusResp, error)
	// 获取目录任务详情
	CatalogTask(ctx context.Context, req *CatalogTaskReq) (*CatalogTaskResp, error)
	// 根据表明获取归集任务
	GetDataAggregationTask(ctx context.Context, req *DataAggregationTaskReq) (*DataAggregationTaskResp, error)
}

type CatalogTaskStatusReq struct {
	FormId    string `json:"form_id" form:"form_id"  binding:"omitempty,verifyUuidNotRequired"` // 表id
	FormName  string `json:"form_name" form:"form_name"  binding:"omitempty"`                   // 名称
	CatalogId string `json:"catalog_id" form:"catalog_id"  binding:"omitempty"`                 // 目录id
}

type CatalogTaskStatusResp struct {
	DataAggregationStatus   string `json:"data_aggregation_status"`   // 归集状态
	DataProcessingStatus    string `json:"data_processing_status"`    // 加工状态
	DataComprehensionStatus string `json:"data_comprehension_status"` // 理解状态
}

type CatalogTaskReq struct {
	FormId    string `json:"form_id" form:"form_id"  binding:"omitempty,verifyUuidNotRequired"` // 表id
	FormName  string `json:"form_name" form:"form_name"  binding:"omitempty"`                   // 名称
	CatalogId string `json:"catalog_id" form:"catalog_id"  binding:"omitempty"`                 // 目录id
}

type CatalogTaskResp struct {
	DataAggregation   *DataAggregation   `json:"data_aggregation"`   // 归集
	Processing        *Processing        `json:"processing"`         // 加工
	DataComprehension *DataComprehension `json:"data_comprehension"` // 理解
}

type DataAggregation struct {
	TotalCount                int64         `json:"total_count"`                  // 总任务数
	RunningCount              int64         `json:"running_count"`                // 进行中任务数
	CompletedCount            int64         `json:"completed_count"`              // 已完成任务数
	FailedCount               int64         `json:"failed_count"`                 // 异常任务数
	DataAggregationStatus     string        `json:"data_aggregation_status"`      // 归集任务状态
	DataAggregationSourceInfo []*SourceInfo `json:"data_aggregation_source_info"` // 归集任务来源表信息
}

type Processing struct {
	TotalCount          int64                `json:"total_count"`          // 总任务数
	DataStandardization *DataStandardization `json:"data_standardization"` // 标准检测任务
	DataQualityAudit    *DataQualityAudit    `json:"data_quality_audit"`   // 质量检测任务
	DataFusion          *DataFusion          `json:"data_fusion"`          // 数据融合任务
}

type DataStandardization struct {
	DataStandardizationStatus string `json:"data_standardization_status"` // 标准检测任务状态
	ReportUpdatedAt           int64  `json:"report_updated_at"`           // 标准检测报告更新时间
}

type DataQualityAudit struct {
	DataQualityAuditStatus string `json:"data_quality_audit_status"` // 质量检测任务状态
	ReportUpdatedAt        int64  `json:"report_updated_at"`         // 数据质量报告更新时间
}

type DataFusion struct {
	DataFusionStatus      string                  `json:"data_fusion_status"`       // 数据融合任务状态
	DataFusionSourceForm  []*DataFusionSourceForm `json:"data_fusion_source_form"`  // 融合任务来源表信息
	DataFusionSourceField []string                `json:"data_fusion_source_field"` // 融合任务来源字段信息
}

type DataFusionSourceForm struct {
	*SourceInfo
	DataAggregationStatus     string        `json:"data_aggregation_status"`      // 数据归集任务状态
	DataAggregationSourceInfo []*SourceInfo `json:"data_aggregation_source_info"` // 归集任务来源表信息
}
type SourceInfo struct {
	SourceFormID   string `json:"source_form_id"`   // 源表ID
	SourceFormName string `json:"source_form_name"` // 源表名称
	SourceType     string `json:"source_type"`      // 数据源来源
}

type DataComprehension struct {
	TotalCount                    int64  `json:"total_count"`                      // 数据理解任务数
	DataComprehensionStatus       string `json:"data_comprehension_status"`        // 数据理解任务状态
	DataComprehensionReportStatus int8   `json:"data_comprehension_report_status"` // 数据理解报告状态
	AuditAdvice                   string `json:"audit_advice"`                     //审核意见，仅驳回时有用
	ReportUpdatedAt               int64  `json:"report_updated_at"`                // 数据理解报告更新时间
}

type DataAggregationTaskReq struct {
	FormNames string `json:"form_names" form:"form_names"  binding:"required"` // 名称逗号分隔
}

type DataAggregationTaskResp struct {
	Entries []*DataAggregationTaskInfo `json:"entries"`
}
type DataAggregationTaskInfo struct {
	FormName    string `json:"form_name"`     // 表名称
	WorkOrderId string `json:"work_order_id"` // 工单id
	Status      string `json:"status"`        // 状态
	CreatedAt   int64  `json:"created_at"`    // 创建时间
	UpdatedAt   int64  `json:"updated_at"`    // 更新时间
	Count       int    `json:"count"`         // 归集数量
}

type SourceType enum.Object

var (
	Records    = enum.New[SourceType](1, "records")    //信息系统
	Analytical = enum.New[SourceType](2, "analytical") //数据仓库
	Sandbox    = enum.New[SourceType](3, "sandbox")    //数据沙箱
)
