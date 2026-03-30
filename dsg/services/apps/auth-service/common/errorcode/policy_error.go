package errorcode

func init() {
	registerErrorCode(policyErrorMap)
}

const (
	policyModelName = "Policy"
)

const (
	policyPreCoder = ServiceName + "." + policyModelName + "."

	ObjectIdNotExist    = policyPreCoder + "ObjectIdNotExist"
	SubjectIdNotExist   = policyPreCoder + "SubjectIdNotExist"
	OwnerIdError        = policyPreCoder + "OwnerIdError"
	EnforceError        = policyPreCoder + "EnforceError"
	SubjectInfoGetError = policyPreCoder + "SubjectInfoGetError"
	OwnerInfoGetError   = policyPreCoder + "OwnerInfoGetError"
	// 与 Owner 分属不同部门
	NotBelongToOwnerDepartment = policyPreCoder + "NotBelongToOwnerDepartment"
)

var policyErrorMap = errorCode{
	ObjectIdNotExist: {
		description: "object_id 不存在",
		cause:       "",
		solution:    "请重试",
	},
	SubjectIdNotExist: {
		description: "subject_id 不存在",
		cause:       "",
		solution:    "请重试",
	},
	OwnerIdError: {
		description: "资源 Owner 检查不匹配, 无操作权限",
		cause:       "",
		solution:    "请重试",
	},
	NotBelongToOwnerDepartment: {
		description: "不属于资源 Owner 所在部门，无操作权限",
		solution:    "请联系管理员",
	},
	EnforceError: {
		description: "策略验证错误",
		cause:       "",
		solution:    "请重试",
	},
	SubjectInfoGetError: {
		description: "获取 Subject 信息失败",
		cause:       "",
		solution:    "请重试",
	},
	OwnerInfoGetError: {
		description: "获取 Owner 信息失败",
		cause:       "",
		solution:    "请重试",
	},
}
