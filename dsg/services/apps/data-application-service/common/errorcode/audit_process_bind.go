package errorcode

import "github.com/kweaver-ai/dsg/services/apps/data-application-service/common/constant"

func init() {
	registerErrorCode(auditProcessBindErrorMap)
}

const (
	auditProcessBindModelName = "AuditProcessBind"
)

// Demo error
const (
	auditProcessBindPreCoder = constant.ServiceName + "." + auditProcessBindModelName + "."

	AuditProcessBindExist  = auditProcessBindPreCoder + "AuditProcessBindExist"
	AuditProcessIdNotExist = auditProcessBindPreCoder + "AuditProcessIdNotExist"
)

var auditProcessBindErrorMap = errorCode{
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
}
