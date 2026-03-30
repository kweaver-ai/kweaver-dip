package errorcode

import "github.com/kweaver-ai/dsg/services/apps/data-application-service/common/constant"

func init() {
	registerErrorCode(appErrorMap)
}

const (
	appModelName = "App"
)

// Demo error
const (
	appPreCoder = constant.ServiceName + "." + appModelName + "."

	AppIdNotExist = appPreCoder + "AppIdNotExist"
)

var appErrorMap = errorCode{
	AppIdNotExist: {
		description: "应用ID不存在",
		cause:       "",
		solution:    "请重新输入应用ID",
	},
}
