package errorcode

import (
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/constant"
)

func init() {
	registerErrorCode(frontErrorMap)
}

const (
	frontPreCoder  = constant.ServiceName + ".Front."
	FrontNameFound = frontPreCoder + "FrontNameExist"
	FrontIPExist   = frontPreCoder + "FrontIPExist"
)

var frontErrorMap = errorCode{
	FrontIPExist: {
		description: "此前置机IP地址已存在，请重新输入",
		cause:       "",
		solution:    "请重新输入",
	},
	FrontNameFound: {
		description: "此前置机下数据库名称已存在，请重新输入",
		cause:       "",
		solution:    "请重新输入",
	},
}
