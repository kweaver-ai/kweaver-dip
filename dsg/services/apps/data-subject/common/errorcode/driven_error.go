package errorcode

import (
	"github.com/kweaver-ai/dsg/services/apps/data-subject/common/constant"
	"github.com/kweaver-ai/idrm-go-common/errorcode"
)

func init() {
	errorcode.RegisterErrorCode(drivenErrorMap)
}

const (
	drivenPreCoder = constant.ServiceName + ".Driven."

	StandardUrlError                   = drivenPreCoder + "StandardUrlError"
	StandardNotExit                    = drivenPreCoder + "StandardNotExit"
	StandardUnmarshalFailure           = drivenPreCoder + "StandardUnmarshalFailure"
	UserMgrBatchGetUserInfoByIDFailure = drivenPreCoder + "UserMgrBatchGetUserInfoByIDFailure"
)

var drivenErrorMap = errorcode.ErrorCode{
	StandardUrlError: {
		Description: "标准化平台服务异常，或url地址有误",
		Cause:       "",
		Solution:    "请检查标准化平台服务，检查ip和端口后重试",
	},
	StandardNotExit: {
		Description: "该标准不存在，请检查后刷新重试",
		Cause:       "",
		Solution:    "请选择存在的标准",
	},
	StandardUnmarshalFailure: {
		Description: "标准化平台返回值异常",
		Cause:       "",
		Solution:    "",
	},
	UserMgrBatchGetUserInfoByIDFailure: {
		Description: "获取用户信息失败",
		Cause:       "",
		Solution:    "",
	},
}
