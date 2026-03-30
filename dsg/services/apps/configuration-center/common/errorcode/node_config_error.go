package errorcode

import "github.com/kweaver-ai/dsg/services/apps/configuration-center/common/constant"

func init() {
	registerErrorCode(nodeConfigErrorMap)
}

const (
	nodeConfigPreCoder = constant.ServiceName + "." + nodeConfigModelName + "."

	FlowchartNotFound     = nodeConfigPreCoder + "FlowchartNodeFound"
	FlowchartUnitNotFound = nodeConfigPreCoder + "FlowchartUnitFound"

	FlowchartNodeConfigAlreadyExist = nodeConfigPreCoder + "NodeConfigAlreadyExist"
	FlowchartNodeConfigNotExist     = nodeConfigPreCoder + "NodeConfigNotExist"
)

var nodeConfigErrorMap = errorCode{
	FlowchartNotFound: {
		description: "运营流程配置不存在",
		cause:       "",
		solution:    "请检查输入的运营流程ID",
	},
	FlowchartUnitNotFound: {
		description: "运营流程单元不存在",
		cause:       "",
		solution:    "请检查输入的node_unit_id",
	},
	FlowchartNodeConfigAlreadyExist: {
		description: "当前节点已存在节点配置",
		cause:       "",
		solution:    "请检查输入的node_unit_id",
	},
	FlowchartNodeConfigNotExist: {
		description: "当前节点还未创建节点配置",
		cause:       "",
		solution:    "请检查输入的node_unit_id",
	},
}
