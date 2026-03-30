package v1

import (
	"github.com/gin-gonic/gin"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/form_validator"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/models/response"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/data_resource"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/data_resource/impl"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest/ginx"
)

var _ *response.IDResp

type Controller struct {
	d *impl.DataResourceDomain
}

func NewController(dataResourceDomain *impl.DataResourceDomain) *Controller {
	return &Controller{d: dataResourceDomain}
}

// GetCount
//
//	@Description	统计数量
//	@Tags			数据资源目录管理
//	@Summary		统计数量
//	@Accept			application/json
//	@Produce		application/json
//	@Param			_				query		data_resource.GetCountReq	true	"请求参数"
//	@Success		200				{object}	data_resource.GetCountRes		"成功响应参数"
//	@Failure		400				{object}	rest.HttpError						"失败响应参数"
//	@Router			/api/data-catalog/v1/data-catalog/data-resource [get]
func (controller *Controller) GetCount(c *gin.Context) {
	var req data_resource.GetCountReq
	if _, err := form_validator.BindQueryAndValid(c, &req); err != nil {
		form_validator.ReqParamErrorHandle(c, err)
		return
	}
	resp, err := controller.d.GetCount(c, &req)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}

// DataResourceList 数据资源列表-待编目
//
//	@Description	数据资源列表-待编目
//	@Tags			数据资源目录管理
//	@Summary		数据资源列表-待编目
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string								true	"token"
//	@Param			_				query		data_resource.DataResourceInfoReq	true	"请求参数"
//	@Success		200				{object}	data_resource.DataResourceRes		"成功响应参数"
//	@Failure		400				{object}	rest.HttpError						"失败响应参数"
//	@Router			/api/data-catalog/v1/data-catalog/data-resource [get]
func (controller *Controller) DataResourceList(c *gin.Context) {
	var req data_resource.DataResourceInfoReq
	if _, err := form_validator.BindQueryAndValid(c, &req); err != nil {
		form_validator.ReqParamErrorHandle(c, err)
		return
	}
	if req.PublishAtStart != nil && req.PublishAtEnd != nil && *req.PublishAtStart >= *req.PublishAtEnd {
		ginx.ResBadRequestJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, "publish_at_start must less publish_at_end"))
		return
	}

	resp, err := controller.d.GetDataResourceList(c, &req)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}

// DataPushResourceList 已发布目录的元数据视图列表
// @Description  已经挂在已发布的数据资源目录上的逻辑视图
// @Tags        数据资源目录管理2
// @Summary     已发布目录的元数据视图列表
// @Accept		text/plain
// @Produce		application/json
// @Param       _     query      data_resource.DataCatalogResourceListReq  true "请求参数"
// @Success     200   {object}   response.PageResult[data_resource.DataCatalogResourceListObject]    "成功响应参数"
// @Failure     400   {object}   rest.HttpError            "失败响应参数"
// @Router      /api/data-catalog/v1/data-catalog/data-resource [get]
func (controller *Controller) DataPushResourceList(c *gin.Context) {
	var req data_resource.DataCatalogResourceListReq
	if _, err := form_validator.BindQueryAndValid(c, &req); err != nil {
		form_validator.ReqParamErrorHandle(c, err)
		return
	}
	resp, err := controller.d.QueryDataCatalogResourceList(c, &req)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}
