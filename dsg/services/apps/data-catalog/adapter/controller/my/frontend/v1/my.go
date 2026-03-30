package v1

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/form_validator"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/models/response"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/frontend/my"
	myRepo "github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/my"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest/ginx"
)

type Controller struct {
	my *my.Domain
}

func NewController(my *my.Domain) *Controller {
	return &Controller{my: my}
}

// GetMyApplyList 数据目录-我的资产申请列表
//
//	@Description	数据目录-我的资产申请列表
//	@Tags			我的前台接口
//	@Summary		数据目录-我的资产申请列表
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string							true	"token"
//	@Param			_				query		myRepo.AssetApplyListReqParam	true	"查询参数"
//	@Success		200				{object}	myRepo.AssetApplyListRespItem	"成功响应参数"
//	@Failure		400				{object}	rest.HttpError					"失败响应参数"
//	@Router			/api/data-catalog/frontend/v1/my/data-catalog/apply [get]
func (controller *Controller) GetMyApplyList(c *gin.Context) {
	var req myRepo.AssetApplyListReqParam
	if _, err := form_validator.BindQueryAndValid(c, &req); err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to binding req query param in get my apply list, err: %v", err)
		form_validator.ReqParamErrorHandle(c, err)
		return
	}

	data, totalCount, err := controller.my.GetMyApplyList(nil, c, &req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c,
		response.PageResult[myRepo.AssetApplyListRespItem]{
			TotalCount: totalCount,
			Entries:    data})
}

// GetApplyDetail 数据目录-资产申请详情
//
//	@Description	数据目录-资产申请详情
//	@Tags			我的前台接口
//	@Summary		数据目录-资产申请详情
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string						true	"token"
//	@Param			applyID			path		uint64						true	"申请ID"	default(1)
//	@Success		200				{object}	myRepo.AssetApplyDetailResp	"成功响应参数"
//	@Failure		400				{object}	rest.HttpError				"失败响应参数"
//	@Router			/api/data-catalog/frontend/v1/my/data-catalog/apply/{applyID} [get]
func (controller *Controller) GetApplyDetail(c *gin.Context) {
	var p myRepo.AssetApplyDetailReqParam
	if _, err := form_validator.BindUriAndValid(c, &p); err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to binding req uri param in get my apply detail, err: %v", err)
		form_validator.UriParamErrorHandle(c, err)
		return
	}

	data, err := controller.my.GetApplyDetail(nil, c, p.ApplyId.Uint64())
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, data)
}

/*
// GetAvailableAssetList 数据目录-我的可用资产列表
// @Description 数据目录-我的可用资产列表
// @Tags        我的前台接口
// @Summary     数据目录-我的可用资产列表
// @Accept		application/json
// @Produce		application/json
// @Param       Authorization header     string                    true "token"
// @Param       _     query    myRepo.AvailableAssetListReqParam true "查询参数"
// @Success     200   {object} myRepo.AvailableAssetListRespItem    "成功响应参数"
// @Failure     400   {object} rest.HttpError            "失败响应参数"
// @Router      /api/data-catalog/frontend/v1/my/data-catalog/available-assets [get]
func (controller *Controller) GetAvailableAssetList(c *gin.Context) {
	var req myRepo.AvailableAssetListReqParam
	if _, err := form_validator.BindQueryAndValid(c, &req); err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to binding req query param in get my available-asset list, err: %v", err)
		form_validator.ReqParamErrorHandle(c, err)
		return
	}

	data, totalCount, err := controller.my.GetAvailableAssetList(nil, c, &req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c,
		response.PageResult[myRepo.AvailableAssetListRespItem]{
			TotalCount: totalCount,
			Entries:    data})
}

// GetAvailableAssetDetail 数据目录-根据数据目录ID，如果为可用数据目录资产则返回
// @Description 数据目录-根据数据目录ID，如果为可用数据目录资产则返回
// @Tags        我的前台接口
// @Summary     数据目录-根据数据目录ID，如果为可用数据目录资产则返回
// @Accept		application/json
// @Produce		application/json
// @Param       Authorization     header   string                    true "token"
// @Param       assetID path     uint64               true "目录ID" default(1)
// @Success     200       {object} myRepo.AvailableAssetListRespItem    "成功响应参数"
// @Failure     400       {object} rest.HttpError            "失败响应参数"
// @Router      /api/data-catalog/frontend/v1/my/data-catalog/available-assets/{assetID} [get]
func (controller *Controller) GetAvailableAssetDetail(c *gin.Context) {
	var p myRepo.AssetReqPathParam
	if _, err := form_validator.BindUriAndValid(c, &p); err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to binding req uri param in get my available asset detail, err: %v", err)
		form_validator.UriParamErrorHandle(c, err)
		return
	}

	data, err := controller.my.GetAvailableAssetDetail(nil, c, p.AssetID.Uint64())
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, data)
}
*/
