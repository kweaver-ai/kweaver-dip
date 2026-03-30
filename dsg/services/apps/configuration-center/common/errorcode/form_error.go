package errorcode

func init() {
	registerErrorCode(formErrorMap)
}

const (
	FormFieldValueError    = formPreCoder + "FormFieldValueError"
	FormOpenExcelFileError = formPreCoder + "FormOpenExcelFileError"
	FormContentError       = formPreCoder + "FormContentError"
	FormEmptyError         = formPreCoder + "FormEmptyError"
	FormExcelEmptyError    = formPreCoder + "FormExcelEmptyError"
	FormFieldEmptyError    = formPreCoder + "FormFieldEmptyError"
	FormGetTemplateError   = formPreCoder + "FormGetTemplateError"
	FormGetRuleError       = formPreCoder + "FormGetRuleError"
	FormFileSizeLarge      = formPreCoder + "FormFileSizeLarge"
	FormExcelInvalidType   = formPreCoder + "FormExcelInvalidType"
	FormExistRequiredEmpty = formPreCoder + "FormExistRequiredEmpty"
	FormOneMax             = formPreCoder + "FormOneMax"
	FormNumberMax          = formPreCoder + "FormNumberMax"
)

var formErrorMap = errorCode{
	FormFieldValueError: {
		description: "列表字段值非法",
		cause:       "",
		solution:    "请修改非法的字段值",
	},
	FormOpenExcelFileError: {
		description: "打开文件失败",
		cause:       "",
		solution:    "重新选择上传文件",
	},
	FormContentError: {
		description: "文件内容与模板不符",
		cause:       "",
		solution:    "重新填写上传excel文件",
	},
	FormEmptyError: {
		description: "业务表单为空请检查",
		cause:       "",
		solution:    "请上传非空文件",
	},
	FormExcelEmptyError: {
		description: "公司信息为空请检查",
		cause:       "",
		solution:    "请上传非空文件",
	},
	FormFieldEmptyError: {
		description: "存在文件必填项为空检查",
		cause:       "",
		solution:    "请上传必填项文件",
	},
	FormGetTemplateError: {
		description: "获取模板配置失败",
		cause:       "",
		solution:    "请重试",
	},
	FormGetRuleError: {
		description: "获取规则配置失败",
		cause:       "",
		solution:    "请重试",
	},
	FormFileSizeLarge: {
		description: "文件不可超过10MB",
		cause:       "",
		solution:    "分批次导入",
	},
	FormExcelInvalidType: {
		description: "不支持的文件类型，Excel文件格式有误",
		solution:    "请重新选择文件上传",
	},
	FormExistRequiredEmpty: {
		description: "存在文件内必填项为空",
		solution:    "请检查必填项",
	},
	FormOneMax: {
		description: "仅支持每次上传一个文件",
		solution:    "请重新上传",
	},
}
