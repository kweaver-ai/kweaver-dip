package errorcode

import "github.com/kweaver-ai/dsg/services/apps/configuration-center/common/constant"

func init() {
	registerErrorCode(roleErrorMap)
}

// Role error
const (
	rolePreCoder = constant.ServiceName + "." + roleModelName + "."

	RoleNotExist               = rolePreCoder + "RoleNotExist"
	RoleIconNotExist           = rolePreCoder + "RoleIconNotExist"
	RoleNameRepeat             = rolePreCoder + "RoleNameRepeat"
	DefaultRoleCannotDeleted   = rolePreCoder + "DefaultRoleCannotDeleted"
	DiscardRoleCannotEdit      = rolePreCoder + "DiscardRoleCannotEdit"
	DefaultRoleCannotEdit      = rolePreCoder + "DefaultRoleCannotEdit"
	RoleDeleteError            = rolePreCoder + "RoleDeleteError"
	RoleDeleteMessageSendError = rolePreCoder + "RoleDeleteMessageSendError"

	UserNotExist                   = rolePreCoder + "UserNotExist"
	RoleDatabaseError              = rolePreCoder + "RoleDatabaseError"
	UserRoleInvalidParameter       = rolePreCoder + "UserRoleInvalidParameter"
	UserRoleInvalidParameterJson   = rolePreCoder + "UserRoleInvalidParameterJson"
	UserRoleDeleteError            = rolePreCoder + "UserRoleDeleteError"
	RoleHadDiscard                 = rolePreCoder + "RoleHadDiscard"
	UserRoleAlReadyDeleted         = rolePreCoder + "UserRoleAlReadyDeleted"
	AddRoleUserError               = rolePreCoder + "AddRoleUserError"
	UserRoleDeleteMessageSendError = rolePreCoder + "UserRoleDeleteMessageSendError"
	UserPermissionInvalidParameter = rolePreCoder + "UserPermissionInvalidParameter"
)

var roleErrorMap = errorCode{
	RoleNotExist: {
		description: "该角色不存在",
		cause:       "",
		solution:    "请重新选择角色",
	},
	RoleIconNotExist: {
		description: "角色图标不存在",
		cause:       "",
		solution:    "请重新选择角色图标",
	},
	AddRoleUserError: {
		description: "给角色添加用户失败",
		cause:       "",
		solution:    "请重试",
	},
	RoleNameRepeat: {
		description: "角色名称重复",
		cause:       "",
		solution:    "请更换新的角色名称",
	},
	UserNotExist: {
		description: "用户不存在",
		cause:       "",
		solution:    "请重新选择用户。",
	},
	RoleDatabaseError: {
		description: "数据库连接错误",
		cause:       "",
		solution:    "。",
	},
	UserRoleInvalidParameter: {
		description: "参数值校验不通过",
		cause:       "",
		solution:    "请使用请求参数构造规范化的请求字符串。详细信息参见产品 API 文档。",
	},
	UserPermissionInvalidParameter: {
		description: "参数值校验不通过",
		cause:       "",
		solution:    "请使用请求参数构造规范化的请求字符串。详细信息参见产品 API 文档。",
	},
	UserRoleInvalidParameterJson: {
		description: "参数值校验不通过：json格式错误",
		cause:       "",
		solution:    "请使用请求参数构造规范化的请求字符串。详细信息参见产品 API 文档。",
	},
	UserRoleDeleteError: {
		description: "用户角色删除失败",
		cause:       "",
		solution:    "请重试",
	},
	RoleHadDiscard: {
		description: "该角色已抛弃",
		cause:       "",
		solution:    "详细信息参见产品 API 文档。",
	},
	DefaultRoleCannotDeleted: {
		description: "内置角色不允许删除",
		cause:       "",
		solution:    "详细信息参见产品 API 文档。",
	},
	DiscardRoleCannotEdit: {
		description: "角色已废弃",
		cause:       "",
		solution:    "详细信息参见产品 API 文档。",
	},
	DefaultRoleCannotEdit: {
		description: "内置角色不允许修改",
		cause:       "",
		solution:    "详细信息参见产品 API 文档。",
	},
	RoleDeleteError: {
		description: "角色删除失败",
		cause:       "",
		solution:    "请重试",
	},
	RoleDeleteMessageSendError: {
		description: "角色删除消息发送失败",
		cause:       "",
		solution:    "请重试",
	},
	UserRoleDeleteMessageSendError: {
		description: "用户角色删除消息发送失败",
		cause:       "",
		solution:    "请重试",
	},
	UserRoleAlReadyDeleted: {
		description: "该角色中用户不存在",
		cause:       "",
		solution:    "请检查参数",
	},
}
