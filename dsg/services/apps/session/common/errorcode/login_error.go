package errorcode

import "github.com/kweaver-ai/dsg/services/apps/session/common/constant"

func init() {
	registerErrorCode(loginErrorMap)
}

// Role error
const (
	loginPreCoder = constant.ServiceName + "." + LoginModelName + "."

	GetCodeFailed            = loginPreCoder + "GetCodeFailed"
	LoginCallbackFailed      = loginPreCoder + "LoginCallbackFailed"
	SaveSessionFailed        = loginPreCoder + "SaveSessionFailed"
	GetSessionFailed         = loginPreCoder + "GetSessionFailed"
	GetHostError             = loginPreCoder + "GetHostError"
	RefreshTokenError        = loginPreCoder + "RefreshTokenError"
	GetUserInfoError         = loginPreCoder + "GetUserInfoError"
	GetUserNameError         = loginPreCoder + "GetUserNameError"
	GetAccessPermissionError = loginPreCoder + "GetAccessPermissionError"
	GetUserRolesError        = loginPreCoder + "GetUserRolesError"
	UserHasNoRolesError      = loginPreCoder + "UserHasNoRolesError"

	UserHasNoPermissionError = loginPreCoder + "UserHasNoPermissionError"

	AnyshareHostConfNotFindError = loginPreCoder + "AnyshareHostConfNotFindError"
	UserNotExistedError          = loginPreCoder + "UserNotExistedError"
	UserDisabledError            = loginPreCoder + "UserDisabledError"
	UserLoginError               = loginPreCoder + "UserLoginError"
	ASTokenExpiredOrInvalidError = loginPreCoder + "ASTokenExpiredOrInvalidError"
	AuthenticationDrivenSSOError = loginPreCoder + "AuthenticationDrivenSSOError"
	ThirdPartyIdEmptyError       = loginPreCoder + "ThirdPartyIdEmptyError"
)

var loginErrorMap = errorCode{
	GetCodeFailed: {
		description: "获取授权码失败",
		cause:       "",
		solution:    "请重试",
	},
	LoginCallbackFailed: {
		description: "登录回调失败",
		cause:       "",
		solution:    "请重试",
	},
	SaveSessionFailed: {
		description: "保存会话失败",
		cause:       "",
		solution:    "请重试",
	},
	GetSessionFailed: {
		description: "获取会话失败",
		cause:       "",
		solution:    "请重试",
	},
	GetHostError: {
		description: "deploy_management 服务异常",
		cause:       "",
		solution:    "",
	},
	RefreshTokenError: {
		description: "刷新令牌失败",
		cause:       "",
		solution:    "",
	},
	GetUserInfoError: {
		description: "获取用户信息失败",
		cause:       "",
		solution:    "",
	},
	GetUserNameError: {
		description: "获取用户名失败",
		cause:       "",
		solution:    "",
	},
	GetAccessPermissionError: {
		description: "获取访问权限失败",
		cause:       "",
		solution:    "请重试",
	},
	GetUserRolesError: {
		description: "获取用户下的角色失败",
		cause:       "",
		solution:    "请重试",
	},
	UserHasNoRolesError: {
		description: "用户没有配置角色，不能登录",
		cause:       "",
		solution:    "请重试",
	},
	UserHasNoPermissionError: {
		description: "用户没有配置权限，不能登录",
		cause:       "",
		solution:    "请重试",
	},
	AnyshareHostConfNotFindError: {
		description: "未配置Anyshare Host，不能登录",
		cause:       "",
		solution:    "请联系系统管理员",
	},
	UserNotExistedError: {
		description: "用户不存在",
		cause:       "",
		solution:    "请联系系统管理员",
	},
	UserDisabledError: {
		description: "用户已被禁用",
		cause:       "",
		solution:    "请联系系统管理员",
	},
	UserLoginError: {
		description: "用户登录失败",
		cause:       "",
		solution:    "请重试",
	},
	ASTokenExpiredOrInvalidError: {
		description: "AS Token无效或已过期",
		cause:       "",
		solution:    "请重试",
	},
	AuthenticationDrivenSSOError: {
		description: "单点登录失败",
		cause:       "",
		solution:    "请重试",
	},
	ThirdPartyIdEmptyError: {
		description: "thirdpartyid 必填",
		cause:       "",
		solution:    "请重试",
	},
}
