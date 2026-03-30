package common

const (
	AUDIT_ICON_BASE64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34" +
		"AAAA70lEQVR4nO2UIQ7CMBSG/xkEYAkGFIZhhwYLChQJCzi4APeAC4CAsCAw4IaEU8BFQGDGXzHTNKxrWrcv" +
		"WfMqmm/vvb5602NyATDmZx3Pw14IEsbOKASZKAXbCVApMcjB+wsszwwklILTjAsRB+YB0Gtxo0EYcZH4K4ifQL" +
		"cJ1KrcaKAtGLaBcs4SfVii+MVAQimwiVKw6ptlsHkwkFAK0h6IA6Jcfp0bDbR7kArWdwp8oGNbIEpkMgciYxmlw" +
		"CZKwYB1N8ngpntN0x6IA0HDwaClAmdPxY6PnckcLPhDMkqBTQpBJl4YJVcqRoxdcPgB18l6zJGtm7IAAAAASUVORK5CYII="
)

// ProcessDefiniton 流程定义信息
type ProcessDefiniton struct {
	TenantId   string `json:"tenantId"`   // 流程所属租户
	Category   string `json:"category"`   // 流程所属类型
	ProcDefKey string `json:"procDefKey"` // 审核流程key
}

// ActivityInfo 审批节点信息
type ActivityInfo struct {
	CreateTime    int64  `json:"createTime"`    // 流程开始时间
	FinishTime    int64  `json:"finishTime"`    // 流程完结时间
	Receiver      string `json:"receiver"`      // 审核员用户id
	ReceiverOrgId string `json:"receiverOrgId"` // 审核员用户名
	Sender        string `json:"sender"`        // 流程发起人用户id
	ProcInstId    string `json:"procInstId"`    // 流程实例id
	ActDefName    string `json:"actDefName"`    // 流程节点名称
	ActDefId      string `json:"actDefId"`      // 流程节点id
}

// ProcessResultFields 流程节点审核结果信息
type ProcessResultFields struct {
	AuditIdea   bool   `json:"auditIdea,string"` // 审核结果 true 通过 false 拒绝
	AuditMsg    string `json:"auditMsg"`         // 审批意见（超过200字超出部分会被截断替换为...）
	BizType     string `json:"bizType"`          // 业务类型
	ApplyID     string `json:"bizId"`            // 审核申请id
	FlowApplyID string `json:"applyId"`          // 审核流程ID
}

// AuditProcessMsg 审核进展消息
type AuditProcessMsg struct {
	ProcessDef        ProcessDefiniton `json:"processDefinition"`
	ProcInstId        string           `json:"procInstId"`
	CurrentActivity   *ActivityInfo    `json:"currentActivity"`
	NextActivity      []*ActivityInfo  `json:"nextActivity"`
	ProcessInputModel struct {
		WFProcInstId string              `json:"wf_procInstId"` // 审核实例ID
		WFCurComment string              `json:"wf_curComment"` // 完整审批意见
		Fields       ProcessResultFields `json:"fields"`
	} `json:"processInputModel"`
}

// AuditProcessDelMsg 审核流程删除消息
type AuditProcessDelMsg struct {
	ProcDefKeys []string `json:"proc_def_keys"` // 被删除的审核流程定义key集合
}

// AuditResult 流程审核最终结果
type AuditResult struct {
	ApplyID string `json:"apply_id"` // 审核申请id
	Result  string `json:"result"`   // 审核结果 "pass": 通过  "reject": 拒绝  "undone": 撤销
}

// AuditApplyProcessInfo
type AuditApplyProcessInfo struct {
	AuditType  string `json:"audit_type"`
	ApplyID    string `json:"apply_id"`
	UserID     string `json:"user_id"`
	UserName   string `json:"user_name"`
	ProcDefKey string `json:"proc_def_key"`
}

// AuditApplyAbstractInfo
type AuditApplyAbstractInfo struct {
	Icon string `json:"icon"`
	Text string `json:"text"`
}

// AuditApplyDataInfo
type AuditApplyDataInfo struct {
	ID            string `json:"id"`                     // 目录ID
	Code          string `json:"code"`                   // 目录编码
	Title         string `json:"title"`                  // 目录名称
	Version       string `json:"version"`                // 目录版本号，默认初始版本为0.0.0.1
	Submitter     string `json:"submitter"`              // 发起人
	SubmitTime    int64  `json:"submit_time"`            // 发起时间
	SubmitterName string `json:"submitter_name"`         // 发起人名称
	ApplyDays     int    `json:"apply_days,omitempty"`   // 申请天数
	ApplyReason   string `json:"apply_reason,omitempty"` // 申请理由
}

const (
	OWNER_AUDIT_STRATEGY_TAG = "af_data_owner_audit" // 数据owner审核
)

// Webhook
type Webhook struct {
	Webhook     string `json:"webhook"`
	StrategyTag string `json:"strategy_tag"`
}

// AuditApplyWorkflowInfo
type AuditApplyWorkflowInfo struct {
	TopCsf       int                    `json:"top_csf"`
	AbstractInfo AuditApplyAbstractInfo `json:"abstract_info"`
	Webhooks     []Webhook              `json:"webhooks"`
}

// AuditApplyMsg 发起流程消息
type AuditApplyMsg struct {
	Process  AuditApplyProcessInfo  `json:"process"`
	Data     AuditApplyDataInfo     `json:"data"`
	Workflow AuditApplyWorkflowInfo `json:"workflow"`
}

// AuditCancelMsg 撤销流程消息
type AuditCancelMsg struct {
	ApplyIDs []string `json:"apply_ids"` // 申请ID数组
	Cause    struct {
		ZHCN string `json:"zh-cn"` // 中文
		ZHTW string `json:"zh-tw"` // 繁体
		ENUS string `json:"en-us"` // 英文
	} `json:"cause"` // 撤销原因
}
