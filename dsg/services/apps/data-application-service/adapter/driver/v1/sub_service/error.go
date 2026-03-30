package sub_service

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/kweaver-ai/dsg/services/apps/data-application-service/common/errorcode"
	"github.com/kweaver-ai/idrm-go-frame/core/errorx/agerrors"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest/ginx"
)

// httpStatusCodeFromErrorCode 定义错误码到 http 状态码的映射。
var httpStatusCodeFromErrorCode = map[string]int{
	"CodeNil":                   http.StatusOK,
	errorcode.ServiceIDNotExist: http.StatusBadRequest,
	errorcode.SubServiceAlreadyExists.GetCode():   http.StatusConflict,
	errorcode.SubServiceDatabaseError.GetCode():   http.StatusInternalServerError,
	errorcode.SubServiceNotServiceOwner.GetCode(): http.StatusUnauthorized,
	errorcode.SubServiceNotFound.GetCode():        http.StatusNotFound,
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
