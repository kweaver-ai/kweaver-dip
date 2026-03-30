package errorcode

import "github.com/kweaver-ai/dsg/services/apps/configuration-center/common/constant"

func init() {
	registerErrorCode(businessStructureErrorMap)
}

const (
	businessStructurePreCoder = constant.ServiceName + "." + businessStructureModelName + "."

	//BusinessStructureUnsupportedRequest   = businessStructurePreCoder + "UnsupportedRequest"
	//BusinessStructureObjectReadOnly   = businessStructurePreCoder + "ObjectReadOnly"
	BusinessStructureObjectNotFound   = businessStructurePreCoder + "ObjectNotFound"
	BusinessStructureObjectNameRepeat = businessStructurePreCoder + "ObjectNameRepeat"
	BusinessStructureJsonifyFailed    = businessStructurePreCoder + "JsonifyFailed"
	//BusinessStructureUnsupportedType      = businessStructurePreCoder + "UnsupportedType"
	//BusinessStructureObjectType           = businessStructurePreCoder + "ObjectType"
	BusinessStructureObjectAttrEmpty      = businessStructurePreCoder + "AttrEmpty"
	BusinessStructureObjectUpdateFileName = businessStructurePreCoder + "UpdateFileName"

	BusinessStructureObjectRecordNotFoundError = businessStructurePreCoder + "RecordNotFoundError"
	BusinessStructureFormDataReadError         = businessStructurePreCoder + "FormDataReadError"
	BusinessStructureMustUploadFile            = businessStructurePreCoder + "MustUploadFile"
	BusinessStructureFileReadError             = businessStructurePreCoder + "FileReadError"
	BusinessStructureMaxFileSize               = businessStructurePreCoder + "MaxFileSizeError"

	BusinessStructureJsonUnmarshalFailed    = businessStructurePreCoder + "JsonUnmarshalFailed"
	BusinessStructureCephClientUploadFailed = businessStructurePreCoder + "CephClientUploadFailed"
	BusinessStructureCephClientDownFailed   = businessStructurePreCoder + "CephClientDownFailed"
	BusinessStructureNotHaveAttribute       = businessStructurePreCoder + "NotHaveAttribute"
	BusinessStructureUploadFileError        = businessStructurePreCoder + "UploadFileError"
	BusinessStructureFileNotFound           = businessStructurePreCoder + "FileNotFound"
	//BusinessStructureIDEmpty                      = businessStructurePreCoder + "IDEmpty"
	BusinessStructureRenameObjectMessageSendError = businessStructurePreCoder + "RenameObjectMessageSendError"
	BusinessStructureMoveObjectMessageSendError   = businessStructurePreCoder + "MoveObjectMessageSendError"
	BusinessStructureDeleteObjectMessageSendError = businessStructurePreCoder + "DeleteObjectMessageSendError"
	//BusinessStructureParentObjectNotFound         = businessStructurePreCoder + "ParentObjectNotFound"
	//BusinessStructureParentObjectError            = businessStructurePreCoder + "ParentObjectError"
	//BusinessStructureUnsupportedMove              = businessStructurePreCoder + "UnsupportedMove"
	//BusinessStructureMoveError                    = businessStructurePreCoder + "MoveError"
	BusinessStructureUnsupportedRename = businessStructurePreCoder + "UnsupportedRename"
	//BusinessStructureUnsupportedDelete = businessStructurePreCoder + "UnsupportedDelete"
)

var businessStructureErrorMap = errorCode{

	//BusinessStructureUnsupportedRequest: {
	//	description: "不支持的请求",
	//	cause:       "",
	//	solution:    "请检查请求头参数x-real-method是否正确",
	//},

	BusinessStructureObjectNotFound: {
		description: "请求对象不存在，请检查后重试",
		cause:       "",
		solution:    "请检查对象ID是否正确",
	},
	BusinessStructureObjectNameRepeat: {
		description: "对象名称重复，请检查后重试",
		cause:       "",
		solution:    "请修改名称后重试",
	},
	BusinessStructureJsonifyFailed: {
		description: "请求参数序列化失败",
		cause:       "",
		solution:    "请检查请求体格式后重试",
	},
	//BusinessStructureUnsupportedType: {
	//	description: "当前对象无法创建该类型子对象",
	//	cause:       "",
	//	solution:    "请检查重试",
	//},
	BusinessStructureObjectRecordNotFoundError: {
		description: "该对象不存在",
		solution:    "请选择存在的对象重新操作",
	},
	BusinessStructureFormDataReadError: {
		description: "数据读取错误",
		solution:    "请检查输入数据",
	},
	BusinessStructureMustUploadFile: {
		description: "必须上传一个文件",
		solution:    "请检查输入的文件",
	},
	BusinessStructureFileReadError: {
		description: "文件读取错误",
		solution:    "请检查输入的文件",
	},
	BusinessStructureMaxFileSize: {
		description: "文件大小不可超过50M",
		solution:    "请选择一个更小的文件",
	},
	BusinessStructureJsonUnmarshalFailed: {
		description: "序列化失败",
		solution:    "请重试",
	},
	BusinessStructureCephClientUploadFailed: {
		description: "对象存储文件上传失败",
		solution:    "请重试",
	},
	BusinessStructureCephClientDownFailed: {
		description: "对象存储文件下载失败",
		solution:    "请重试",
	},
	BusinessStructureNotHaveAttribute: {
		description: "该对象不存在文件",
		solution:    "请重试",
	},
	BusinessStructureUploadFileError: {
		description: "只有部门和业务事项可以上传文件",
		solution:    "请检查输入数据",
	},
	BusinessStructureFileNotFound: {
		description: "该对象下无关联文件",
		solution:    "请检查输入数据",
	},
	//BusinessStructureObjectReadOnly: {
	//	description: "更新失败，业务表单为只读对象",
	//	solution:    "请检查输入数据",
	//},
	//BusinessStructureObjectType: {
	//	description: "object_type 必须是 [organization department business_system business_matters] 中的一个",
	//	solution:    "请检查输入数据",
	//},
	BusinessStructureObjectAttrEmpty: {
		description: "更新失败，attribute不能为空",
		solution:    "请检查输入数据",
	},
	//BusinessStructureIDEmpty: {
	//	description: "ID不能为空",
	//	solution:    "请检查输入数据",
	//},
	BusinessStructureObjectUpdateFileName: {
		description: "文件信息更新异常",
		solution:    "请检查输入数据",
	},
	BusinessStructureRenameObjectMessageSendError: {
		description: "重命名对象消息发送失败",
		solution:    "请重试",
	},
	BusinessStructureMoveObjectMessageSendError: {
		description: "移动对象消息发送失败",
		solution:    "请重试",
	},
	BusinessStructureDeleteObjectMessageSendError: {
		description: "删除对象消息发送失败",
		solution:    "请重试",
	},
	//BusinessStructureParentObjectNotFound: {
	//	description: "父对象不存在，请检查后重试",
	//	cause:       "",
	//	solution:    "请检查对象ID是否正确",
	//},
	//BusinessStructureParentObjectError: {
	//	description: "目标路径错误，请检查后重试",
	//	cause:       "",
	//	solution:    "请检查目标路径",
	//},
	//BusinessStructureUnsupportedMove: {
	//	description: "对象不支持移动",
	//	cause:       "",
	//	solution:    "请检查对象类型",
	//},
	//BusinessStructureMoveError: {
	//	description: "对象不支持移动到父节点、节点自身及子节点",
	//	cause:       "",
	//	solution:    "请检查对象移动的位置",
	//},
	BusinessStructureUnsupportedRename: {
		description: "组织和部门不支持重命名",
		cause:       "",
		solution:    "请检查对象类型",
	},
	//BusinessStructureUnsupportedDelete: {
	//	description: "组织和部门不支持删除",
	//	cause:       "",
	//	solution:    "请检查对象类型",
	//},
}
