package errorcode

import "github.com/kweaver-ai/dsg/services/apps/data-catalog/common/constant"

func init() {
	registerErrorCode(treeErrorMap)
}

// Tree error
const (
	treePreCoder = constant.ServiceName + "." + treeModelName + "."

	TreeNotExist   = treePreCoder + "TreeNotExist"
	TreeNameRepeat = treePreCoder + "TreeNameRepeat"
)

var treeErrorMap = errorCode{
	TreeNotExist: {
		description: "树不存在",
		cause:       "",
		solution:    "请重新选择树",
	},
	TreeNameRepeat: {
		description: "树名称已经存在",
		cause:       "",
		solution:    "请尝试其它名称",
	},
}
