package v1

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/data_assets"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest/ginx"
)

type Controller struct {
	da *data_assets.DataAssetsDomain
}

func NewController(da *data_assets.DataAssetsDomain) *Controller {
	return &Controller{da: da}
}

// Count 统计数据资产
//
//	@Description	统计数据资产
//	@Tags			数据资产全景
//	@Summary		统计数据资产
//	@Accept			application/json
//	@Produce		application/json
//	@Success		200	{object}	map[string]any	"成功响应参数"
//	@Failure		400	{object}	rest.HttpError	"失败响应参数"
//	@Router			/api/internal/data-catalog/v1/data-assets/count [get]
func (controller *Controller) Count(c *gin.Context) {
	token, err := controller.da.GetToken(c)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	go controller.da.DataAssetsCount(token)
	go controller.da.BusinessLogicEntityInfo(token)
	go controller.da.DepartmentBusinessLogicEntityInfo(token)
	go controller.da.StandardizedRateInfo(token)
	ginx.ResOKJson(c, nil)
}
