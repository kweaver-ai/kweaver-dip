package errorcode

import (
	"github.com/kweaver-ai/dsg/services/apps/data-subject/common/constant"
	"github.com/kweaver-ai/idrm-go-common/errorcode"
)

func init() {
	errorcode.RegisterErrorCode(commonErrorMap)
}

const (
	commonPreCoder = constant.ServiceName + ".Common."

	DataSubjectInvalidParameter      = commonPreCoder + "DataSubjectInvalidParameter"
	DataSubjectRequestParameterError = commonPreCoder + "DataSubjectRequestParameterError"
)

var commonErrorMap = errorcode.ErrorCode{
	DataSubjectInvalidParameter: {
		Description: "参数值校验不通过",
		Cause:       "",
		Solution:    "请使用请求参数构造规范化的请求字符串。详细信息参见产品 API 文档",
	},
	DataSubjectRequestParameterError: {
		Description: "请求参数格式错误",
		Cause:       "输入请求参数格式或内容有问题",
		Solution:    "请输入正确格式的请求参数",
	},
}
