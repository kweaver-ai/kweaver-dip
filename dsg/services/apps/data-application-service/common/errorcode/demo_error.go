package errorcode

import "github.com/kweaver-ai/dsg/services/apps/data-application-service/common/constant"

func init() {
	registerErrorCode(demoErrorMap)
}

// Demo error
const (
	demoPreCoder = constant.ServiceName + "." + demoModelName + "."

	DemoNotExist = demoPreCoder + "DemoNotExist"
)

var demoErrorMap = errorCode{
	DemoNotExist: {
		description: "Demo不存在",
		cause:       "",
		solution:    "请重新选择Demo",
	},
}
