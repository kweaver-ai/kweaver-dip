package workflow

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"

	"github.com/kweaver-ai/dsg/services/apps/task_center/common/settings"
	"github.com/kweaver-ai/idrm-go-common/interception"
)

type WorkflowListType string

const (
	WORKFLOW_LIST_TYPE_APPLY   WorkflowListType = "applys"   // 我的申请
	WORKFLOW_LIST_TYPE_TASK    WorkflowListType = "tasks"    // 我的待办
	WORKFLOW_LIST_TYPE_HISTORY WorkflowListType = "historys" // 我处理的
)

type WorkflowInterface interface {
	GetAuditProcessDefinition(ctx context.Context, key string) ([]*AuditProcessDefinition, error)
	GetList(ctx context.Context, target WorkflowListType, auditTypes []string, offset, limit int, keyword string) (*AuditResponse, error)
}

type workflowRest struct {
	// API endpoint
	workflowRestBase string
	docAuditRestBase string

	// HTTP Client
	client *http.Client
}

func NewWorkflowRest(client *http.Client) WorkflowInterface {
	return &workflowRest{
		workflowRestBase: settings.ConfigInstance.DepServices.WorkflowRestHost,
		docAuditRestBase: settings.ConfigInstance.DepServices.DocAuditRestHost,
		client:           client,
	}
}

type AuditProcessDefinition struct {
	ID             string `json:"id"`
	Key            string `json:"key"`
	Name           string `json:"name"`
	Type           string `json:"type"`
	TypeName       string `json:"type_name"`
	CreateTime     string `json:"create_time"`
	CreateUserName string `json:"create_user_name"`
	TenantID       string `json:"tenant_id"`
}

func (w workflowRest) doRequest(req *http.Request) ([]byte, error) {
	resp, err := w.client.Do(req)
	if err != nil {
		return nil, err
	}

	defer resp.Body.Close()
	buf, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	if resp.StatusCode != http.StatusOK {
		// return nil, errors.Errorf("%v", util.BytesToString(buf))
		return nil, err
	}
	return buf, nil
}

func (w workflowRest) GetAuditProcessDefinition(ctx context.Context, key string) ([]*AuditProcessDefinition, error) {
	values := url.Values{
		"key": []string{key},
		// "tenant_id": []string{settings.GetConfig().DepServicesConf.WorkflowTenantID},
		"tenant_id": []string{"af_workflow"},
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodGet,
		fmt.Sprintf("%s/api/workflow-rest/v1/process-definition?%s", w.workflowRestBase, values.Encode()), http.NoBody)
	if err != nil {
		return nil, err
	}

	req.Header.Set("Authorization", ctx.Value(interception.Token).(string))
	buf, err := w.doRequest(req)
	if err != nil {
		return nil, err
	}

	var resp struct {
		Entries []*AuditProcessDefinition `json:"entries"`
	}
	if err = json.Unmarshal(buf, &resp); err != nil {
		return nil, err
	}
	return resp.Entries, nil
}

// AuditResponse 表示审核响应的顶层结构
type AuditResponse struct {
	Entries    []*AuditEntry `json:"entries"`     // 审核条目列表
	TotalCount int64         `json:"total_count"` // 总条目数
}

// AuditEntry 表示单个审核条目的详细信息
type AuditEntry struct {
	ID        string `json:"id"`         // 流程实例ID
	BizType   string `json:"biz_type"`   // 业务类型
	AuditType string `json:"audit_type"` // 审核类型
	// DocID       *string     `json:"doc_id"`       // 文档ID，可为空
	// DocPath     *string     `json:"doc_path"`     // 文档路径，可为空
	// DocType     *string     `json:"doc_type"`     // 文档类型，可为空
	// DocLibType  *string     `json:"doc_lib_type"` // 文档库类型，可为空
	ProcInstID string `json:"proc_inst_id"` // 审核任务ID
	// Auditors    []*Auditor `json:"auditors"`     // 审核人列表
	ApplyTime     string `json:"apply_time"`      // 申请时间
	ApplyUserName string `json:"apply_user_name"` // 申请人
	AuditStatus   string `json:"audit_status"`    // 审核状态
	TaskID        string `json:"task_id"`         // 任务id
	// DocNames    string      `json:"doc_names"`    // 文档名称
	ApplyDetail ApplyDetail `json:"apply_detail"` // 申请详情
	// Workflow    Workflow    `json:"workflow"`     // 工作流信息
	// Version *string `json:"version"` // 版本，可为空
}

// // Auditor 表示审核人信息
// type Auditor struct {
// 	ID        string  `json:"id"`         // 审核人ID
// 	Name      string  `json:"name"`       // 审核人姓名
// 	Account   *string `json:"account"`    // 审核人账号，可为空
// 	Status    string  `json:"status"`     // 审核状态
// 	AuditDate string  `json:"audit_date"` // 审核日期
// }

// ApplyDetail 表示申请详情
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

// // Workflow 表示工作流信息
// type Workflow struct {
// 	TopCSF          int             `json:"top_csf"`            // 顶级CSF值
// 	MsgForEmail     *string         `json:"msg_for_email"`      // 邮件消息，可为空
// 	MsgForLog       *string         `json:"msg_for_log"`        // 日志消息，可为空
// 	Content         *string         `json:"content"`            // 内容，可为空
// 	AbstractInfo    AbstractInfo    `json:"abstract_info"`      // 摘要信息
// 	FrontPluginInfo FrontPluginInfo `json:"front_plugin_info"`  // 前端插件信息
// 	Webhooks        []Webhook       `json:"webhooks,omitempty"` // Webhook列表，可选
// }

// // AbstractInfo 表示摘要信息
// type AbstractInfo struct {
// 	Icon string `json:"icon"` // 图标（Base64编码）
// 	Text string `json:"text"` // 文本描述
// }

// // FrontPluginInfo 表示前端插件信息
// type FrontPluginInfo struct {
// 	TenantID       string            `json:"tenant_id"`       // 租户ID
// 	Entry          string            `json:"entry"`           // 入口URL
// 	Name           string            `json:"name"`            // 插件名称
// 	CategoryBelong string            `json:"category_belong"` // 所属类别
// 	Label          map[string]string `json:"label"`           // 多语言标签
// 	AuditType      string            `json:"audit_type"`      // 审核类型
// }

// // Webhook 表示webhook信息
// type Webhook struct {
// 	Webhook     string `json:"webhook"`      // Webhook URL
// 	StrategyTag string `json:"strategy_tag"` // 策略标签
// }

func (w workflowRest) GetList(ctx context.Context, target WorkflowListType, auditTypes []string, offset, limit int, keyword string) (*AuditResponse, error) {
	values := url.Values{
		"type":      auditTypes,
		"offset":    []string{fmt.Sprint((offset - 1) * limit)},
		"limit":     []string{fmt.Sprint(limit)},
		"abstracts": []string{keyword},
	}

	a := fmt.Sprintf("%s/api/doc-audit-rest/v1/doc-audit/%s?%s", w.docAuditRestBase, target, values.Encode())

	req, err := http.NewRequestWithContext(ctx, http.MethodGet,
		a, http.NoBody)
	if err != nil {
		return nil, err
	}

	// req.Header.Set("Authorization", "Bearer "+ctx.Value(interception.Token).(string))

	req.Header.Set("Authorization", ctx.Value(interception.Token).(string))

	buf, err := w.doRequest(req)
	if err != nil {
		return nil, err
	}
	resp := AuditResponse{}
	if err = json.Unmarshal(buf, &resp); err != nil {
		return nil, err
	}

	return &resp, nil
}

func (a ApplyDetail) DecodeData() map[string]any {
	ds := make(map[string]any)
	json.Unmarshal([]byte(a.Data), &ds)
	return ds
}
