package data_research_report

import (
	"context"

	"github.com/google/uuid"
	"github.com/kweaver-ai/dsg/services/apps/task_center/infrastructure/repository/db/model"
)

var (
	ToDeclaration, Declarationed                               int = 1, 2
	Auditing, Undo, Reject, Pass, ChangeAuditing, ChangeReject int = 1, 2, 3, 4, 5, 6
	AuditType, ChangeAuditType                                 int = 1, 2
)

func DeclarationStatus2Str(status int) (s string) {
	switch status {
	case ToDeclaration:
		s = "to_declaration"
	case Declarationed:
		s = "declarationed"
	}
	return s
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
	case ChangeAuditing:
		s = "change_auditing"
	case ChangeReject:
		s = "change_reject"
	}
	return s
}

func AuditType2Str(status int) (s string) {
	switch status {
	case AuditType:
		s = "audit"
	case ChangeAuditType:
		s = "change_audit"
	}
	return s
}

type DataResearchReport interface {
	Create(ctx context.Context, req *DataResearchReportCreateParam, userId, userName string) (*IDResp, error)
	Update(ctx context.Context, req *DataResearchReportUpdateReq, id, userId, userName string) (*IDResp, error)
	CheckNameRepeat(ctx context.Context, req *DataResearchReportNameRepeatReq) error
	Delete(ctx context.Context, id string) error
	GetById(ctx context.Context, id string) (*DataResearchReportDetailResp, error)
	GetByWorkOrderId(ctx context.Context, id string) (*DataResearchReportDetailResp, error)
	GetList(ctx context.Context, req *ResearchReportQueryParam) (*DataResearchReportListResp, error)
	Cancel(ctx context.Context, id string) (err error)
	AuditList(ctx context.Context, query *AuditListGetReq) (*DataResearchReportAuditListResp, error)
}

// 调研报告详情
type DataResearchReportDetailResp struct {
	DataResearchReportObject
	ChangeAudit *model.DataResearchReportChangeAuditObject `json:"change_audit"`
}

// 列表
type ResearchReportQueryParam struct {
	Offset      uint64 `json:"offset" form:"offset,default=1" binding:"min=1"`                                                    // 页码
	Limit       uint64 `json:"limit" form:"limit,default=10" binding:"min=1,max=1000"`                                            // 每页大小
	Direction   string `json:"direction" form:"direction,default=desc" binding:"oneof=asc desc"`                                  // 排序方向
	Sort        string `form:"sort,default=created_at" binding:"omitempty,oneof=name created_at updated_at" default:"created_at"` // 排序类型, 按名称和时间，默认按照名称
	StartedAt   int64  `json:"started_at" form:"started_at" binding:"omitempty,gt=0"`                                             // 开始日期
	FinishedAt  int64  `json:"finished_at" form:"finished_at" binding:"omitempty,gt=0"`                                           // 结束日期
	Keyword     string `json:"keyword" form:"keyword" binding:"omitempty"`                                                        // 查询关键字(按名称)
	WorkOrderID string `json:"work_order_id" form:"work_order_id" binding:"omitempty,uuid"`                                       // 数据归集计划ID
}

type DataResearchReportCreateParam struct {
	Name               string `json:"name" form:"name" binding:"required,trimSpace,min=1,max=128"`                               // 名称
	WorkOrderID        string `json:"work_order_id" form:"work_order_id" binding:"required,uuid"`                                // 数据归集计划ID
	ResearchPurpose    string `json:"research_purpose" form:"research_purpose" binding:"required,trimSpace,min=1,max=300"`       // 调研目的
	ResearchObject     string `json:"research_object" form:"research_object" binding:"required,trimSpace,min=1,max=300"`         // 调研对象
	ResearchMethod     string `json:"research_method" form:"research_method" binding:"required,trimSpace,min=1,max=300"`         // 调研方法
	ResearchContent    string `json:"research_content" form:"research_content" binding:"required"`                               // 调研内容
	ResearchConclusion string `json:"research_conclusion" form:"research_conclusion" binding:"required,trimSpace,min=1,max=800"` // 调研结论
	Remark             string `json:"remark" form:"remark" binding:"trimSpace,max=800"`                                          // 申报意见
	NeedDeclaration    bool   `json:"need_declaration" binding:"omitempty"`                                                      // 是否提交, 不传默认为false
}

type IDResp struct {
	UUID string `json:"id"  example:"4a5a3cc0-0169-4d62-9442-62214d8fcd8d"` //UUID
}

func (d *DataResearchReportCreateParam) ToModel(userId string, uniqueID uint64) *model.DataResearchReport {
	return &model.DataResearchReport{
		DataResearchReportID: uniqueID,
		ID:                   uuid.NewString(),
		Name:                 d.Name,
		WorkOrderID:          d.WorkOrderID,
		ResearchPurpose:      d.ResearchPurpose,
		ResearchObject:       d.ResearchObject,
		ResearchMethod:       d.ResearchMethod,
		ResearchContent:      d.ResearchContent,
		ResearchConclusion:   d.ResearchConclusion,
		Remark:               &d.Remark,
		DeclarationStatus:    &ToDeclaration,
		CreatedByUID:         userId,
		UpdatedByUID:         userId,
	}
}

// 名称重复检查
type DataResearchReportNameRepeatReq struct {
	Id   string `json:"id" form:"id"  binding:"verifyUuidNotRequired"`
	Name string `json:"name" form:"name" binding:"verifyName"`
}

// 更新
type DataResearchReportUpdateReq struct {
	Name               string `json:"name" form:"name" binding:"required,trimSpace,min=1,max=128"`                               // 名称
	WorkOrderID        string `json:"work_order_id" form:"data_aggregation_plan_id" binding:"required,uuid"`                     // 数据归集计划ID
	ResearchPurpose    string `json:"research_purpose" form:"research_purpose" binding:"required,trimSpace,min=1,max=300"`       // 调研目的
	ResearchObject     string `json:"research_object" form:"research_object" binding:"required,trimSpace,min=1,max=300"`         // 调研对象
	ResearchMethod     string `json:"research_method" form:"research_method" binding:"required,trimSpace,min=1,max=300"`         // 调研方法
	ResearchContent    string `json:"research_content" form:"research_content" binding:"required"`                               // 调研内容
	ResearchConclusion string `json:"research_conclusion" form:"research_conclusion" binding:"required,trimSpace,min=1,max=800"` // 调研结论
	Remark             string `json:"remark" form:"remark" binding:"trimSpace,max=800"`                                          // 申报意见
	NeedDeclaration    bool   `json:"need_declaration" binding:"omitempty"`                                                      // 是否提交, 不传默认为false
}

func (d *DataResearchReportUpdateReq) ToModel(userId string, uniqueID uint64, ID string) *model.DataResearchReport {
	return &model.DataResearchReport{
		DataResearchReportID: uniqueID,
		ID:                   ID,
		Name:                 d.Name,
		WorkOrderID:          d.WorkOrderID,
		ResearchPurpose:      d.ResearchPurpose,
		ResearchObject:       d.ResearchObject,
		ResearchMethod:       d.ResearchMethod,
		ResearchContent:      d.ResearchContent,
		ResearchConclusion:   d.ResearchConclusion,
		Remark:               &d.Remark,
		DeclarationStatus:    &ToDeclaration,
		CreatedByUID:         userId,
		UpdatedByUID:         userId,
	}
}

type PageResult[T any] struct {
	Entries    []*T  `json:"entries"`     // 对象列表
	TotalCount int64 `json:"total_count"` // 当前筛选条件下的对象数量
}

type DataResearchReportListResp struct {
	PageResult[DataResearchReportObject]
}

type DataResearchReportObject struct {
	model.DataResearchReportObject
	AuditStatusDisplay       string `json:"audit_status"` // 审核状态显示
	DeclarationStatusDisplay string `json:"declaration_status"`
}

type AuditListGetReq struct {
	Target  string `form:"target" binding:"required,oneof=tasks historys"`      // 审核列表类型 tasks 待审核 historys 已审核
	Offset  int    `form:"offset,default=1" binding:"omitempty" default:"1"`    // 页码，默认1
	Limit   int    `form:"limit,default=10" binding:"omitempty" default:"10"`   // 每页size，默认10
	Keyword string `form:"keyword" binding:"omitempty,trimSpace,min=1,max=128"` // 关键字查询，字符无限制
}

type DataResearchReportAuditListResp struct {
	PageResult[DataResearchReportAuditItem]
}

type DataResearchReportAuditItem struct {
	ID            string `json:"id"`              // 报告id
	Name          string `json:"name"`            // 名称
	AuditType     string `json:"audit_type"`      // 审核类型
	ApplyUserName string `json:"apply_user_name"` // 申请人
	ApplyTime     string `json:"apply_time"`      // 申请时间
	ProcInstID    string `json:"proc_inst_id"`    // 审核实例ID
	TaskID        string `json:"task_id"`         // 审核任务ID
}

type Data struct {
	Id         string `json:"id"`
	Title      string `json:"title"`
	SubmitTime int64  `json:"submit_time"`
	AuditType  string `json:"audit_type"`
}

type BriefDataResearchReportPathModel struct {
	Id string `json:"id" form:"id" uri:"id" binding:"required,uuid" example:"2eaccf8e-c7f0-40f9-ab7a-317d3b0c3802"` // 任务id，uuid（36）
}
