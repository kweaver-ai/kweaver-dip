package errorcode

const (
	UserDataBaseError        = userPreCoder + "UserDataBaseError"
	UserIdNotExistError      = userPreCoder + "UserIdNotExistError"
	UIdNotExistError         = userPreCoder + "UIdNotExistError"
	UserMgmCallError         = userPreCoder + "UserMgmCallError"
	AccessTypeNotSupport     = userPreCoder + "AccessTypeNotSupport"
	UserNotHavePermission    = userPreCoder + "UserNotHavePermission"
	GetAccessPermissionError = userPreCoder + "GetAccessPermissionError"
	AddUsersToRoleError      = userPreCoder + "AddUsersToRoleError"
	DeleteUsersToRoleError   = userPreCoder + "DeleteUsersToRoleError"
	GetProjectMgmRoleUsers   = userPreCoder + "GetRoleUsers"
	UserIsInProjectMgm       = userPreCoder + "UserIsInRole"
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
	AddUsersToRoleError: {
		description: "添加用户角色失败",
		cause:       "",
		solution:    "请重试",
	},
	DeleteUsersToRoleError: {
		description: "删除用户角色失败",
		cause:       "",
		solution:    "请重试",
	},
	GetProjectMgmRoleUsers: {
		description: "获取项目管理员角色下用户失败",
		cause:       "",
		solution:    "请重试",
	},
	UserIsInProjectMgm: {
		description: "获取该用户是否项目管理员角色",
		cause:       "",
		solution:    "请重试",
	},
}
