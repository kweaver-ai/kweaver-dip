package errorcode

const (
	FusionTableInvalidParameter     = FusionModelPreCoder + "InvalidParameter"
	FusionTableInvalidParameterJson = FusionModelPreCoder + "FusionTableInvalidParameterJson"
	FusionTableNotExistError        = FusionModelPreCoder + "FusionTableNotExistError"
	FusionTableEditError            = FusionModelPreCoder + "FusionTableEditError"
	FusionTableAlreadyExistError    = FusionModelPreCoder + "FusionTableAlreadyExistError"
)

var FusionModelErrorMap = errorCode{
	FusionTableInvalidParameter: {
		description: "参数值校验不通过",
		cause:       "",
		solution:    "请使用请求参数构造规范化的请求字符串。详细信息参见产品 API 文档",
	},
	FusionTableInvalidParameterJson: {
		description: "参数值校验不通过：json格式错误",
		solution:    "请使用请求参数构造规范化的请求字符串，详细信息参见产品 API 文档",
	},
	FusionTableNotExistError: {
		description: "融合表不存在",
		solution:    "请检查融合表是否存在",
	},
	FusionTableEditError: {
		description: "当前状态不允许编辑融合模型",
		solution:    "处于审核中, 或者状态为已经申报的工单,不可以编辑融合模型",
	},
	FusionTableAlreadyExistError: {
		description: "该工单已存在融合表",
		solution:    "请检查融合表是否存在",
	},
}
