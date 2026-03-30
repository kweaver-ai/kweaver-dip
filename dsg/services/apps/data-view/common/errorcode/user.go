package errorcode

import (
	"github.com/kweaver-ai/dsg/services/apps/data-view/common/constant"
	"github.com/kweaver-ai/idrm-go-common/errorcode"
)

func init() {
	errorcode.RegisterErrorCode(userMap)
}

const (
	UserPreCoder              = constant.ServiceName + ".User."
	UserDataBaseError         = UserPreCoder + "UserDataBaseError"
	UserIdNotExistError       = UserPreCoder + "UserIdNotExistError"
	GetUserInfoFailedInterior = UserPreCoder + "." + "GetUserInfoFailedInterior"
	GetTokenEmpty             = UserPreCoder + "." + "GetTokenEmpty"
	UserMgmCallError          = UserPreCoder + "UserMgmCallError"
)

var userMap = errorcode.ErrorCode{
	UserDataBaseError: {
		Description: "数据库错误",
		Cause:       "",
		Solution:    "请重试",
	},
	UserIdNotExistError: {
		Description: "用户不存在",
		Cause:       "",
		Solution:    "请重试",
	},
	GetUserInfoFailedInterior: {
		Description: "获取用户信息失败",
		Cause:       "",
		Solution:    "请联系系统维护者",
	},
	GetTokenEmpty: {
		Description: "获取用户信息失败",
		Cause:       "",
		Solution:    "请联系系统维护者",
	},
	UserMgmCallError: {
		Description: "用户管理获取用户失败",
		Cause:       "UserMgm获取用户失败",
		Solution:    "请重试",
	},
}
