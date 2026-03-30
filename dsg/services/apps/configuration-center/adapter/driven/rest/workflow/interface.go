package workflow

import (
	"context"
	"time"
)

type WorkflowListType string

const (
	WORKFLOW_LIST_TYPE_APPLY   WorkflowListType = "applys"   // 我的申请
	WORKFLOW_LIST_TYPE_TASK    WorkflowListType = "tasks"    // 我的待办
	WORKFLOW_LIST_TYPE_HISTORY WorkflowListType = "historys" // 我处理的
)

type Workflow interface {
	ProcessDefinitionGet(ctx context.Context, procDefKey string) (res *ProcessDefinitionGetRes, err error)
	GetList(ctx context.Context, target WorkflowListType, auditTypes []string, offset, limit int) (*AuditResponse, error)
}

type ProcessDefinitionGetRes struct {
	Id             string      `json:"id"`
	Key            string      `json:"key"`
	Name           string      `json:"name"`
	Type           string      `json:"type"`
	TypeName       string      `json:"type_name"`
	CreateTime     time.Time   `json:"create_time"`
	CreateUserName string      `json:"create_user_name"`
	TenantId       string      `json:"tenant_id"`
	Description    interface{} `json:"description"`
	Effectivity    int         `json:"effectivity"`
}

type AuditResponse struct {
	Entries    []*AuditEntry `json:"entries"`     // 审核条目列表
	TotalCount int64         `json:"total_count"` // 总条目数
}

// AuditEntry 表示单个审核条目的详细信息
type AuditEntry struct {
	ID      string `json:"id"`       // 流程实例ID
	BizType string `json:"biz_type"` // 业务类型
	// DocID       *string     `json:"doc_id"`       // 文档ID，可为空
	// DocPath     *string     `json:"doc_path"`     // 文档路径，可为空
	// DocType     *string     `json:"doc_type"`     // 文档类型，可为空
	// DocLibType  *string     `json:"doc_lib_type"` // 文档库类型，可为空
	ProcInstID string `json:"proc_inst_id"` // 审核任务ID
	// Auditors    []*Auditor `json:"auditors"`     // 审核人列表
	ApplyTime     string      `json:"apply_time"`      // 申请时间
	ApplyUserName string      `json:"apply_user_name"` // 申请时间
	AuditStatus   string      `json:"audit_status"`    // 审核状态
	EndTime       string      `json:"end_time"`        // 审核时间
	DocNames      string      `json:"doc_names"`       // 文档名称
	ApplyDetail   ApplyDetail `json:"apply_detail"`    // 申请详情
	// Workflow    Workflow    `json:"workflow"`     // 工作流信息
	// Version *string `json:"version"` // 版本，可为空
}

type ApplyDetail struct {
	Process Process `json:"process"` // 流程信息
	Data    string  `json:"data"`    // 申请数据，JSON字符串
	// Workflow Workflow `json:"workflow"` // 工作流信息
}

// Process 表示流程信息
type Process struct {
	// ConflictApplyID string `json:"conflict_apply_id,omitempty"` // 冲突申请ID，可选
	UserID     string `json:"user_id"`      // 发起人用户ID
	UserName   string `json:"user_name"`    // 发起人用户名
	ApplyID    string `json:"apply_id"`     // 申请ID
	ProcDefKey string `json:"proc_def_key"` // 流程定义键
	AuditType  string `json:"audit_type"`   // 审核类型
}
