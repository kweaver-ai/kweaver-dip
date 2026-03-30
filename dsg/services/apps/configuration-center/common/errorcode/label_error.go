package errorcode

import "github.com/kweaver-ai/dsg/services/apps/configuration-center/common/constant"

func init() {
	registerErrorCode(labelErrorMap)
}

// Tree error
const (
	labelPreCoder = constant.ServiceName + "." + gradeLabel + "."

	LabelInvalidParameter       = labelPreCoder + "LabelInvalidParameter"
	LabelNotExist               = labelPreCoder + "LabelNotExist"
	NextIdMustDestParentIdChild = labelPreCoder + "NextIdMustDestParentIdChild"
	LabelCount                  = labelPreCoder + "LabelCount"
	ParentIdNotExist            = labelPreCoder + "ParentIdNotExist"
)

var labelErrorMap = errorCode{
	LabelInvalidParameter: {
		description: "参数值校验不通过",
		cause:       "",
		solution:    "请使用请求参数构造规范化的请求字符串。详细信息参见产品 API 文档。",
	},

	LabelNotExist: {
		description: "标签不存在",
		cause:       "",
		solution:    "请尝试其它ID",
	},
	NextIdMustDestParentIdChild: {
		description: "next_id必须为dest_parent_id的子节点或0",
		cause:       "",
		solution:    "请尝试其它ID",
	},
	LabelCount: {
		description: "标签创建不能超过12个",
		cause:       "",
		solution:    "请检查标签数量",
	},
	ParentIdNotExist: {
		description: "ParentID不存在",
		cause:       "",
		solution:    "请尝试其它ID",
	},
}
