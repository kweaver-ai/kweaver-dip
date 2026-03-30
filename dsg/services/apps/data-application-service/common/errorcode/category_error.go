package errorcode

import "github.com/kweaver-ai/dsg/services/apps/data-application-service/common/constant"

func init() {
	registerErrorCode(categoryErrorMap)
}

const (
	categoryModelName = "Category"
)

// Demo error
const (
	categoryPreCoder = constant.ServiceName + "." + categoryModelName + "."

	CategoryIdNotExist = categoryPreCoder + "CategoryIdNotExist"
)

var categoryErrorMap = errorCode{
	CategoryIdNotExist: {
		description: "分类ID不存在",
		cause:       "",
		solution:    "请重新输入分类ID",
	},
}
