package errorcode

import "github.com/kweaver-ai/dsg/services/apps/configuration-center/common/constant"

func init() {
	registerErrorCode(auditPolicyErrorMap)
}

const (
	auditPolicPreCoder        = constant.ServiceName + ".AuditPolicy."
	AuditPolicyNameExist      = auditPolicPreCoder + "AuditPolicNameExist"
	AuditPolicyResourceOver   = auditPolicPreCoder + "AuditPolicyResourceOver"
	AuditPolicyNotFound       = auditPolicPreCoder + "AuditPolicyNotFound"
	AuditPolicyNoAuditProcess = auditPolicPreCoder + "AuditPolicyNoAuditProcess"
	AuditPolicyCantUnbind     = auditPolicPreCoder + "AuditPolicyCantUnbind"
	ResourceNotExist          = auditPolicPreCoder + "ResourceNotExist"
	ResourceHasBind           = auditPolicPreCoder + "ResourceHasBind"
)

var auditPolicyErrorMap = errorCode{
	AuditPolicyNameExist: {
		description: "此审核策略名称已存在，请重新输入",
		cause:       "",
		solution:    "请重新输入",
	},
	AuditPolicyResourceOver: {
		description: "本次选择的资源个数超过最大限制，请重新选择",
		cause:       "",
		solution:    "请删除不需要的资源",
	},
	AuditPolicyNotFound: {
		description: "审核策略不存在",
		cause:       "",
		solution:    "请重新选择",
	},
	AuditPolicyNoAuditProcess: {
		description: "无审核流程",
		cause:       "",
		solution:    "请先设置审核流程",
	},
	AuditPolicyCantUnbind: {
		description: "策略正在使用中，不能直接解绑",
		cause:       "",
		solution:    "请先停用策略",
	},
	ResourceNotExist: {
		description: "资源不存在",
		cause:       "",
		solution:    "请重新选择",
	},
	ResourceHasBind: {
		description: "资源已有其他审核策略绑定，不能重复添加",
		cause:       "",
		solution:    "请先解绑",
	},
}
