package errorcode

import comErrorcode "github.com/kweaver-ai/idrm-go-common/errorcode"

const (
	ExcelFileNotFind   = modelPreCoder + "FileEmptyError"
	ExcelFileTooLarge  = modelPreCoder + "FileTooLarge"
	ExcelFileOpenError = modelPreCoder + "FileOpenError"
	ExcelFileReadError = modelPreCoder + "FileReadError"

	ExcelFileSaveError       = modelPreCoder + "FileSaveError"
	ExcelUnsupportedRuleType = modelPreCoder + "UnsupportedRuleType"

	ExcelFileModelNameDuplicate = modelPreCoder + "ModelNameDuplicate"

	ExcelTypeNotSupported           = modelPreCoder + "TypeError"
	ParamTypeNotSupported           = modelPreCoder + "ParamTypeError"
	ExcelFileEmpty                  = modelPreCoder + "ExcelFileEmpty"
	ExcelContentError               = modelPreCoder + "ExcelContentError"
	ExcelRequiredError              = modelPreCoder + "ExcelRequiredError"
	ExcelFileEmptyLine              = modelPreCoder + "ExcelFileEmptyLine"
	ExcelTransformError             = modelPreCoder + "ExcelTransformError"
	ExcelImportDuplicate            = modelPreCoder + "ExcelImportDuplicate"
	ExcelModelNameExistError        = modelPreCoder + "ExcelModelNameExistError"
	ExcelRequiredFieldWithArgsError = modelPreCoder + "RequiredFieldWithArgs"
)

var excelErrorMap = comErrorcode.ErrorCode{
	ExcelFileNotFind: {
		Description: "至少上传1个文件",
		Cause:       "",
		Solution:    "重新选择上传文件",
	},
	ExcelFileOpenError: {
		Description: "打开文件失败",
		Cause:       "",
		Solution:    "重新选择上传文件",
	},
	ExcelFileTooLarge: {
		Description: "文件过大",
		Cause:       "",
		Solution:    "重新选择上传文件",
	},
	ExcelFileReadError: {
		Description: "读取文件失败",
		Cause:       "",
		Solution:    "重新选择上传文件",
	},

	ExcelFileSaveError: {
		Description: "保存文件失败",
		Cause:       "",
		Solution:    "重新选择上传文件",
	},
	ExcelTypeNotSupported: {
		Description: "不支持的文件类型，Excel文件格式有误",
		Cause:       "",
		Solution:    "重新选择上传文件",
	},
	ExcelFileModelNameDuplicate: {
		Description: "存在文件内主干业务名称重复，或与已存在的业务模型名称重复",
		Cause:       "",
		Solution:    "修改并重新上传文件",
	},
	ExcelUnsupportedRuleType: {
		Description: "不支持的解析规则类型",
		Cause:       "",
		Solution:    "新建解析规则配置文件",
	},
	ParamTypeNotSupported: {
		Description: "不支持的参数类型，参数校验失败",
		Cause:       "",
		Solution:    "请检查后重新输入",
	},
	ExcelContentError: {
		Description: "文件内容与模板不符",
		Cause:       "",
		Solution:    "重新填写上传excel文件",
	},
	ExcelRequiredError: {
		Description: "存在文件必填项为空",
		Cause:       "",
		Solution:    "重新填写上传excel文件",
	},
	ExcelFileEmptyLine: {
		Description: "存在空行，或存在文件必填项为空",
		Cause:       "",
		Solution:    "重新填写上传excel文件",
	},
	ExcelTransformError: {
		Description: "根据配置文件解析失败，文件中多行值超过最大限制",
		Cause:       "",
		Solution:    "重新配置模板配置文件解析",
	},
	ExcelImportDuplicate: {
		Description: "存在重复，请重试",
		Cause:       "",
		Solution:    "",
	},
	ExcelFileEmpty: {
		Description: "文件为空",
		Cause:       "文件为空，或者sheet页名称与模板不符",
		Solution:    "重新填写上传excel文件",
	},
	ExcelModelNameExistError: {
		Description: "excel中没有配置中的模型名称，或者未配置模型名称字段",
		Cause:       "",
		Solution:    "更改excel文件，或者重新配置模型文件名称",
	},
	ExcelRequiredFieldWithArgsError: {
		Description: "[field]为必填字段",
		Cause:       "",
		Solution:    "重新填写上传excel文件",
	},
}
