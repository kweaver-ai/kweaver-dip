package v1

import (
	"net/http"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/data_resource_catalog"

	"github.com/gin-gonic/gin"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/form_validator"
	data_catalog_backend "github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/data_catalog"
	_ "github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/frontend/common"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/frontend/data_catalog"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest/ginx"
	"go.uber.org/zap"
)

type Controller struct {
	dc                  *data_catalog.DataCatalogDomain
	dcb                 *data_catalog_backend.DataCatalogDomain
	dataResourceCatalog data_resource_catalog.DataResourceCatalogDomain
}

func NewController(
	dc *data_catalog.DataCatalogDomain,
	dcb *data_catalog_backend.DataCatalogDomain,
	dataResourceCatalog data_resource_catalog.DataResourceCatalogDomain,
) *Controller {
	return &Controller{
		dc:                  dc,
		dcb:                 dcb,
		dataResourceCatalog: dataResourceCatalog,
	}
}

// Search 请求的参数
type SearchRequest struct {
	Keyword  string                               `json:"keyword,omitempty" binding:"TrimSpace,omitempty,min=1" example:"keyword"` // 关键字的搜索
	Filter   data_catalog.DataCatalogSearchFilter `json:"filter,omitempty"`
	NextFlag data_catalog.NextFlag                `json:"next_flag,omitempty" example:"1,abc"` // 从该flag标志后获取数据，该flag标志由上次的搜索请求返回，若本次与上次的搜索参数存在变动，则该参数不能传入，否则结果不准确
}

// SearchForOper 请求的参数
type SearchForOperRequest struct {
	Keyword  string                                      `json:"keyword,omitempty" binding:"TrimSpace,omitempty,min=1" example:"keyword"`
	Filter   data_catalog.DataCatalogSearchFilterForOper `json:"filter,omitempty"`
	NextFlag data_catalog.NextFlag                       `json:"next_flag,omitempty"`
}

// DataCatalogPreviewHook 摘要信息预览量埋点
//
//	@Description	摘要信息预览量埋点
//	@Tags			open数据服务超市
//	@Summary		摘要信息预览量埋点
//	@Accept			application/json
//	@Produce		application/json
//	@Param			_	path		data_catalog.ReqPathParams	true	"请求参数"
//	@Success		200	{object}	nil							"成功响应参数，成功返回nil"
//	@Failure		400	{object}	rest.HttpError				"失败响应参数"
//	@Router			/api/data-catalog/frontend/v1/data-catalog/{catalogID}/preview-save [post]
func (controller *Controller) DataCatalogPreviewHook(c *gin.Context) {
	var pathParam data_catalog.ReqPathParams
	if _, err := form_validator.BindUriAndValid(c, &pathParam); err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to binding req uri param in DataCatalogPreviewHook, err: %v", err)
		form_validator.UriParamErrorHandle(c, err)
		return
	}

	err := controller.dc.PreviewHook(c, pathParam.CatalogID)
	if err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to PreviewHook, err: %v", err)
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}

	ginx.ResOKJson(c, nil)
}

// SearchDataCatalog 普通用户搜索数据资源目录
//
//	@Description	数据资源目录搜索接口
//	@Tags			open数据服务超市
//	@Summary		数据资源目录的关键词搜索和筛选功能
//	@Accept			application/json
//	@Produce		application/json
//	@Param			_	body		SearchRequest				true	"请求参数"
//	@Success		200	{object}	data_catalog.SearchResult	"成功响应参数"
//	@Failure		400	{object}	rest.HttpError				"失败响应参数"
//	@Router			/api/data-catalog/frontend/v1/data-catalog/search [post]
func (ctl *Controller) SearchDataCatalog(c *gin.Context) {

	log := log.WithContext(c)

	req := &SearchRequest{}

	if _, err := form_validator.BindJsonAndValid(c, &req); err != nil {
		log.Errorf("failed to binding req body param in search catalog, err: %v", err)
		form_validator.ReqParamErrorHandle(c, err)
		return
	}

	// 校验 request 参数
	if err := ValidateSearchRequest(req, nil); err != nil {
		log.Error("invalid search request", zap.Error(err))
		ginx.ResErrJsonWithCode(c, http.StatusBadRequest, errorcode.Detail(errorcode.PublicInvalidParameter, err))
		return
	}
	resp, err := ctl.dc.Search(c, req.Keyword, req.Filter, req.NextFlag)
	if err != nil {
		ginx.ResErrJsonWithCode(c, http.StatusInternalServerError, err)
		return
	}
	ginx.ResOKJson(c, resp)
}

// SearchDataCatalogForOperation 搜索数据目录资源(运营视角)
//
//	@Description	数据资源搜索接口(运营视角)
//	@Tags			数据服务超市
//	@Summary		(运营视角)搜索所有数据资源目录
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string						true	"token"
//	@Param			_				body		SearchForOperRequest		true	"请求参数"
//	@Success		200				{object}	data_catalog.SearchResult	"成功响应参数"
//	@Failure		400				{object}	rest.HttpError				"失败响应参数"
//	@Router			/api/data-catalog/frontend/v1/data-catalog/operation/search [post]
func (ctrl *Controller) SearchDataCatalogForOperation(c *gin.Context) {
	log := log.WithContext(c)

	req := &SearchForOperRequest{}
	// if err := c.ShouldBindJSON(req); err != nil {
	// 	log.Errorf("failed to binding req body param in Operation search catalog, err: %v", err)
	// 	form_validator.ReqParamErrorHandle(c, err)
	// 	return
	// }

	if _, err := form_validator.BindJsonAndValid(c, &req); err != nil {
		log.Errorf("failed to binding req body param in Operation search catalog, err: %v", err)
		form_validator.ReqParamErrorHandle(c, err)
		return
	}

	// 校验 request 参数
	if err := ValidateSearchForOperRequest(req, nil); err != nil {
		log.Error("invalid search request", zap.Error(err))
		ginx.ResErrJsonWithCode(c, http.StatusBadRequest, errorcode.Detail(errorcode.PublicInvalidParameter, err))
		return
	}

	result, err := ctrl.dc.SearchForOper(c, req.Keyword, req.Filter, req.NextFlag)
	if err != nil {
		ginx.ResErrJsonWithCode(c, http.StatusInternalServerError, err)
		return
	}

	ginx.ResOKJson(c, result)
}

// GetDataCatalogDetail 查询数据资源目录详情
//
//	@Description	查询数据资源目录详情
//	@Tags			open数据服务超市
//	@Summary		查询数据资源目录详情
//	@Accept			application/json
//	@Produce		application/json
//	@Param			_	path		data_resource_catalog.CatalogIDRequired		true	"请求参数"
//	@Success		200	{object}	data_resource_catalog.FrontendCatalogDetail	"成功响应参数"
//	@Failure		400	{object}	rest.HttpError								"失败响应参数"
//	@Router			/api/data-catalog/frontend/v1/data-catalog/{catalog_id} [get]
func (controller *Controller) GetDataCatalogDetail(c *gin.Context) {
	var p data_resource_catalog.CatalogIDRequired
	if _, err := form_validator.BindUriAndValid(c, &p); err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to binding req uri param in get catalog detail, err: %v", err)
		form_validator.UriParamErrorHandle(c, err)
		return
	}

	data, err := controller.dataResourceCatalog.FrontendGetDataCatalogDetail(c, p.CatalogID.Uint64())
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, data)
}

// SubGraph 获取当前资产推荐详情-子图谱
//
//	@Description	获取当前资产推荐详情-子图谱接口
//	@Tags			数据服务超市
//	@Summary		认知搜索-子图谱接口
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string								true	"token"
//	@Param			body			body		data_catalog.SubGraphReqBodyParam	true	"请求参数"
//	@Success		200				{object}	data_catalog.SubGraphRespParam		"成功响应参数"
//	@Failure		400				{object}	rest.HttpError						"失败响应参数"
//	@Router			/api/data-catalog/frontend/v1/data-catalog/search/subgraph [post]
func (controller *Controller) SubGraph(c *gin.Context) {

	var body data_catalog.SubGraphReqBodyParam
	if _, err := form_validator.BindJsonAndValid(c, &body); err != nil {
		log.Errorf("failed to binding req body param in search all, err info: %v", err)
		form_validator.ReqParamErrorHandle(c, err)
		return
	}

	resp, err := controller.dc.SubGraph(c, &data_catalog.SubGraphReqParam{SubGraphReqBodyParam: body})
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}
