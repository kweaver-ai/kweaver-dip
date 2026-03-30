package v1

import (
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/frontend/data_catalog"
)

type Controller struct {
	dc *data_catalog.DataCatalogDomain
}

func NewController(dc *data_catalog.DataCatalogDomain) *Controller {
	return &Controller{dc: dc}
}

/*
// GetDataCatalogDetail 查询数据资源目录详情V2
// @Description 查询数据资源目录详情V2
// @Tags        数据服务超市
// @Summary     查询数据资源目录详情V2
// @Accept      json
// @Produce     json
// @Param       Authorization     header   string                    true "token"
// @Param       catalogID path     uint64               true "目录ID" default(1)
// @Success     200       {object} data_catalog.CatalogDetailResp    "成功响应参数"
// @Failure     400       {object} rest.HttpError            "失败响应参数"
// @Router      /api/data-catalog/frontend/v2/data-catalog/{catalogID} [get]
func (controller *Controller) GetDataCatalogDetail(c *gin.Context) {
	var p data_catalog.ReqPathParams
	if _, err := form_validator.BindUriAndValid(c, &p); err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to binding req uri param in get catalog detail, err: %v", err)
		form_validator.UriParamErrorHandle(c, err)
		return
	}

	data, err := controller.dc.GetDetailV2(c, p.CatalogID.Uint64())
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, data)
}
*/
