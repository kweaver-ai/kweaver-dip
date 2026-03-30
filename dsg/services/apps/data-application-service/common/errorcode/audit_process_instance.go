package errorcode

import "github.com/kweaver-ai/dsg/services/apps/data-application-service/common/constant"

func init() {
	registerErrorCode(auditProcessInstanceErrorMap)
}

const (
	auditProcessInstanceModelName = "AuditProcessInstance"
)

// Demo error
const (
	auditProcessInstancePreCoder = constant.ServiceName + "." + auditProcessInstanceModelName + "."

	AuditProcessNotExist = auditProcessInstancePreCoder + "AuditProcessNotExist"
	AuditingExist        = auditProcessInstancePreCoder + "AuditingExist"
	AuditTypeNotAllowed  = auditProcessInstancePreCoder + "AuditTypeNotAllowed"
	ProcDefKeyNotExist   = auditProcessInstancePreCoder + "ProcDefKeyNotExist"
	ServiceNotComplete   = auditProcessInstancePreCoder + "ServiceNotComplete"
)

var auditProcessInstanceErrorMap = errorCode{
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
	ServiceNotComplete: {
		description: "接口创建表单未填写完整",
		cause:       "",
		solution:    "请稍后再试",
	},
}
