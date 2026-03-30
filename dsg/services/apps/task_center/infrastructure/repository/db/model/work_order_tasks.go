package model

import "time"

const TableNameWorkOrderTasks = "work_order_tasks"

// WorkOrderTask mapped from table <work_order_tasks>
type WorkOrderTask struct {
	// ID，格式 UUID v7
	ID string `json:"id,omitempty"`
	// 创建时间
	CreatedAt time.Time `json:"created_at,omitempty"`
	// 更新时间
	UpdatedAt time.Time `json:"updated_at,omitempty"`
	// 名称
	Name string `json:"name,omitempty"`
	// 第三方平台的 ID
	ThirdPartyID string `json:"third_party_id,omitempty"`
	// 所属工单 ID
	WorkOrderID string `json:"work_order_id,omitempty"`
	// 状工单任务状态态
	Status WorkOrderTaskStatus `json:"status,omitempty"`
	// 任务处于当前状态的原因，比如失败原因
	Reason string `json:"reason,omitempty"`
	// 任务失败处理 URL
	Link string `json:"link,omitempty"`
	// 详情
	WorkOrderTaskTypedDetail `gorm:"-"`
}

func (WorkOrderTask) TableName() string { return TableNameWorkOrderTasks }

// WorkOrderTaskStatus 代表工单任务状态
type WorkOrderTaskStatus string

// WorkOrderTaskStatus 代表工单任务状态
const (
	// 进行中
	WorkOrderTaskRunning WorkOrderTaskStatus = "Running"
	// 已完成
	WorkOrderTaskCompleted WorkOrderTaskStatus = "Completed"
	// 异常
	WorkOrderTaskFailed WorkOrderTaskStatus = "Failed"
)

// 工单任务详情
type WorkOrderTaskTypedDetail struct {
	// 数据归集
	DataAggregation []WorkOrderDataAggregationDetail
	// 数据理解
	DataComprehension *WorkOrderDataComprehensionDetail
	// 数据融合
	DataFusion *WorkOrderDataFusionDetail
	// 数据质量
	DataQuality *WorkOrderDataQualityDetail
	// 数据质量稽核
	DataQualityAudit []*WorkOrderDataQualityAuditDetail
}
