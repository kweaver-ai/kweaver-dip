package form_validator

import (
	"errors"

	"github.com/gin-gonic/gin"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/errorcode"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest/ginx"
)

func ReqParamErrorHandle(c *gin.Context, err error) {
	if errors.As(err, &ValidErrors{}) {
		ginx.ResBadRequestJson(c, errorcode.Detail(errorcode.TaskInvalidParameter, err))
		return
	}

	ginx.ResBadRequestJson(c, errorcode.Desc(errorcode.TaskInvalidParameterJson))
}
