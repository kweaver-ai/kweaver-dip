package mq

// 生产者 topic
const (
	TopicWorkflowAuditApply  = "workflow.audit.apply"  // 发起审核申请
	TopicWorkflowAuditCancel = "workflow.audit.cancel" // 发起审核撤销
)

// 消费者 topic
const (
	TopicWorkflowAuditResultPublish     = "workflow.audit.result.af-data-application-publish"      // 发布审核结果
	TopicWorkflowAuditResultRequest     = "workflow.audit.result.af-data-application-request"      // 申请审核结果
	TopicWorkflowAuditMsg               = "workflow.audit.msg"                                     // 审核进度消息
	TopicWorkflowAuditProcDeletePublish = "workflow.audit.proc.delete.af-data-application-publish" // 发布审核流程被删除
	TopicWorkflowAuditProcDeleteRequest = "workflow.audit.proc.delete.af-data-application-request" // 调用审核流程被删除
	TopicGraphEntityChange              = "af.business-grooming.entity_change"                     // 实体变更消息topic
)
