package errorcode

const (
	OssFormDataReadError    = ossPreCoder + "FormDataReadError"
	OssInvalidParameter     = ossPreCoder + "InvalidParameter"
	OssMustUploadFile       = ossPreCoder + "MustUploadFile"
	OssFileReadError        = ossPreCoder + "FileReadError"
	OssMaxFileSize          = ossPreCoder + "MaxFileSizeError"
	OssFileFormatNotSupport = ossPreCoder + "FileFormatNotSupport"
	OssInsertFail           = ossPreCoder + "InsertFail"
	OssQueryFail            = ossPreCoder + "QueryFail"
	OssRecordNotFound       = ossPreCoder + "RecordNotFound"
	OssSaveTableFail		= ossPreCoder + "SvaeFail"
)

var ossErrorMap = errorCode{
	OssFormDataReadError: {
		description: "表单数据读取错误",
		solution:    "请检查输入数据",
	},
	OssSaveTableFail: {
		description: "表单插入错误",
		solution:    "请检查输入数据",
	},
	OssInsertFail: {
		description: "通过OSS网关上传文件失败,请检查OSS配置和网关是否连接对象存储",
		solution:    ContactDeveloper,
	},
	OssQueryFail: {
		description: "通过OSS网关下载文件失败,请检查OSS配置和网关是否连接对象存储",
		solution:    ContactDeveloper,
	},
	OssInvalidParameter: {
		description: "参数值校验不通过",
		solution:    SeeAPIManual,
	},
	OssMustUploadFile: {
		description: "必须上传一个文件",
		solution:    CheckInputFile,
	},
	OssFileReadError: {
		description: "文件读取错误",
		solution:    CheckInputFile,
	},
	OssMaxFileSize: {
		description: "仅支持JPG、JPEG、PNG格式，且大小不可超过1M",
		solution:    ChooseSmallerFile,
	},
	OssFileFormatNotSupport: {
		description: "仅支持JPG、JPEG、PNG格式，且大小不可超过1M",
		solution:    ChooseMatchedFormat,
	},
	OssRecordNotFound: {
		description: "该对象不存在",
		solution:    "请重新输入",
	},
}
