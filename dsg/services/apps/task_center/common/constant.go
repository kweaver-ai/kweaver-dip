package common

// ServiceName Service Name
const ServiceName = "TaskCenter"

type TaskStatus int

const (
	TaskStatus_NotBegin        TaskStatus = 0 //未开始
	TaskStatus_InProgress      TaskStatus = 1 //进行中
	TaskStatus_Complete        TaskStatus = 2 //已完成
	TaskStatus_OverdueComplete TaskStatus = 3 //逾期完成
)

type TaskLevel int

const (
	TaskLevel_Low          TaskLevel = 0 //低
	TaskLevel_Normal       TaskLevel = 1 //普通
	TaskLevel_Emergency    TaskLevel = 2 //紧急
	TaskLevel_TopEmergency TaskLevel = 3 //非常紧急
)

type NodeStatus int

const (
	NodeStatus_NotBegin   NodeStatus = 0 //未开始
	NodeStatus_InProgress NodeStatus = 1 //进行中
	NodeStatus_Complete   NodeStatus = 2 //已完成
)
