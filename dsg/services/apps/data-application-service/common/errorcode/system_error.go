package errorcode

import "github.com/kweaver-ai/dsg/services/apps/data-application-service/common/constant"

func init() {
	registerErrorCode(systemErrorMap)
}

const (
	systemModelName = "System"
)

// Demo error
const (
	systemPreCoder = constant.ServiceName + "." + systemModelName + "."

	SystemIdNotExist = systemPreCoder + "SystemIdNotExist"
)

var systemErrorMap = errorCode{
	SystemIdNotExist: {
		description: "系统ID不存在",
		cause:       "",
		solution:    "请重新输入系统ID",
	},
}
