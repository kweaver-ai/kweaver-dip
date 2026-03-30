package errorcode

import "github.com/kweaver-ai/dsg/services/apps/data-application-service/common/constant"

func init() {
	registerErrorCode(developerErrorMap)
}

const (
	developerModelName = "Developer"
)

// Demo error
const (
	developerPreCoder = constant.ServiceName + "." + developerModelName + "."

	DeveloperNameExist  = developerPreCoder + "DeveloperNameExist"
	DeveloperIdNotExist = developerPreCoder + "DeveloperIdNotExist"
)

var developerErrorMap = errorCode{
	DeveloperNameExist: {
		description: "开发商名称已存在",
		cause:       "",
		solution:    "请重新输入开发商名称",
	},
	DeveloperIdNotExist: {
		description: "开发商ID不存在",
		cause:       "",
		solution:    "请重新输入开发商ID",
	},
}
