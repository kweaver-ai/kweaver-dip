package v1

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/models/response"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/data_assets"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest/ginx"
)

type Controller struct {
	da *data_assets.DataAssetsDomain
}

func NewController(da *data_assets.DataAssetsDomain) *Controller {
	return &Controller{da: da}
}

// GetDataAssetsCount 获取数据资产L1-L5数量
//
//	@Description	获取数据资产L1-L5数量
//	@Tags			数据资产全景
//	@Summary		获取数据资产L1-L5数量
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string						true	"token"
//	@Success		200				{object}	data_assets.DataAssetsResp	"成功响应参数"
//	@Failure		400				{object}	rest.HttpError				"失败响应参数"
//	@Router			/api/data-catalog/frontend/v1/data-assets/count [get]
func (controller *Controller) GetDataAssetsCount(c *gin.Context) {
	resp, err := controller.da.GetDataAssetsCount(c)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}

// GetBusinessLogicEntityInfo 获取业务逻辑实体分布信息(业务域视角)
//
//	@Description	获取业务逻辑实体分布信息(业务域视角)
//	@Tags			数据资产全景
//	@Summary		获取业务逻辑实体分布信息(业务域视角)
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string														true	"token"
//	@Success		200				{object}	response.PageResult[data_assets.BusinessLogicEntityInfo]	"成功响应参数"
//	@Failure		400				{object}	rest.HttpError												"失败响应参数"
//	@Router			/api/data-catalog/frontend/v1/data-assets/business-domain/business-logic-entity [get]
func (controller *Controller) GetBusinessLogicEntityInfo(c *gin.Context) {
	data, totalCount, err := controller.da.GetBusinessLogicEntityInfo(c)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c,
		response.PageResult[data_assets.BusinessLogicEntityInfo]{
			TotalCount: totalCount,
			Entries:    data})
}

// GetDepartmentBusinessLogicEntityInfo 获取业务逻辑实体分布信息(部门视角)
//
//	@Description	获取业务逻辑实体分布信息(部门视角)
//	@Tags			数据资产全景
//	@Summary		获取业务逻辑实体分布信息(部门视角)
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string																true	"token"
//	@Success		200				{object}	response.PageResult[data_assets.DepartmentBusinessLogicEntityInfo]	"成功响应参数"
//	@Failure		400				{object}	rest.HttpError														"失败响应参数"
//	@Router			/api/data-catalog/frontend/v1/data-assets/department/business-logic-entity [get]
func (controller *Controller) GetDepartmentBusinessLogicEntityInfo(c *gin.Context) {
	data, totalCount, err := controller.da.GetDepartmentBusinessLogicEntityInfo(c)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c,
		response.PageResult[data_assets.DepartmentBusinessLogicEntityInfo]{
			TotalCount: totalCount,
			Entries:    data})
}

// GetStandardizedRate 获取数据标准化率
//
//	@Description	获取数据标准化率
//	@Tags			数据资产全景
//	@Summary		获取数据标准化率
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string								true	"token"
//	@Success		200				{array}		data_assets.StandardizedRateResp	"成功响应参数"
//	@Failure		400				{object}	rest.HttpError						"失败响应参数"
//	@Router			/api/data-catalog/frontend/v1/data-assets/standardized-rate [get]
func (controller *Controller) GetStandardizedRate(c *gin.Context) {
	resp, err := controller.da.GetStandardizedRate(c)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}
