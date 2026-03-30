package errorcode

import "github.com/kweaver-ai/dsg/services/apps/data-application-service/common/constant"

func init() {
	registerErrorCode(userErrorMap)
}

const (
	userModelName = "User"
)

const (
	UserPreCoder             = constant.ServiceName + "." + userModelName + "."
	UserDataBaseError        = UserPreCoder + "UserDataBaseError"
	UserIdNotExistError      = UserPreCoder + "UserIdNotExistError"
	UIdNotExistError         = UserPreCoder + "UIdNotExistError"
	UserMgmCallError         = UserPreCoder + "UserMgmCallError"
	AccessTypeNotSupport     = UserPreCoder + "AccessTypeNotSupport"
	UserNotHavePermission    = UserPreCoder + "UserNotHavePermission"
	GetAccessPermissionError = UserPreCoder + "GetAccessPermissionError"
)

var userErrorMap = errorCode{
	UserDataBaseError: {
		description: "数据库错误",
		cause:       "",
		solution:    "请重试",
	},
	UserIdNotExistError: {
		description: "用户不存在",
		cause:       "",
		solution:    "请重试",
	},
	UIdNotExistError: {
		description: "用户不存在",
		cause:       "",
		solution:    "请重试",
	},
	UserMgmCallError: {
		description: "用户管理获取用户失败",
		cause:       "",
		solution:    "请重试",
	},
	AccessTypeNotSupport: {
		description: "暂不支持的访问类型",
		cause:       "",
		solution:    "请重试",
	},
	UserNotHavePermission: {
		description: "暂无权限，您可联系系统管理员配置",
		cause:       "",
		solution:    "请重试",
	},
	GetAccessPermissionError: {
		description: "获取访问权限失败",
		cause:       "",
		solution:    "请重试",
	},
}
