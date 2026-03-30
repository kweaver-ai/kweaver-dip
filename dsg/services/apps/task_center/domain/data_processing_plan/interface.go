package data_processing_plan

import (
	"context"
	"database/sql"

	"github.com/google/uuid"
	"github.com/kweaver-ai/dsg/services/apps/task_center/infrastructure/repository/db/model"
)

type DataProcessingPlan interface {
	Delete(ctx context.Context, Id string) error
	Create(ctx context.Context, req *ProcessingPlanCreateReq, userId, userName string) (*IDResp, error)
	Update(ctx context.Context, req *ProcessingPlanUpdateReq, id, userId, userName string) (*IDResp, error)
	GetById(ctx context.Context, id string) (*ProcessingPlanGetByIdReq, error)
	List(ctx context.Context, query *ProcessingPlanQueryParam) (*ProcessingPlanListResp, error)
	CheckNameRepeat(ctx context.Context, req *ProcessingPlanNameRepeatReq) error
	Cancel(ctx context.Context, Id string) error
	AuditList(ctx context.Context, query *AuditListGetReq) (*ProcessingPlanAuditListResp, error)
	UpdateStatus(ctx context.Context, id string, req *ProcessingPlanUpdateStatusReq, userId string) (*IDResp, error)
}

var (
	NotStarted, OnGoing, Completed int = 1, 2, 3
	Auditing, Undo, Reject, Pass   int = 1, 2, 3, 4
)

func Status2Str(status int) (s string) {
	switch status {
	case NotStarted:
		s = "not_started"
	case OnGoing:
		s = "ongoing"
	case Completed:
		s = "finished"
	}
	return s
}

func Str2Status2(s string) (status int) {
	switch s {
	case "not_started":
		status = NotStarted
	case "ongoing":
		status = OnGoing
	case "finished":
		status = Completed
	}
	return status
}

func AuditStatus2Str(status int) (s string) {
	switch status {
	case Auditing:
		s = "auditing"
	case Undo:
		s = "undo"
	case Reject:
		s = "reject"
	case Pass:
		s = "pass"
	}
	return s
}

type Data struct {
	Id         string `json:"id"`
	Title      string `json:"title"`
	SubmitTime int64  `json:"submit_time"`
}

type IDResp struct {
	UUID string `json:"id"  example:"4a5a3cc0-0169-4d62-9442-62214d8fcd8d"` //UUID
}
type BriefProcessingPlanPathModel struct {
	Id string `json:"id" form:"id" uri:"id" binding:"required,uuid" example:"2eaccf8e-c7f0-40f9-ab7a-317d3b0c3802"` // 任务id，uuid（36）
}

// 新建
type ProcessingPlanCreateReq struct {
	Name            string `json:"name" form:"name" binding:"required,trimSpace,min=1,max=128"`               // 名称
	ResponsibleUID  string `json:"responsible_uid" binding:"required_if=NeedDeclaration true,omitempty,uuid"` // 责任人
	Priority        string `json:"priority" binding:"required_if=NeedDeclaration true,omitempty"`             // 优先级【1: 普通， 2：紧急， 3：非常紧急】
	StartedAt       int64  `json:"started_at" binding:"max=9999999999" example:"4102329600"`                  // 开始日期
	FinishedAt      int64  `json:"finished_at" binding:"verifyDeadline,max=9999999999" example:"4102329600"`  // 结束日期
	Content         string `json:"plan_info" binding:"omitempty"`                                             // 计划内容
	Opinion         string `json:"remark" binding:"omitempty,trimSpace,min=1,max=300"`                        // 申报意见
	NeedDeclaration bool   `json:"need_declaration" binding:"omitempty"`                                      // 是否提交, 不传默认为false
}

func (f *ProcessingPlanCreateReq) ToModel(userId string, uniqueID uint64) *model.DataProcessingPlan {
	plan := &model.DataProcessingPlan{
		DataProcessingPlanID: uniqueID,
		ID:                   uuid.NewString(),
		Name:                 f.Name,
		ResponsibleUID:       f.ResponsibleUID,
		Priority:             f.Priority,
		StartedAt:            sql.NullInt64{Int64: f.StartedAt, Valid: true},
		FinishedAt:           sql.NullInt64{Int64: f.FinishedAt, Valid: true},
		Content:              f.Content,
		Opinion:              &f.Opinion,
		// DeclarationStatus:    &ToDeclaration,
		Status:       &NotStarted,
		CreatedByUID: userId,
		UpdatedByUID: userId,
	}
	return plan
}

// 更新
type ProcessingPlanUpdateReq struct {
	Name            string `json:"name" form:"name" binding:"required,trimSpace,min=1,max=128"`               // 名称
	ResponsibleUID  string `json:"responsible_uid" binding:"required_if=NeedDeclaration true,omitempty,uuid"` // 责任人
	Priority        string `json:"priority" binding:"required_if=NeedDeclaration true,omitempty"`             // 优先级【1: 普通， 2：紧急， 3：非常紧急】
	StartedAt       int64  `json:"started_at" binding:"max=9999999999" example:"4102329600"`                  // 开始日期
	FinishedAt      int64  `json:"finished_at" binding:"verifyDeadline,max=9999999999" example:"4102329600"`  // 结束日期
	Content         string `json:"plan_info" binding:"omitempty"`                                             // 计划内容
	Opinion         string `json:"remark" binding:"omitempty,trimSpace,min=1,max=300"`                        // 申报意见
	NeedDeclaration bool   `json:"need_declaration" binding:"omitempty"`                                      // 是否提交, 不传默认为false
}

// 详情
type ProcessingPlanGetByIdReq struct {
	Name             string `json:"name"`              // 名称
	ResponsibleUID   string `json:"responsible_uid"`   // 责任人id
	ResponsibleUName string `json:"responsible_uname"` // 责任人名称
	PriorityId       string `json:"priority_id"`
	Priority         string `json:"priority"`    // 优先级 【普通：normal，紧急：urgent，非常紧急：hurry】
	Status           string `json:"status"`      // 状态
	StartedAt        int64  `json:"started_at"`  // 开始日期
	FinishedAt       int64  `json:"finished_at"` // 结束日期
	Content          string `json:"plan_info"`   // 计划内容
	Opinion          string `json:"remark"`      // 申报意见
	CreatedAt        int64  `json:"created_at"`  // 创建时间
	CreatedByUser    string `json:"created_by"`  // 创建用户ID
	UpdatedAt        int64  `json:"updated_at"`  // 更新时间
	UpdatedByUser    string `json:"updated_by"`  // 更新用户ID
}

// 列表
type ProcessingPlanQueryParam struct {
	Offset       uint64 `json:"offset" form:"offset,default=1" binding:"min=1"`                                         // 页码
	Limit        uint64 `json:"limit" form:"limit,default=10" binding:"min=1,max=1000"`                                 // 每页大小
	Direction    string `json:"direction" form:"direction,default=desc" binding:"oneof=asc desc"`                       // 排序方向
	Sort         string `form:"sort,default=created_at" binding:"omitempty,oneof=name created_at" default:"created_at"` // 排序类型, 按名称和时间，默认按照名称
	StartedAt    int64  `json:"started_at" form:"started_at" binding:"omitempty,gt=0"`                                  // 开始日期
	FinishedAt   int64  `json:"finished_at" form:"finished_at" binding:"omitempty,gt=0"`                                // 结束日期
	Priority     string `json:"priority" form:"priority" binding:"omitempty,gt=0"`                                      //  优先级传1,2,3【1: 普通， 2：紧急， 3：非常紧急】
	Keyword      string `json:"keyword" form:"keyword" binding:"omitempty"`                                             // 查询关键字(按名称)
	Audit_status string `form:"audit_status" binding:"omitempty,oneof=auditing undo reject pass"`                       // 审核状态
	Status       string `form:"status" binding:"omitempty,oneof=not_started ongoing finished"`                          // 计划状态（未开始、计划中、已完成）
}

type PageResult[T any] struct {
	Entries    []*T  `json:"entries" binding:"required"`                       // 对象列表
	TotalCount int64 `json:"total_count" binding:"required,gte=0" example:"3"` // 当前筛选条件下的对象数量
}

type ProcessingPlanListResp struct {
	PageResult[ProcessingPlanItem]
}

type ProcessingPlanItem struct {
	ID                string `json:"id"`                 // 计划id
	Name              string `json:"name"`               // 名称
	Content           string `json:"plan_info"`          // 计划内容
	ResponsiblePerson string `json:"responsible_person"` // 责任人
	AuditStatus       string `json:"audit_status"`       // 审核状态
	RejectReason      string `json:"reject_reason"`      // 驳回原因
	Status            string `json:"status"`             // 申报状态
	Priority          string `json:"priority"`           // 优先级
	StartedAt         int64  `json:"started_at"`         // 开始日期
	FinishedAt        int64  `json:"finished_at"`        // 结束日期
	CreatedAt         int64  `json:"created_at"`         // 创建时间

	AuditApplyID string `json:"audit_apply_id,omitempty"` // 审核申请ID
}

// 名称重复检查
type ProcessingPlanNameRepeatReq struct {
	Id   string `json:"id" form:"id"  binding:"verifyUuidNotRequired"`
	Name string `json:"name" form:"name" binding:"verifyName"`
}

// 数据归集计划待审核列表
type AuditListGetReq struct {
	Target  string `form:"target" binding:"required,oneof=tasks historys"`      // 审核列表类型 tasks 待审核 historys 已审核
	Offset  int    `form:"offset,default=1" binding:"omitempty" default:"1"`    // 页码，默认1
	Limit   int    `form:"limit,default=10" binding:"omitempty" default:"10"`   // 每页size，默认10
	Keyword string `form:"keyword" binding:"omitempty,trimSpace,min=1,max=128"` // 关键字查询，字符无限制
}

type ProcessingPlanAuditListResp struct {
	PageResult[ProcessingAuditPlanItem]
}

type ProcessingAuditPlanItem struct {
	ID            string `json:"id"`              // 计划id
	Name          string `json:"name"`            // 名称
	ApplyUserName string `json:"apply_user_name"` // 申请人
	ApplyTime     string `json:"apply_time"`      // 申请时间
	ProcInstID    string `json:"proc_inst_id"`    // 审核实例ID
	TaskID        string `json:"task_id"`         // 审核任务ID
}

type ProcessingPlanUpdateStatusReq struct {
	Status string `json:"status" form:"status"  binding:"omitempty,oneof=not_started ongoing finished"` // 工单状态
}
