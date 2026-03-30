package v1

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/util/validation/field"
	domain "github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/code_generation_rule"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest/ginx"
)

// 包装 domain/code_generation_rule 的 error 成为 common/errorcode
//
// responseError 将 error 写入 body, 并根据 error 写入 status code
func wrapError(c *gin.Context, err error) {
	// http.Response.StatusCode
	var statusCode int
	switch {
	case errors.Is(err, domain.ErrNotFound):
		statusCode, err = http.StatusNotFound, errorcode.Detail(errorcode.CodeGenerationRuleNotFound, err)
	case errors.Is(err, domain.ErrExceedEnding):
		statusCode, err = http.StatusBadRequest, errorcode.Detail(errorcode.CodeGenerationRuleExceedEnding, err)
	// 未匹配到或 nil，直接返回
	default:
		statusCode = http.StatusInternalServerError
	}
	ginx.ResErrJsonWithCode(c, statusCode, err)
}

// commonErrorCode 返回 common/errorcode 定义的 error
//
// 匹配失败的 error 返回原始值
func commonErrorCode(err error) error {
	switch {
	case errors.Is(err, domain.ErrNotFound):
		return errorcode.Detail(errorcode.CodeGenerationRuleNotFound, err)
	case errors.Is(err, domain.ErrExceedEnding):
		return errorcode.Detail(errorcode.CodeGenerationRuleExceedEnding, err)
	case errors.Is(err, &field.ErrorList{}):
		return errorcode.Detail(errorcode.PublicInvalidParameter, err)
	case errors.Is(err, &domain.UnmarshalPatchError{}):
		return errorcode.Desc(errorcode.PublicInvalidParameterJson)
	default:
		return errorcode.Detail(errorcode.PublicInternalError, err, "configuration-center")
	}
}

// statusCodeFromError 根据 error 返回对应的 http status code
//
// 匹配失败的 error 返回 500 Internal Server Error
func statusCodeFromError(err error) int {
	switch {
	case err == nil:
		return http.StatusOK
	case errors.Is(err, domain.ErrNotFound):
		return http.StatusNotFound
	case errors.Is(err, domain.ErrExceedEnding):
		return http.StatusBadRequest
	case errors.Is(err, &field.ErrorList{}):
		return http.StatusBadRequest
	case errors.Is(err, &domain.UnmarshalPatchError{}):
		return http.StatusBadRequest
	default:
		return http.StatusInternalServerError
	}
}
