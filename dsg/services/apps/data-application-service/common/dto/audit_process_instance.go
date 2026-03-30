package dto

type AuditProcessInstanceCreateReq struct {
	ServiceID string `json:"service_id" binding:"required,VerifyNameEn"`                      // 接口ID
	AuditType string `json:"audit_type" binding:"required,oneof=af-data-application-publish"` // 审核类型 af-data-application-publish 发布审核
}

// AuditProcDefDelMsg 审核流程删除消息
type AuditProcDefDelMsg struct {
	ProcDefKeys []string `json:"proc_def_keys"` // 被删除的审核流程定义key集合
}

// AuditResultMsg 流程审核最终结果
type AuditResultMsg struct {
	ApplyID string `json:"apply_id"` // 审核申请id
	Result  string `json:"result"`   // 审核结果 "pass": 通过  "reject": 拒绝  "undone": 撤销
}

// AuditApplyMsg 发起流程消息
type AuditApplyMsg struct {
	Process  AuditApplyProcessInfo  `json:"process"`
	Data     AuditApplyDataInfo     `json:"data"`
	Workflow AuditApplyWorkflowInfo `json:"workflow"`
}

type AuditApplyProcessInfo struct {
	AuditType  string `json:"audit_type"`
	ApplyID    string `json:"apply_id"`
	UserID     string `json:"user_id"`
	UserName   string `json:"user_name"`
	ProcDefKey string `json:"proc_def_key"`
}

type AuditApplyDataInfo struct {
	ServiceID     string `json:"service_id"`     // 接口ID
	ServiceCode   string `json:"service_code"`   // 接口编码
	ServiceName   string `json:"service_name"`   // 接口名称
	SubmitterId   string `json:"submitter_id"`   // 发起人id
	SubmitterName string `json:"submitter_name"` // 发起人名称
	SubmitTime    string `json:"submit_time"`    // 发起时间
	ApplyReason   string `json:"apply_reason"`   // 申请理由
}

type AuditApplyWorkflowInfo struct {
	TopCsf       int                    `json:"top_csf"`
	AbstractInfo AuditApplyAbstractInfo `json:"abstract_info"`
	Webhooks     []Webhook              `json:"webhooks"`
}

type Webhook struct {
	Webhook     string `json:"webhook"`
	StrategyTag string `json:"strategy_tag"`
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

type AuditApplyAbstractInfo struct {
	Icon string `json:"icon"`
	Text string `json:"text"`
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

func (apm *AuditProcessMsg) GetAuditMsg() *string {
	if len(apm.ProcessInputModel.Fields.AuditMsg) > 0 {
		return &apm.ProcessInputModel.WFCurComment
	}
	return &apm.ProcessInputModel.Fields.AuditMsg
}

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
	AuditIdea bool   `json:"auditIdea,string"` // 审核结果 true 通过 false 拒绝
	AuditMsg  string `json:"auditMsg"`         // 审批意见（超过200字超出部分会被截断替换为...）
	BizType   string `json:"bizType"`          // 业务类型
	ApplyID   string `json:"bizId"`            // 审核申请id
}
