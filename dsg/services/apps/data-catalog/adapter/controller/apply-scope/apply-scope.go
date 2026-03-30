package apply_scope

import (
	"net/http"

	"github.com/gin-gonic/gin"
	apply_scope "github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/apply-scope"
	_ "github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest/ginx"
)

type Controller struct {
	as apply_scope.ApplyScopeUseCase
}

func NewController(as apply_scope.ApplyScopeUseCase) *Controller {
	return &Controller{as: as}
}

// AllList 获取所有应用范围
// @Description 获取所有应用范围
// @Tags        应用范围
// @Summary     获取所有应用范围
// @Accept      application/json
// @Produce     application/json
// @Param       Authorization header   string    true "token"
// @Success     200       {array} model.ApplyScope    "成功响应参数"
// @Failure     400       {object} rest.HttpError         "失败响应参数"
// @Router      /api/data-catalog/v1/apply-scope [GET]
func (controller *Controller) AllList(c *gin.Context) {
	resp, err := controller.as.AllList(c)
	if err != nil {
		log.WithContext(c.Request.Context()).Error(err.Error())
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}
