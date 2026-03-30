package errorcode

import (
	"errors"
	"net/http"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/constant"
	"github.com/kweaver-ai/idrm-go-frame/core/errorx/agerrors"
)

func init() {
	registerErrorCode(codeGenerationRuleErrorMap)
}

const codeGenerationRulePreCoder = constant.ServiceName + "." + codeGenerationRuleModelName

const (
	// 编码生成规则数据库错误
	CodeGenerationRuleDatabaseError = codeGenerationRulePreCoder + ".DatabaseError"
	// 指定的编码规则未找到
	CodeGenerationRuleNotFound = codeGenerationRulePreCoder + ".NotFound"
	// 期望生成的编码超过终止值
	CodeGenerationRuleExceedEnding = codeGenerationRulePreCoder + ".ExceedEnding"
)

var codeGenerationRuleErrorMap = errorCode{
	CodeGenerationRuleDatabaseError: {
		description: "编码生成规则数据库错误",
		solution:    "请重试",
	},
	CodeGenerationRuleNotFound: {
		description: "指定的编码规则未找到",
		solution:    "请检查编码规则的 ID",
	},
	CodeGenerationRuleExceedEnding: {
		description: "期望生成的编码超过终止值[%d]",
		solution:    "请减少生成的编码的数量",
	},
}

// 获取错误码对应的 HTTP Status Code
func GetCodeGenerationRuleErrorHTTPStatusCode(err error) int {
	ae := new(agerrors.Error)
	if !errors.As(err, &ae) {
		return http.StatusInternalServerError
	}

	statusCode, ok := codeGenerationRuleErrorStatusCodeMap[ae.Code().GetErrorCode()]
	if !ok {
		return http.StatusInternalServerError
	}
	return statusCode
}

var codeGenerationRuleErrorStatusCodeMap = map[string]int{
	CodeGenerationRuleDatabaseError: http.StatusInternalServerError,
	CodeGenerationRuleNotFound:      http.StatusNotFound,
	CodeGenerationRuleExceedEnding:  http.StatusBadRequest,
}
