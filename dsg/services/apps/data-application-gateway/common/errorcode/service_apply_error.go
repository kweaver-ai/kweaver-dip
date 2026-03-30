package errorcode

func init() {
	registerErrorCode(serviceApplyErrorMap)
}

const (
	serviceApplyModelName = "ServiceApply"
)

const (
	serviceApplyPreCoder = ServiceName + "." + serviceApplyModelName + "."

	ServiceApplyNotPass       = serviceApplyPreCoder + "ServiceApplyNotPass"
	ServiceApplyNotPassCssjj  = serviceApplyPreCoder + "ServiceApplyNotPassCssjj"
	ServiceStatusNotAvailable = serviceApplyPreCoder + "ServiceStatusNotAvailable"
)

var serviceApplyErrorMap = errorCode{
	ServiceApplyNotPass: {
		description: "当前接口暂无调用权限, 请先申请接口授权",
		cause:       "",
		solution:    "",
	},
	ServiceApplyNotPassCssjj: {
		description: "xx鉴权失败",
		cause:       "",
		solution:    "",
	},
	ServiceStatusNotAvailable: {
		description: "当前接口不可调用，请联系管理员",
		cause:       "",
		solution:    "",
	},
}
