package v1

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/kweaver-ai/dsg/services/apps/data-view/common/errorcode"
	"github.com/kweaver-ai/idrm-go-frame/core/errorx/agerrors"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest/ginx"
)

// httpStatusCodeFromErrorCode 定义错误码到 http 状态码的映射。
var httpStatusCodeFromErrorCode = map[string]int{
	"CodeNil":                                   http.StatusOK,
	errorcode.LogicViewNotFound:                 http.StatusBadRequest,
	errorcode.SubViewAlreadyExists.GetCode():    http.StatusConflict,
	errorcode.SubViewDatabaseError.GetCode():    http.StatusInternalServerError,
	errorcode.SubViewNotFormViewOwner.GetCode(): http.StatusUnauthorized,
	errorcode.SubViewNotFound.GetCode():         http.StatusNotFound,
}

// resErrJson 封装 ginx.ResErrJsonWithCode，根据错误码决定 http 状态码。未定义与
// http 状态码映射关系的错误码，返回 http.StatusInternalServerError。
func resErrJson(c *gin.Context, err error) {
	errorCode := agerrors.Code(err).GetErrorCode()
	statusCode, ok := httpStatusCodeFromErrorCode[errorCode]
	if !ok {
		statusCode = http.StatusInternalServerError
	}

	ginx.ResErrJsonWithCode(c, statusCode, err)
}
