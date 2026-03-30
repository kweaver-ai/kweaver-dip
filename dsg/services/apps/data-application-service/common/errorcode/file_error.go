package errorcode

import "github.com/kweaver-ai/dsg/services/apps/data-application-service/common/constant"

func init() {
	registerErrorCode(fileErrorMap)
}

const (
	fileModelName = "File"
)

const (
	filePreCoder = constant.ServiceName + "." + fileModelName + "."

	FileNotExist    = filePreCoder + "FileNotExist"
	FileIdNotExist  = filePreCoder + "FileIdNotExist"
	FileRequired    = filePreCoder + "FileRequired"
	FileOneMax      = filePreCoder + "FileOneMax"
	FileSizeMax     = filePreCoder + "FileSizeMax"
	FileInvalidType = filePreCoder + "FileInvalidType"
)

var fileErrorMap = errorCode{
	FileNotExist: {
		description: "文件不存在",
		cause:       "",
		solution:    "请重新上传",
	},
	FileIdNotExist: {
		description: "文件Id不存在",
		cause:       "",
		solution:    "请重新选择文件",
	},
	FileRequired: {
		description: "请上传文件",
		cause:       "",
		solution:    "请上传文件",
	},
	FileOneMax: {
		description: "仅支持每次上传一个文件",
		cause:       "",
		solution:    "请重新上传",
	},
	FileInvalidType: {
		description: "文件类型限制：doc、docx、xls、xlsx、ppt、pptx、pdf",
		cause:       "",
		solution:    "请重新上传",
	},
	FileSizeMax: {
		description: "文件大小不能超过10M",
		cause:       "",
		solution:    "请重新上传",
	},
}
