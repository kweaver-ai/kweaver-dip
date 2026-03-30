package errorcode

const (
	QualityAuditInvalidParameter     = QualityAuditModelPreCoder + "InvalidParameter"
	QualityAuditInvalidParameterJson = QualityAuditModelPreCoder + "QualityAuditInvalidParameterJson"
	QualityAuditEditError            = QualityAuditModelPreCoder + "QualityAuditEditError"
	ViewAuditConfiguredError         = QualityAuditModelPreCoder + "ViewAuditConfiguredError"
)

var QualityAuditModelErrorMap = errorCode{
	QualityAuditInvalidParameter: {
		description: "参数值校验不通过",
		cause:       "",
		solution:    "请使用请求参数构造规范化的请求字符串。详细信息参见产品 API 文档",
	},
	QualityAuditInvalidParameterJson: {
		description: "参数值校验不通过：json格式错误",
		solution:    "请使用请求参数构造规范化的请求字符串，详细信息参见产品 API 文档",
	},
	QualityAuditEditError: {
		description: "当前状态不允许编辑质量稽核模型",
		solution:    "处于审核中, 或者状态为已经申报的工单,不可以编辑质量稽核模型",
	},
	ViewAuditConfiguredError: {
		description: "该工单的质量稽核模型存在未配置或未启用稽核规则的逻辑视图",
		solution:    "请确认该工单的质量稽核模型是否存在未配置或未启用稽核规则的逻辑视图",
	},
}
