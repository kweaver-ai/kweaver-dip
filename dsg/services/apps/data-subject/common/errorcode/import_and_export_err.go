package errorcode

import (
	"github.com/kweaver-ai/idrm-go-common/errorcode"
)

func init() {
	errorcode.RegisterErrorCode(importAndexportErrorCoder)
}

const (
	SheetContentError            = subjectDomainPreCoder + "SheetContentError"
	FormOpenExcelFileError       = subjectDomainPreCoder + "FormOpenExcelFileError"
	FormGetTemplateError         = subjectDomainPreCoder + "FormGetTemplateError"
	FormGetRuleError             = subjectDomainPreCoder + "FormGetRuleError"
	FormContentError             = subjectDomainPreCoder + "FormContentError"
	FormFeildMaxLimitError       = subjectDomainPreCoder + "FormFeildMaxLimitError"
	FormEmptyError               = subjectDomainPreCoder + "FormEmptyError"
	FormJsonUnMarshalError       = subjectDomainPreCoder + "FormJsonUnMarshalError"
	FormFileSizeLarge            = subjectDomainPreCoder + "FormFileSizeLarge"
	FormExcelInvalidType         = subjectDomainPreCoder + "FormExcelInvalidType"
	FormCreateDirError           = subjectDomainPreCoder + "FormCreateDirError"
	FormSaveFileError            = subjectDomainPreCoder + "FormSaveFileError"
	ExportMaxLimitError          = subjectDomainPreCoder + "ExportMaxLimitError"
	IndicatorExcelFileWriteError = subjectDomainPreCoder + "IndicatorExcelFileWriteError"
	FormPanic                    = subjectDomainPreCoder + "FormPanic"
	FormOneMax                   = subjectDomainPreCoder + "FormOneMax"
	FormExistRequiredEmpty       = subjectDomainPreCoder + "FormExistRequiredEmpty"
	FormOpenTemplateFileError    = subjectDomainPreCoder + "FormOpenTemplateFileError"
)

var importAndexportErrorCoder = errorcode.ErrorCode{
	SheetContentError: {
		Description: "检查到上传内容不符合规范，请检查修改后，再次上传",
		Solution:    "请检查修改后，再次上传",
	},
	FormOpenExcelFileError: {
		Description: "打开文件失败",
		Cause:       "",
		Solution:    "重新选择上传文件",
	},
	FormGetTemplateError: {
		Description: "获取模板配置失败",
		Cause:       "",
		Solution:    "请重试",
	},
	FormGetRuleError: {
		Description: "获取规则配置失败",
		Cause:       "",
		Solution:    "请重试",
	},
	FormContentError: {
		Description: "上传文件模板内容与下载模板不符， 请重新下载应用",
		Cause:       "",
		Solution:    "请重新下载应用",
	},
	FormFeildMaxLimitError: {
		Description: "每次仅支持最多导入%d条业务属性",
		Cause:       "",
		Solution:    "减少业务属性数重新导入",
	},
	FormEmptyError: {
		Description: "业务对象或活动字段表为空",
		Cause:       "",
		Solution:    "请上传非空文件",
	},
	FormJsonUnMarshalError: {
		Description: "json.UnMarshal转化失败",
		Cause:       "",
		Solution:    "检查文件内容",
	},
	FormFileSizeLarge: {
		Description: "文件不可超过10MB",
		Cause:       "",
		Solution:    "分批次导入",
	},
	FormExcelInvalidType: {
		Description: "不支持的文件类型，Excel文件格式有误",
		Solution:    "请重新选择文件上传",
	},
	FormCreateDirError: {
		Description: "创建目录失败",
		Cause:       "",
		Solution:    "请重试",
	},
	FormSaveFileError: {
		Description: "保存文件失败",
		Cause:       "",
		Solution:    "请重试",
	},
	ExportMaxLimitError: {
		Description: "每次仅支持最多导出%d条业务属性",
		Cause:       "",
		Solution:    "减少业务属性数重新导入",
	},
	IndicatorExcelFileWriteError: {
		Description: "Excel文件写入错误",
		Solution:    "请重试，或请联系开发人员",
	},
	FormPanic: {
		Description: "服务异常",
		Cause:       "",
		Solution:    "联系后端开发人员",
	},
	FormOneMax: {
		Description: "仅支持每次上传一个文件",
		Solution:    "请重新上传",
	},
	FormExistRequiredEmpty: {
		Description: "存在文件内必填项为空",
		Solution:    "请检查必填项",
	},
	FormOpenTemplateFileError: {
		Description: "打开模板文件失败",
		Solution:    "请检查模板文件和路径",
	},
}
