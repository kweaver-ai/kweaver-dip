package errorcode

import "github.com/kweaver-ai/dsg/services/apps/data-catalog/common/constant"

func init() {
	registerErrorCode(elecLicenceErrorMap)
}

// Tree error
const (
	elecLicencePreCoder = constant.ServiceName + ".ElecLicence."

	ElecLicenceNotFound    = elecLicencePreCoder + "ElecLicenceNotFound"
	FormExistRequiredEmpty = elecLicencePreCoder + "FormExistRequiredEmpty"
	FormOneMax             = elecLicencePreCoder + "FormOneMax"
	FormFileSizeLarge      = elecLicencePreCoder + "FormFileSizeLarge"
	FormExcelInvalidType   = elecLicencePreCoder + "FormExcelInvalidType"
	FormOpenExcelFileError = elecLicencePreCoder + "FormOpenExcelFileError"
	ElecLicenceExport      = elecLicencePreCoder + "ElecLicenceExport"
	OpenReaderError        = elecLicencePreCoder + "OpenReaderError"
)

var elecLicenceErrorMap = errorCode{
	ElecLicenceNotFound: {
		description: "电子证照不存在",
		solution:    "请检查",
	},
	FormExistRequiredEmpty: {
		description: "存在文件内必填项为空",
		solution:    "请检查必填项",
	},
	FormOneMax: {
		description: "仅支持每次上传一个文件",
		solution:    "请重新上传",
	},
	FormFileSizeLarge: {
		description: "文件不可超过10MB",
		solution:    "分批次导入",
	},
	FormExcelInvalidType: {
		description: "不支持的文件类型，Excel文件格式有误",
		solution:    "请重新选择文件上传",
	},
	FormOpenExcelFileError: {
		description: "打开文件失败",
		solution:    "重新选择上传文件",
	},
	ElecLicenceExport: {
		description: "电子证照导出失败",
		solution:    "请检查",
	},
	OpenReaderError: {
		description: "打开xlsx问文件失败",
		solution:    "请检查",
	},
}
