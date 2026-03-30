package v1

import (
	"github.com/gin-gonic/gin"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/errorcode"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest/ginx"
)

// response writes http response
func response(c *gin.Context, data any, err error) {
	if err != nil {
		if !errorcode.IsErrorCode(err) {
			err = errorcode.Detail(errorcode.PublicInternalError, err.Error())
		}
		ginx.ResErrJsonWithCode(c, errorcode.GetCodeGenerationRuleErrorHTTPStatusCode(err), err)
		return
	}

	ginx.ResOKJson(c, data)
	return
}
