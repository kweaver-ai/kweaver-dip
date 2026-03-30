package errorcode

import (
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/constant"
)

func init() {
	registerErrorCode(auditProcessBindErrorMap)
}

const (
	auditProcessBindPreCoder = constant.ServiceName + ".AuditProcessBind."

	ProcDefKeyNotFound          = auditProcessBindPreCoder + "ProcDefKeyNotFound"
	AuditProcessBindExist       = auditProcessBindPreCoder + "AuditProcessBindExist"
	AuditProcessIdNotExist      = auditProcessBindPreCoder + "AuditProcessIdNotExist"
	AuditProcessNotExist        = auditProcessBindPreCoder + "AuditProcessNotExist"
	AuditingExist               = auditProcessBindPreCoder + "AuditingExist"
	AuditTypeNotAllowed         = auditProcessBindPreCoder + "AuditTypeNotAllowed"
	ProcDefKeyNotExist          = auditProcessBindPreCoder + "ProcDefKeyNotExist"
	WorkflowGETProcessError     = auditProcessBindPreCoder + "WorkflowGETProcessError"
	AuditTypeOrServiceTypeError = auditProcessBindPreCoder + "AuditTypeOrServiceTypeError"
)

var auditProcessBindErrorMap = errorCode{
	ProcDefKeyNotFound: {
		description: "审核流程定义key未找到",
		cause:       "",
		solution:    "请重新选择审核流程或稍后重试",
	},
	AuditProcessBindExist: {
		description: "审核流程绑定已存在",
		cause:       "",
		solution:    "请重新选择审核流程",
	},
	AuditProcessIdNotExist: {
		description: "审核流程绑定id不存在",
		cause:       "",
		solution:    "请重新选择审核流程",
	},
	AuditProcessNotExist: {
		description: "审核发起失败, 未找到匹配的审核流程",
		cause:       "",
		solution:    "请先绑定审核流程",
	},
	AuditingExist: {
		description: "当前有正在审核中的流程",
		cause:       "",
		solution:    "请稍后再试",
	},
	AuditTypeNotAllowed: {
		description: "不支持发起当前类型审核",
		cause:       "",
		solution:    "请重新选择审核类型",
	},
	ProcDefKeyNotExist: {
		description: "审核流程不存在",
		cause:       "",
		solution:    "请重新选择审核流程",
	},
	WorkflowGETProcessError: {
		description: "workflow获取工作流失败",
		cause:       "",
		solution:    "请重试",
	},
	AuditTypeOrServiceTypeError: {
		description: "当前业务下没有此审核类型",
		cause:       "",
		solution:    "请检查请求参数",
	},
}
