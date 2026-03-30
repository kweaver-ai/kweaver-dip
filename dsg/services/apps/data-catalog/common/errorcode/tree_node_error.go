package errorcode

import "github.com/kweaver-ai/dsg/services/apps/data-catalog/common/constant"

func init() {
	registerErrorCode(treeNodeErrorMap)
}

const (
	treeNodePreCoder = constant.ServiceName + "." + treeNodeModelName + "."

	TreeNodeNotExist              = treeNodePreCoder + "TreeNodeNotExist"
	TreeNodeNameRepeat            = treeNodePreCoder + "TreeNodeNameRepeat"
	TreeNodeRootNotAllowedOperate = treeNodePreCoder + "TreeNodeRootNotAllowedOperate"
	TreeNodeOverflowMaxLayer      = treeNodePreCoder + "TreeNodeOverflowMaxLayer"
	TreeNodeMoveToSubErr          = treeNodePreCoder + "TreeNodeMoveToSubErr"
)

var treeNodeErrorMap = errorCode{
	TreeNodeNotExist: {
		description: "目录分类不存在",
		cause:       "",
		solution:    "请重新选择目录分类",
	},
	TreeNodeNameRepeat: {
		description: "目录分类名称已经存在",
		cause:       "",
		solution:    "请尝试其它名称",
	},
	TreeNodeRootNotAllowedOperate: {
		description: "目录分类根节点不允许被操作",
		cause:       "",
		solution:    "请选择正确的节点",
	},
	TreeNodeOverflowMaxLayer: {
		description: "目录层级已超出最大限制",
		cause:       "",
		solution:    "请选择正确的目录分类",
	},
	TreeNodeMoveToSubErr: {
		description: "不允许将目录分类移动到该目录分类及其子目录中",
		cause:       "",
		solution:    "请选择正确的目录分类",
	},
}
