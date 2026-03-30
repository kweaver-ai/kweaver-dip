package errorcode

import "github.com/kweaver-ai/dsg/services/apps/configuration-center/common/constant"

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
	IconNameRepeat                = PublicInternalError + "IconNameRepeat"
	ParentMustGroup               = PublicInternalError + "ParentMustGroup"
	TreeNodeOverflowMaxLayerGroup = treeNodePreCoder + "TreeNodeOverflowMaxLayerGroup"
)

var treeNodeErrorMap = errorCode{
	TreeNodeNotExist: {
		description: "目录不存在",
		cause:       "",
		solution:    "请重新选择目录分类",
	},
	TreeNodeNameRepeat: {
		description: "名称已经存在",
		cause:       "",
		solution:    "请尝试其它名称",
	},
	TreeNodeRootNotAllowedOperate: {
		description: "根节点不允许被操作",
		cause:       "",
		solution:    "请选择正确的节点",
	},
	TreeNodeOverflowMaxLayer: {
		description: "最多为三层节点",
		cause:       "",
		solution:    "请注意节点层级",
	},
	TreeNodeOverflowMaxLayerGroup: {
		description: "分组最多为二层，第三层为标签",
		cause:       "",
		solution:    "请注意节点层级",
	},
	TreeNodeMoveToSubErr: {
		description: "不允许将分类移动到该分类及其子目录中",
		cause:       "",
		solution:    "请选择正确的目录分类",
	},
	IconNameRepeat: {
		description: "icon名称已经存在",
		cause:       "",
		solution:    "请尝试其它名称",
	},
	ParentMustGroup: {
		description: "父节点必须是分组",
		cause:       "",
		solution:    "请选择正常的分组",
	},
}
