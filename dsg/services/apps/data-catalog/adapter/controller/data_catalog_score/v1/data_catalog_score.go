package v1

import (
	"github.com/gin-gonic/gin"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/form_validator"
	data_catalog_score "github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/data_catalog_score"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest/ginx"
	"github.com/samber/lo"
)

type Controller struct {
	dcs data_catalog_score.DataCatalogScoreDomain
}

func NewController(
	dcs data_catalog_score.DataCatalogScoreDomain,
) *Controller {
	ctl := &Controller{
		dcs: dcs,
	}
	return ctl
}

// CreateDataCatalogScore 添加数据资源目录评分
//
//	@Description	添加数据资源目录评分
//	@Tags			数据资源目录评分管理
//	@Summary		添加数据资源目录评分
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string							true	"token"
//	@Param			catalog_id		path		uint64							true	"目录ID"	default(1)
//	@Param			_				body		data_catalog_score.CatalogScore	true	"请求参数"
//	@Success		200				{object}	data_catalog_score.IDResp		"成功响应参数"
//	@Failure		400				{object}	rest.HttpError					"失败响应参数"
//	@Router			/api/data-catalog/v1/data-catalog/score/{catalog_id} [post]
func (controller *Controller) CreateDataCatalogScore(c *gin.Context) {
	var p data_catalog_score.CatalogIDRequired
	if _, err := form_validator.BindUriAndValid(c, &p); err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to binding req uri param, err: %v", err)
		form_validator.UriParamErrorHandle(c, err)
		return
	}

	var req data_catalog_score.CatalogScore
	if _, err := form_validator.BindJsonAndValid(c, &req); err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to binding req body param, err: %v", err)
		form_validator.ReqParamErrorHandle(c, err)
		return
	}

	resp, err := controller.dcs.CreateDataCatalogScore(c, p.CatalogID.Uint64(), req.Score)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}

// UpdateDataCatalogScore 修改数据资源目录评分
//
//	@Description	修改数据资源目录评分
//	@Tags			数据资源目录评分管理
//	@Summary		修改数据资源目录评分
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string							true	"token"
//	@Param			catalog_id		path		uint64							true	"目录ID"	default(1)
//	@Param			_				body		data_catalog_score.CatalogScore	true	"请求参数"
//	@Success		200				{object}	data_catalog_score.IDResp		"成功响应参数"
//	@Failure		400				{object}	rest.HttpError					"失败响应参数"
//	@Router			/api/data-catalog/v1/data-catalog/score/{catalog_id} [put]
func (controller *Controller) UpdateDataCatalogScore(c *gin.Context) {
	var p data_catalog_score.CatalogIDRequired
	if _, err := form_validator.BindUriAndValid(c, &p); err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to binding req uri param, err: %v", err)
		form_validator.UriParamErrorHandle(c, err)
		return
	}

	var req data_catalog_score.CatalogScore
	if _, err := form_validator.BindJsonAndValid(c, &req); err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to binding req body param, err: %v", err)
		form_validator.ReqParamErrorHandle(c, err)
		return
	}

	resp, err := controller.dcs.UpdateDataCatalogScore(c, p.CatalogID.Uint64(), req.Score)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}

// GetCatalogScoreList 获取数据资源目录评分列表
//
//	@Description	获取当前用户的数据资源目录评分列表
//	@Tags			数据资源目录评分管理
//	@Summary		获取数据资源目录评分列表
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string								true	"token"
//	@Param			_				query		data_catalog_score.PageInfo			true	"请求参数"
//	@Success		200				{object}	data_catalog_score.ScoreListResp	"成功响应参数"
//	@Failure		400				{object}	rest.HttpError						"失败响应参数"
//	@Router			/api/data-catalog/v1/data-catalog/score [get]
func (controller *Controller) GetCatalogScoreList(c *gin.Context) {

	var req data_catalog_score.PageInfo
	if _, err := form_validator.BindQueryAndValid(c, &req); err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to binding req query param, err: %v", err)
		form_validator.ReqParamErrorHandle(c, err)
		return
	}
	if *req.Limit == 0 {
		req.Offset = lo.ToPtr(1)
	}

	resp, err := controller.dcs.GetCatalogScoreList(c, &req)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}

// GetDataCatalogScoreDetail 获取数据资源目录评分详情
//
//	@Description	获取数据资源目录评分详情
//	@Tags			数据资源目录评分管理
//	@Summary		获取数据资源目录评分详情
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string								true	"token"
//	@Param			catalog_id		path		uint64								true	"目录ID"	default(1)
//	@Param			_				query		data_catalog_score.ScoreDetailReq	true	"请求参数"
//	@Success		200				{object}	data_catalog_score.ScoreDetailResp	"成功响应参数"
//	@Failure		400				{object}	rest.HttpError						"失败响应参数"
//	@Router			/api/data-catalog/v1/data-catalog/score/{catalog_id} [get]
func (controller *Controller) GetDataCatalogScoreDetail(c *gin.Context) {
	var p data_catalog_score.CatalogIDRequired
	if _, err := form_validator.BindUriAndValid(c, &p); err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to binding req uri param, err: %v", err)
		form_validator.UriParamErrorHandle(c, err)
		return
	}

	var req data_catalog_score.ScoreDetailReq
	if _, err := form_validator.BindQueryAndValid(c, &req); err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to binding req query param, err: %v", err)
		form_validator.ReqParamErrorHandle(c, err)
		return
	}
	if *req.Limit == 0 {
		req.Offset = lo.ToPtr(1)
	}

	resp, err := controller.dcs.GetDataCatalogScoreDetail(c, p.CatalogID.Uint64(), &req)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}

// GetDataCatalogScoreSummary 获取数据资源目录评分汇总列表
//
//	@Description	获取数据资源目录评分汇总列表
//	@Tags			数据资源目录评分管理
//	@Summary		获取数据资源目录评分汇总列表
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string									true	"token"
//	@Param			_				query		data_catalog_score.CatalogIDsRequired	true	"请求参数"
//	@Success		200				{object}	[]data_catalog_score.ScoreSummaryInfo	"成功响应参数"
//	@Failure		400				{object}	rest.HttpError							"失败响应参数"
//	@Router			/api/data-catalog/v1/data-catalog/score/summary [get]
func (controller *Controller) GetDataCatalogScoreSummary(c *gin.Context) {

	var req data_catalog_score.CatalogIDsRequired
	if _, err := form_validator.BindQueryAndValid(c, &req); err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to binding req query param, err: %v", err)
		form_validator.ReqParamErrorHandle(c, err)
		return
	}

	resp, err := controller.dcs.GetDataCatalogScoreSummary(c, req.CatalogIDs)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}
