package errorcode

import "github.com/kweaver-ai/dsg/services/apps/configuration-center/common/constant"

func init() {
	registerErrorCode(UserMap)
}

const (
	UserPreCoder = constant.ServiceName + "." + UserName + "."

	UserDataBaseError                     = UserPreCoder + "UserDataBaseError"
	UserIdNotExistError                   = UserPreCoder + "UserIdNotExistError"
	UIdNotExistError                      = UserPreCoder + "UIdNotExistError"
	AccessTypeNotSupport                  = UserPreCoder + "AccessTypeNotSupport"
	UserNotHavePermission                 = UserPreCoder + "UserNotHavePermission"
	DrivenUserManagementError             = UserPreCoder + "DrivenUserManagementError"
	DrivenUserManagementDepartIdNotExist  = UserPreCoder + "DrivenUserManagementDepartIdNotExist"
	DrivenGetUserDepartmentsError         = UserPreCoder + "DrivenGetUserDepartmentsError"
	AccessControlClientTokenMustHasUserId = UserPreCoder + "AccessControlClientTokenMustHasUserId"
	UserCreateMessageSendError            = UserPreCoder + "UserCreateMessageSendError"
	UserUpdateMessageSendError            = UserPreCoder + "UserUpdateMessageSendError"
	UserDeleteMessageSendError            = UserPreCoder + "UserDeleteMessageSendError"
)

var UserMap = errorCode{
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
	DrivenUserManagementError: {
		description: "id不存在或者用户管理服务异常",
		cause:       "",
		solution:    "请重试",
	},
	DrivenUserManagementDepartIdNotExist: {
		description: "部门id不存在",
		cause:       "",
		solution:    "请重试",
	},
	DrivenGetUserDepartmentsError: {
		description: "获取用户下的部门失败",
		cause:       "",
		solution:    "请重试",
	},
	AccessControlClientTokenMustHasUserId: {
		description: "客户端token的权限访问控制必须携带用户id",
		cause:       "",
		solution:    "请重试",
	},
	UserCreateMessageSendError: {
		description: "用户创建消息发送失败",
		cause:       "",
		solution:    "请重试",
	},
	UserUpdateMessageSendError: {
		description: "用户更新消息发送失败",
		cause:       "",
		solution:    "请重试",
	},
	UserDeleteMessageSendError: {
		description: "用户删除消息发送失败",
		cause:       "",
		solution:    "请重试",
	},
}
