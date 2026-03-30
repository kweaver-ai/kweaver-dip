package errorcode

import (
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/constant"
)

func init() {
	registerErrorCode(businessMattersErrorMap)
}

const (
	businessMattersPreCoder = constant.ServiceName + ".BusinessMatters."
	BusinessMattersNotFound = businessMattersPreCoder + "businessMattersNotFound"
	BusinessMattersExist    = businessMattersPreCoder + "businessMattersExist"
)

var businessMattersErrorMap = errorCode{
	BusinessMattersNotFound: {
		description: "业务事项 id:[%s]未找到",
		cause:       "",
		solution:    "请重新选择业务事项",
	},
	BusinessMattersExist: {
		description: "此业务事项名称已存在，请重新输入",
		cause:       "",
		solution:    "请重新输入",
	},
}
