package v1

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest/ginx"
)

// ExpiredAccessClear 标记已失效的用户下载权限
//
//	@Description	标记已失效的用户下载权限
//	@Tags			业务对象前台接口
//	@Summary		标记已失效的用户下载权限
//	@Accept			application/json
//	@Produce		application/json
//	@Success		200	{object}	map[string]any	"成功响应参数"
//	@Failure		400	{object}	rest.HttpError	"失败响应参数"
//	@Router			/api/internal/data-catalog/v1/business-object/download-access [put]
func (controller *Controller) ExpiredAccessClear(c *gin.Context) {
	err := controller.dc.ExpiredAccessClear(c)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, nil)
}
