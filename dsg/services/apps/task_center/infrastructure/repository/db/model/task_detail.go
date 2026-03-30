package model

import (
	"time"
)

type TaskDetail struct {
	ID               string    `gorm:"column:id" json:"id"`
	Name             string    `gorm:"column:name" json:"name"`
	Description      string    `gorm:"column:description" json:"description"`
	ProjectID        string    `gorm:"column:project_id" json:"project_id"`
	ProjectName      string    `gorm:"column:project_name" json:"project_name"`
	WorkOrderId      string    `gorm:"column:work_order_id" json:"work_order_id"`
	WorkOrderName    string    `gorm:"column:work_order_name" json:"work_order_name"`
	Image            string    `gorm:"column:image" json:"image"`
	StageID          string    `gorm:"column:stage_id" json:"stage_id"`
	StageName        string    `gorm:"column:stage_name" json:"stage_name"`
	NodeID           string    `gorm:"column:node_id" json:"node_id"`
	NodeName         string    `gorm:"column:node_name" json:"node_name"`
	Status           int8      `gorm:"column:status" json:"status"`
	ConfigStatus     int8      `gorm:"column:config_status" json:"config_status"`
	ExecutableStatus int8      `gorm:"column:executable_status"  json:"executable_status"`
	Priority         int8      `gorm:"column:priority" json:"priority"`
	ExecutorID       string    `gorm:"column:executor_id" json:"executor_id"`
	Deadline         int64     `gorm:"column:deadline" json:"deadline"`
	CompleteTime     int64     `gorm:"column:complete_time" json:"complete_time"`
	CreatedByUID     string    `gorm:"column:created_by_uid" json:"created_by_uid"`
	CreatedAt        time.Time `gorm:"column:created_at" json:"created_at"`
	UpdatedByUID     string    `gorm:"column:updated_by_uid" json:"updated_by_uid"`
	UpdatedAt        time.Time `gorm:"column:updated_at;autoUpdateTime;not null;default:current_timestamp()" json:"updated_at"`
	ParentTaskId     string    `json:"parent_task_id" json:"parent_task_id"`
	OrgType          *int      `gorm:"column:org_type" json:"org_type"` //标准分类

	TaskType        int32  `json:"task_type"`                   // 任务类型
	SubjectDomainId string `json:"subject_domain_id,omitempty"` //业务域id
	//DomainName string `json:"domain_name,omitempty"` //业务域名字
	BusinessModelID     string `json:"business_model_id"`                                           // 业务域主干业务id
	ModelChildTaskTypes string `gorm:"column:model_child_task_types" json:"model_child_task_types"` //业务模型&数据模型的子类型数组，每个模型最多5个子类型。业务模型子类型：1录入流程图、2录入节点表、3录入标准表、4录入指标表、5业务标准表标准化；数据模型子类型：6录入数据来源表、7录入数据标准表、8录入数据融合表、9录入数据统计指标、10数据标准表标准化
}

type CountInfo struct {
	TotalProcessedTasks  int64 `gorm:"column:total_processed_tasks" json:"total_processed_tasks" example:"3"`    // 我执行的任务总数量，不受筛选条件影响
	TotalCreatedTasks    int64 `gorm:"column:total_created_tasks" json:"total_created_tasks" example:"2"`        // 我创建的任务总数量，不受筛选条件影响
	TotalBlockedTasks    int64 `gorm:"column:total_blocked_tasks" json:"total_blocked_tasks" example:"3"`        //未开启任务，不受筛选条件影响
	TotalExecutableTasks int64 `gorm:"column:total_executable_tasks" json:"total_executable_tasks"  example:"4"` //已开启任务，不受筛选条件影响
	TotalInvalidTasks    int64 `gorm:"column:total_invalid_tasks" json:"total_invalid_tasks"  example:"5"`       //已失效任务，不受筛选条件影响
	TotalCompletedTasks  int64 `gorm:"column:total_completed_tasks" json:"total_completed_tasks"  example:"6"`   //已完成任务，不受筛选条件影响
}
