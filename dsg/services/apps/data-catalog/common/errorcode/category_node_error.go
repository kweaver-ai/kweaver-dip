package errorcode

import "github.com/kweaver-ai/dsg/services/apps/data-catalog/common/constant"

func init() {
	registerErrorCode(categoryNodeErrorMap)
}

const (
	categoryNodePreCoder = constant.ServiceName + "." + "CategoryNode" + "."

	CategoryNodeNotExist              = categoryNodePreCoder + "CategoryNodeNotExist"
	CategoryNodeNameRepeat            = categoryNodePreCoder + "CategoryNodeNameRepeat"
	CategoryNodeRootNotAllowedOperate = categoryNodePreCoder + "CategoryNodeRootNotAllowedOperate"
	CategoryNodeOverflowMaxLayer      = categoryNodePreCoder + "CategoryNodeOverflowMaxLayer"
	CategoryNodeMoveToSubErr          = categoryNodePreCoder + "CategoryNodeMoveToSubErr"
)

var categoryNodeErrorMap = errorCode{
	CategoryNodeNotExist: {
		description: "类目树节点不存在",
		cause:       "",
		solution:    "请重新选择类目树节点",
	},
	CategoryNodeNameRepeat: {
		description: "类目树节点名称已经存在",
		cause:       "",
		solution:    "请尝试其它名称",
	},
	CategoryNodeRootNotAllowedOperate: {
		description: "目录分类根节点不允许被操作",
		cause:       "",
		solution:    "请选择正确的节点",
	},
	CategoryNodeOverflowMaxLayer: {
		description: "类目树节点层级已超出最大限制",
		cause:       "",
		solution:    "请选择正确的类目树节点",
	},
	CategoryNodeMoveToSubErr: {
		description: "不允许将类目树节点移动到该类目树节点下及其子类目树节点下",
		cause:       "",
		solution:    "请选择正确的类目树节点",
	},
}
