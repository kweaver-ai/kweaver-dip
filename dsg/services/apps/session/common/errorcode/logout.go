package errorcode

import "github.com/kweaver-ai/dsg/services/apps/session/common/constant"

func init() {
	registerErrorCode(logoutErrorMap)
}

// Role error
const (
	logoutPreCoder = constant.ServiceName + "." + logoutModelName + "."

	GetCookieValueNotExist = logoutPreCoder + "GetCookieValueNotExist"
	GetTokenError          = logoutPreCoder + "GetTokenError"
	DoLogOutCallBackFailed = logoutPreCoder + "DoLogOutCallBackFailed"
)

var logoutErrorMap = errorCode{
	GetCookieValueNotExist: {
		description: "获取cookie值失败",
		cause:       "",
		solution:    "请重试",
	},
	GetTokenError: {
		description: "token获取失败",
		cause:       "",
		solution:    "请重试",
	},
	DoLogOutCallBackFailed: {
		description: "登出错误",
		cause:       "",
		solution:    "",
	},
}
