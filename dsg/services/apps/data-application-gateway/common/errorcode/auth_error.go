package errorcode

func init() {
	registerErrorCode(authErrorMap)
}

const (
	authModelName = "Auth"
)

const (
	authPreCoder              = ServiceName + "." + authModelName + "."
	TokenAuditFailed          = authPreCoder + "TokenAuditFailed"
	UserNotActive             = authPreCoder + "UserNotActive"
	GetUserInfoFailed         = authPreCoder + "GetUserInfoFailed"
	GetUserInfoFailedInterior = authPreCoder + "GetUserInfoFailedInterior"
	GetTokenEmpty             = authPreCoder + "GetTokenEmpty"
)

var authErrorMap = errorCode{
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
}
