package errorcode

import "github.com/kweaver-ai/dsg/services/apps/data-catalog/common/constant"

func init() {
	registerErrorCode(dataComprehensionErrorMap)
}

// Tree error
const (
	dataComprehensionPreCoder = constant.ServiceName + ".DataComprehension."

	DataComprehensionUnmarshalJsonError          = dataComprehensionPreCoder + "UnmarshalJsonError"
	DataComprehensionInvalidContentTypeError     = dataComprehensionPreCoder + "InvalidContentTypeError"
	DataComprehensionConfigError                 = dataComprehensionPreCoder + "ConfigError"
	DataComprehensionContentError                = dataComprehensionPreCoder + "ContentError"
	DimensionConfigIsEmptyError                  = dataComprehensionPreCoder + "DimensionConfigIsEmpty"
	DataComprehensionCatalogNotExist             = dataComprehensionPreCoder + "DataComprehensionCatalogNotExist"
	DataComprehensionCatalogOfflineDeleted       = dataComprehensionPreCoder + "DataComprehensionCatalogOfflineDeleted"
	DataComprehensionTemplateBindRunningTask     = dataComprehensionPreCoder + "DataComprehensionTemplateBindRunningTask"
	DrivenGetComprehensionTemplateRelationFailed = dataComprehensionPreCoder + "DrivenGetComprehensionTemplateRelationFailed"
	GetTaskDetailByIdFailed                      = dataComprehensionPreCoder + "GetTaskDetailByIdFailed"
	DataComprehensionTemplateNameRepeat          = dataComprehensionPreCoder + "DataComprehensionTemplateNameRepeat"
	DataComprehensionTemplateNotExist            = dataComprehensionPreCoder + "DataComprehensionTemplateNotExist"
	DataComprehensionAuditing                    = dataComprehensionPreCoder + "DataComprehensionAuditing"
	DataComprehensionDeleteFailed                = dataComprehensionPreCoder + "DataComprehensionDeleteFailed"
)

var dataComprehensionErrorMap = errorCode{
	DataComprehensionUnmarshalJsonError: {
		description: "数据理解维度[dimension]解析json错误",
		solution:    "请检查",
	},
	DataComprehensionInvalidContentTypeError: {
		description: "数据理解类型错误",
		solution:    "请检查",
	},
	DataComprehensionConfigError: {
		description: "数据理解维度[dimension]错误:[err]",
		solution:    "请检查",
	},
	DataComprehensionContentError: {
		description: "数据理解内容错误",
		solution:    "请检查",
	},
	DimensionConfigIsEmptyError: {
		description: "数据理解配置为空",
		solution:    "请检查",
	},
	DataComprehensionCatalogNotExist: {
		description: "该数据资源目录已删除",
		solution:    "请检查",
	},
	DataComprehensionCatalogOfflineDeleted: {
		description: "该数据资源目录未发布或已删除",
		solution:    "",
	},
	DataComprehensionTemplateBindRunningTask: {
		description: "数据资源目录模板绑定有执行中的任务",
		solution:    "",
	},
	DrivenGetComprehensionTemplateRelationFailed: {
		description: "任务中心获取数据理解任务信息失败",
		solution:    "",
	},
	GetTaskDetailByIdFailed: {
		description: "任务中心获取数据理解任务下的目录失败",
		solution:    "",
	},
	DataComprehensionTemplateNameRepeat: {
		description: "数据理解模板名称重复",
		solution:    "",
	},
	DataComprehensionTemplateNotExist: {
		description: "数据理解模板不存在",
		solution:    "",
	},
	DataComprehensionAuditing: {
		description: "数据理解报告正在审核中",
		solution:    "",
	},
	DataComprehensionDeleteFailed: {
		description: "数据理解报告删除失败",
		solution:    "",
	},
}
