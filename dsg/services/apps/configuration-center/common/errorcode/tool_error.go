package errorcode

import "github.com/kweaver-ai/dsg/services/apps/configuration-center/common/constant"

func init() {
	registerErrorCode(toolErrorMap)
}

// Tool error
const (
	toolPreCoder = constant.ServiceName + "." + toolModelName + "."

	ToolNotExist = toolPreCoder + "RoleNotExist"
)

var toolErrorMap = errorCode{
	ToolNotExist: {
		description: "工具不存在",
		cause:       "",
		solution:    "请重新选择工具",
	},
}
