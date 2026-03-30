package v1

/*
import (
	"net/http"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/form_validator"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/models/response"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/frontend/data_catalog"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest/ginx"
	"github.com/gin-gonic/gin"
)

// GetTopData 获取top业务逻辑实体数据
// @Description 获取top业务逻辑实体数据
// @Tags        业务对象前台接口
// @Summary     获取top业务逻辑实体数据
// @Accept      json
// @Produce     json
// @Param       Authorization header     string                    true "token"
// @Param       _     query    data_catalog.ReqTopDataParams true "查询参数"
// @Success     200   {object} response.ArrayResult[data_catalog.BusinessObjectItem]    "成功响应参数"
// @Failure     400   {object} rest.HttpError            "失败响应参数"
// @Router      /api/data-catalog/frontend/v1/data-assets/top-data [get]
func (controller *Controller) GetTopData(c *gin.Context) {
	var req data_catalog.ReqTopDataParams
	if _, err := form_validator.BindQueryAndValid(c, &req); err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to binding req query param in get catalog list, err: %v", err)
		form_validator.ReqParamErrorHandle(c, err)
		return
	}

	data, err := controller.dc.GetTopData(c, &req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c,
		response.ArrayResult[data_catalog.BusinessObjectItem]{
			Entries: data})
}
*/
