package errorcode

import "github.com/kweaver-ai/dsg/services/apps/configuration-center/common/constant"

func init() {
	registerErrorCode(flowchartErrorMap)
}

// Flowchart error
const (
	flowchartPreCoder = constant.ServiceName + "." + flowchartModelName + "."

	FlowchartNameAlreadyExist = flowchartPreCoder + "NameAlreadyExist"
	FlowchartNotExist         = flowchartPreCoder + "FlowchartNotExist"
	FlowchartNotInEditing     = flowchartPreCoder + "FlowchartNotInEditing"
	FlowchartAlreadyInEditing = flowchartPreCoder + "FlowchartAlreadyInEditing"
	FlowchartAlreadyEdited    = flowchartPreCoder + "FlowchartAlreadyEdited"
	FlowchartOnlyClonedOne    = flowchartPreCoder + "FlowchartOnlyClonedOne"
	FlowchartContentInvalid   = flowchartPreCoder + "FlowchartContentInvalid"
	FlowchartContentIsEmpty   = flowchartPreCoder + "ContentIsEmpty"

	FlowchartVersionNotExist                   = flowchartPreCoder + "FlowchartVersionNotExist"
	FlowchartVersionCanNotDeleteByNotInEditing = flowchartPreCoder + "FlowchartVersionCanNotDeleteByNotInEditing"
	FlowchartVersionCanNotDeleteByEdited       = flowchartPreCoder + "FlowchartVersionCanNotDeleteByEdited"
	FlowchartVersionNotReleased                = flowchartPreCoder + "FlowchartVersionNotReleased"

	FlowchartNodeAlreadyExistTask = flowchartPreCoder + "NodeAlreadyExistTask"
	FlowchartNodeNotExistTask     = flowchartPreCoder + "NodeNotExistTask"

	FlowchartNodeTaskOnlyOneOfRoleAndTool = flowchartPreCoder + "NodeTaskOnlyOneOfRoleAndTool"
	FlowchartNodeTaskNotExist             = flowchartPreCoder + "NodeTaskNotExist"
	FlowchartNodeNotExist                 = flowchartPreCoder + "NodeNotExist"
	FlowchartNodeNameRepeat               = flowchartPreCoder + "NodeNameRepeat"
	FlowchartNodeCountTooMuch             = flowchartPreCoder + "NodeCountTooMuch"
	FlowchartNodeUnitIDRepeat             = flowchartPreCoder + "NodeUnitIDRepeat"
	FlowchartNodeNotStage                 = flowchartPreCoder + "NodeNotStage"
	FlowchartNodeStageNotFound            = flowchartPreCoder + "NodeStageNotFound"
	FlowchartNodeMultiStart               = flowchartPreCoder + "NodeMultiStart"
	FlowchartNodeMultiEnd                 = flowchartPreCoder + "NodeMultiEnd"
	FlowchartNodeHasLoop                  = flowchartPreCoder + "NodeHasLoop"
	FlowchartNodeExistFree                = flowchartPreCoder + "NodeExistFree"
	FlowchartNodeExecutorRoleNotExist     = flowchartPreCoder + "NodeExecutorRoleNotExist"
	FlowchartNodeTaskTypeNotMatched       = flowchartPreCoder + "NodeTaskTypeNotMatched"

	FlowchartStageNotExist        = flowchartPreCoder + "StageNotExist"
	FlowchartStageUnitIDRepeat    = flowchartPreCoder + "StageUnitIDRepeat"
	FlowchartStageNameRepeat      = flowchartPreCoder + "StageNameRepeat"
	FlowchartStageCountTooMuch    = flowchartPreCoder + "StageCountTooMuch"
	FlowchartStagePositionOverlap = flowchartPreCoder + "StagePositionOverlap"

	FlowchartConnectorNotExist     = flowchartPreCoder + "ConnectorNOtExist"
	FlowchartConnectorUnitIDRepeat = flowchartPreCoder + "ConnectorUnitIDRepeat"

	FlowchartRoleMissing = flowchartPreCoder + "FlowchartRoleMissing"
)

var flowchartErrorMap = errorCode{
	FlowchartNameAlreadyExist: {
		description: "该运营流程名称已存在",
		cause:       "",
		solution:    "请重新输入",
	},
	FlowchartNotExist: {
		description: "指定的运营流程不存在",
		cause:       "",
		solution:    "请选择正确的运营流程",
	},
	FlowchartVersionNotExist: {
		description: "指定的运营流程版本不存在",
		cause:       "",
		solution:    "请选择正确的运营流程版本",
	},
	FlowchartVersionCanNotDeleteByNotInEditing: {
		description: "指定的运营流程版本不能被删除",
		cause:       "运营流程不处于编辑状态",
		solution:    "请选择正确的运营流程版本",
	},
	FlowchartVersionCanNotDeleteByEdited: {
		description: "指定的运营流程版本不能被删除",
		cause:       "运营流程已被编辑",
		solution:    "请选择正确的运营流程版本",
	},
	FlowchartVersionNotReleased: {
		description: "指定的运营流程版本处于未发布状态",
		cause:       "",
		solution:    "请选择正确的运营流程版本",
	},
	FlowchartNotInEditing: {
		description: "当前运营流程不处于编辑中",
		cause:       "",
		solution:    "请选择正确的运营流程",
	},
	FlowchartAlreadyInEditing: {
		description: "当前运营流程已经处于编辑中",
		cause:       "",
		solution:    "请选择正确的运营流程",
	},
	FlowchartAlreadyEdited: {
		description: "当前运营流程已经被编辑",
		cause:       "",
		solution:    "请选择正确的运营流程或重试",
	},
	FlowchartNodeAlreadyExistTask: {
		description: "该运营流程节点已经存在任务配置",
		cause:       "",
		solution:    "请选择正确的运营流程节点",
	},
	FlowchartNodeNotExistTask: {
		description: "该运营流程节点不存在任务配置",
		cause:       "",
		solution:    "请选择正确的运营流程节点",
	},
	FlowchartNodeTaskOnlyOneOfRoleAndTool: {
		description: "运营流程节点的任务配置必须配置角色或工具，且不能同时配置角色和工具",
		cause:       "",
		solution:    "请更改任务配置项",
	},
	FlowchartNodeTaskNotExist: {
		description: "指定的运营流程节点不存在任务配置",
		cause:       "",
		solution:    "请选择正确的运营流程节点",
	},
	FlowchartStageNotExist: {
		description: "指定的运营流程阶段不存在",
		cause:       "",
		solution:    "请选择正确的运营流程阶段",
	},
	FlowchartNodeNotExist: {
		description: "指定的运营流程节点不存在",
		cause:       "",
		solution:    "请选择正确的运营流程节点",
	},
	FlowchartConnectorNotExist: {
		description: "指定的运营流程连接不存在",
		cause:       "",
		solution:    "请选择正确的运营流程连接",
	},
	FlowchartOnlyClonedOne: {
		description: "新建运营流程时只能在模版和已存在运营流程中选择一个进行复用",
		cause:       "",
		solution:    "请选择想要复用的运营流程或模版",
	},
	FlowchartContentInvalid: {
		description: "无效的运营流程内容",
		cause:       "",
		solution:    "请输入有效的运营流程内容",
	},
	FlowchartNodeNameRepeat: {
		description: "节点名称不唯一",
		cause:       "",
		solution:    "请修改节点名称",
	},
	FlowchartStageUnitIDRepeat: {
		description: "阶段单元ID不唯一",
		cause:       "",
		solution:    "请输入有效的运营流程内容",
	},
	FlowchartStageNameRepeat: {
		description: "阶段名称不唯一",
		cause:       "",
		solution:    "请修改阶段名称",
	},
	FlowchartStageCountTooMuch: {
		description: "阶段超过数量",
		cause:       "",
		solution:    "请减少阶段数量",
	},
	FlowchartNodeCountTooMuch: {
		description: "节点超过数量",
		cause:       "",
		solution:    "请减少节点数量",
	},
	FlowchartNodeUnitIDRepeat: {
		description: "节点单元ID不唯一",
		cause:       "",
		solution:    "请输入有效的运营流程内容",
	},
	FlowchartConnectorUnitIDRepeat: {
		description: "连接线单元ID不唯一",
		cause:       "",
		solution:    "请输入有效的运营流程内容",
	},
	FlowchartNodeNotStage: {
		description: "存在节点没有处于阶段中",
		cause:       "",
		solution:    "请输入有效的运营流程内容",
	},
	FlowchartStagePositionOverlap: {
		description: "存在多个阶段位置重叠",
		cause:       "",
		solution:    "请输入有效的运营流程内容",
	},
	FlowchartNodeStageNotFound: {
		description: "节点所属阶段不存在",
		cause:       "",
		solution:    "请输入有效的运营流程内容",
	},
	FlowchartNodeMultiStart: {
		description: "存在多个开始节点",
		cause:       "",
		solution:    "请输入有效的运营流程内容",
	},
	FlowchartNodeMultiEnd: {
		description: "存在多个结束节点",
		cause:       "",
		solution:    "请输入有效的运营流程内容",
	},
	FlowchartNodeHasLoop: {
		description: "节点之间存在闭环",
		cause:       "",
		solution:    "请输入有效的运营流程内容",
	},
	FlowchartNodeExistFree: {
		description: "存在游离节点",
		cause:       "",
		solution:    "请输入有效的运营流程内容",
	},
	FlowchartContentIsEmpty: {
		description: "画布内容为空",
		cause:       "",
		solution:    "请输入有效的运营流程内容",
	},
	FlowchartRoleMissing: {
		description: "运营流程任务角色缺失",
		cause:       "",
		solution:    "请重新选择",
	},
	FlowchartNodeExecutorRoleNotExist: {
		description: "存在节点角色被删除，请重新选择",
		cause:       "",
		solution:    "请重新选择",
	},
	FlowchartNodeTaskTypeNotMatched: {
		description: "第一个节点任务类型需要包含新建主干业务任务",
		cause:       "",
		solution:    "请重新选择",
	},
}
