package errorcode

import "github.com/kweaver-ai/dsg/services/apps/data-application-service/common/constant"

func init() {
	registerErrorCode(tagErrorMap)
}

const (
	tagModelName = "Tag"
)

// Demo error
const (
	tagPreCoder = constant.ServiceName + "." + tagModelName + "."

	TagNameExist  = tagPreCoder + "TagNameExist"
	TagIdNotExist = tagPreCoder + "TagIdNotExist"
)

var tagErrorMap = errorCode{
	TagNameExist: {
		description: "标签名称已存在",
		cause:       "",
		solution:    "请重新输入标签名称",
	},
	TagIdNotExist: {
		description: "标签Id不存在",
		cause:       "",
		solution:    "请重新输入标签Id",
	},
}
