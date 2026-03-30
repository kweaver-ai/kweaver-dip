package errorcode

import (
	"github.com/kweaver-ai/dsg/services/apps/data-view/common/constant"
	"github.com/kweaver-ai/idrm-go-common/errorcode"
)

func init() {
	errorcode.RegisterErrorCode(RecognitionAlgorithmErrorMap)
}

const (
	recognitionAlgorithmPreCoder = constant.ServiceName + ".RecognitionAlgorithm."

	RecognitionAlgorithmDatabaseError = recognitionAlgorithmPreCoder + "DatabaseError"
	RecognitionAlgorithmIsExist       = recognitionAlgorithmPreCoder + "IsExist"
	RecognitionAlgorithmNotFound      = recognitionAlgorithmPreCoder + "NotFound"
	RecognitionAlgorithmNotInUse      = recognitionAlgorithmPreCoder + "NotInUse"
	RecognitionAlgorithmInUse         = recognitionAlgorithmPreCoder + "InUse"
	RecognitionAlgorithmInvalidStatus = recognitionAlgorithmPreCoder + "InvalidStatus"
	RecognitionAlgorithmInnerType     = recognitionAlgorithmPreCoder + "InnerType"
	RecognitionAlgorithmDuplicate     = recognitionAlgorithmPreCoder + "Duplicate"
	RecognitionAlgorithmInvalid       = recognitionAlgorithmPreCoder + "Invalid"
)

var RecognitionAlgorithmErrorMap = errorcode.ErrorCode{
	RecognitionAlgorithmDatabaseError: {
		Description: "数据库异常",
		Cause:       "",
		Solution:    "",
	},
	RecognitionAlgorithmIsExist: {
		Description: "识别算法已存在",
		Cause:       "",
		Solution:    "",
	},
	RecognitionAlgorithmNotFound: {
		Description: "识别算法不存在",
		Cause:       "",
		Solution:    "",
	},
	RecognitionAlgorithmNotInUse: {
		Description: "识别算法已停用",
		Cause:       "",
		Solution:    "",
	},
	RecognitionAlgorithmInUse: {
		Description: "识别算法正在使用中",
		Cause:       "",
		Solution:    "",
	},
	RecognitionAlgorithmInvalidStatus: {
		Description: "识别算法状态无效",
		Cause:       "",
		Solution:    "",
	},
	RecognitionAlgorithmInnerType: {
		Description: "内置算法不能删除",
		Cause:       "",
		Solution:    "",
	},
	RecognitionAlgorithmDuplicate: {
		Description: "识别算法名称已存在",
		Cause:       "",
		Solution:    "",
	},
	RecognitionAlgorithmInvalid: {
		Description: "无效的正则表达式",
		Cause:       "",
		Solution:    "请检查正则表达式格式是否正确",
	},
}
