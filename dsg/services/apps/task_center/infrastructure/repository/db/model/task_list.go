package model

import "time"

type TaskInfo struct {
	ID            string `gorm:"column:id" json:"id"`
	Name          string `gorm:"column:name" json:"name"`
	Description   string `gorm:"column:description" json:"description"`
	ProjectID     string `gorm:"column:project_id" json:"project_id"`
	ProjectName   string `gorm:"column:project_name" json:"project_name"`
	WorkOrderId   string `gorm:"column:work_order_id" json:"work_order_id"`
	WorkOrderName string `gorm:"column:work_order_name" json:"work_order_name"`
	ProjectStatus int8   `gorm:"column:project_status" json:"project_status"`
	StageID       string `gorm:"column:stage_id" json:"stage_id"`
	NodeID        string `gorm:"column:node_id" json:"node_id"`
	//RoleID           string    `gorm:"column:role_id" json:"role_id"`
	Status           int8      `gorm:"column:status" json:"status"`
	ConfigStatus     int8      `gorm:"column:config_status" json:"config_status"`
	ExecutableStatus int8      `gorm:"column:executable_status" json:"executable_status"`
	Priority         int8      `gorm:"column:priority" json:"priority"`
	ExecutorID       string    `gorm:"column:executor_id" json:"executor_id"`
	Deadline         int64     `gorm:"column:deadline" json:"deadline"`
	CompleteTime     int64     `gorm:"column:complete_time" json:"complete_time"`
	UpdatedByUID     string    `gorm:"column:updated_by_uid" json:"updated_by_uid"`
	UpdatedAt        time.Time `gorm:"column:updated_at;autoUpdateTime;not null;default:current_timestamp()" json:"updated_at"`
	FlowID           string    `gorm:"column:flow_id" json:"flow_id"`           // 流水线id
	FlowVersion      string    `gorm:"column:flow_version" json:"flow_version"` // 流水线版本

	OrgType             *int   `gorm:"column:org_type" json:"org_type"`                             //标准分类
	TaskType            int32  `gorm:"column:task_type" json:"task_type"`                           // 任务类型
	SubjectDomainId     string `gorm:"column:subject_domain_id" json:"subject_domain_id,omitempty"` // 主题域id
	BusinessModelID     string `gorm:"column:business_model_id" json:"business_model_id"`           // 业务域主干业务id
	ParentTaskId        string `gorm:"column:parent_task_id" json:"parent_task_id"`                 // 父任务的ID
	ModelChildTaskTypes string `gorm:"column:model_child_task_types" json:"model_child_task_types"` //业务模型&数据模型的子类型数组，每个模型最多5个子类型。业务模型子类型：1录入流程图、2录入节点表、3录入标准表、4录入指标表、5业务标准表标准化；数据模型子类型：6录入数据来源表、7录入数据标准表、8录入数据融合表、9录入数据统计指标、10数据标准表标准化
}

// TaskStatistics  新建标准任务的统计数量
type TaskStatistics struct {
	ParentTaskId     string `gorm:"column:parent_task_id" json:"parent_task_id"`         // 父任务的ID数量
	FinishTaskNumber int    `gorm:"column:finish_task_number" json:"finish_task_number"` // 完成任务的数量
	TotalTaskNumber  int    `gorm:"column:total_task_number" json:"total_task_number"`   // 总的任务的数量
}
