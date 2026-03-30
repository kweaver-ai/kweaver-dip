package errorcode

import "github.com/kweaver-ai/dsg/services/apps/data-catalog/common/constant"

func init() {
	registerErrorCode(CognitiveServiceSystemErrorMap)
}

// Tree error
const (
	cognitiveServiceSystemPreCoder = constant.ServiceName + "." + CognitiveServiceSystemName + "."

	TemplateNameRepeat = cognitiveServiceSystemPreCoder + "TemplateNameRepeat"
)

var CognitiveServiceSystemErrorMap = errorCode{
	TemplateNameRepeat: {
		description: "模板名字已经存在",
		cause:       "",
		solution:    "请尝试其它名称",
	},
}
