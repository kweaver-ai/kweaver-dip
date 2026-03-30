package errorcode

import "github.com/kweaver-ai/dsg/services/apps/configuration-center/common/constant"

func init() {
	registerErrorCode(loginErrorMap)
}

const (
	TokenAuditFailed          = constant.ServiceName + "." + "TokenAuditFailed"
	UserNotActive             = constant.ServiceName + "." + "UserNotActive"
	GetUserInfoFailed         = constant.ServiceName + "." + "GetUserInfoFailed"
	GetUserInfoFailedInterior = constant.ServiceName + "." + "GetUserInfoFailedInterior"
	GetTokenEmpty             = constant.ServiceName + "." + "GetTokenEmpty"
	NotAuthentication         = constant.ServiceName + "." + "NotAuthentication"
	HydraException            = constant.ServiceName + "." + "HydraException"
)

var loginErrorMap = errorCode{
	TokenAuditFailed: {
		description: "用户信息验证失败",
		cause:       "",
		solution:    "请重试",
	},
	UserNotActive: {
		description: "用户登录已过期",
		cause:       "",
		solution:    "请重新登陆",
	},
	GetUserInfoFailed: {
		description: "获取用户信息失败",
		cause:       "",
		solution:    "请重试",
	},
	GetUserInfoFailedInterior: {
		description: "获取用户信息失败",
		cause:       "",
		solution:    "请联系系统维护者",
	},
	GetTokenEmpty: {
		description: "获取用户信息失败",
		cause:       "",
		solution:    "请联系系统维护者",
	},
	NotAuthentication: {
		description: "无用户登录信息",
		cause:       "",
		solution:    "请联系系统维护者",
	},
	HydraException: {
		description: "授权服务异常",
		cause:       "",
		solution:    "请联系系统维护者",
	},
}
