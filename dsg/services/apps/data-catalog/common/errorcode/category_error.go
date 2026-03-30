package errorcode

import "github.com/kweaver-ai/dsg/services/apps/data-catalog/common/constant"

func init() {
	registerErrorCode(categoryErrorMap)
}

// Category error
const (
	categoryPreCoder = constant.ServiceName + "." + "Category" + "."

	CategoryNotExist         = categoryPreCoder + "CategoryNotExist"
	CategoryNameRepeat       = categoryPreCoder + "CategoryNameRepeat"
	CategoryOverflowMaxLayer = categoryPreCoder + "CategoryOverflowMaxLayer"
	CategoryTreeNotExist     = categoryPreCoder + "CategoryTreeNotExist"
	CategoryUsingOverMax     = categoryPreCoder + "CategoryUsingOverMax"
	CategorySystemEdit       = categoryPreCoder + "CategorySystemEdit"
	CategorySystemDelete     = categoryPreCoder + "CategorySystemDelete"
	CategoryUsingDelete      = categoryPreCoder + "CategoryUsingDelete"
	CategoryNotUsing         = categoryPreCoder + "CategoryNotUsing"
)

var categoryErrorMap = errorCode{
	CategoryNotExist: {
		description: "类目不存在",
		cause:       "",
		solution:    "请重新选择类目",
	},
	CategoryNameRepeat: {
		description: "类目名称已经存在",
		cause:       "",
		solution:    "请尝试其它名称",
	},
	CategoryOverflowMaxLayer: {
		description: "自定义类目已超出最大个数20",
		cause:       "",
		solution:    "请删除不需要的自定义类目",
	},
	CategoryTreeNotExist: {
		description: "无类目结构，无法启动",
		cause:       "",
		solution:    "请添加类目树节点",
	},
	CategoryUsingOverMax: {
		description: "自定义目录最大允许启用10个",
		cause:       "",
		solution:    "请停用不需要的类目",
	},
	CategorySystemDelete: {
		description: "系统类目不可删除",
		cause:       "",
		solution:    "系统类目不可删除",
	},
	CategorySystemEdit: {
		description: "系统类目不可操作",
		cause:       "",
		solution:    "系统类目不可操作",
	},
	CategoryUsingDelete: {
		description: "启动的类目不可删除",
		cause:       "",
		solution:    "请先停用类目",
	},
	CategoryNotUsing: {
		description: "类目未启用",
		cause:       "",
		solution:    "请先启用类目",
	},
}
