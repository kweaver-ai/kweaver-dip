package v1

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/form_validator"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/frontend/data_resource"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest/ginx"
)

// Search 请求的参数
type SearchRequest struct {
	Keyword  string                 `json:"keyword,omitempty" binding:"TrimSpace,omitempty,min=1" example:"keyword"` // 关键字查询
	Filter   data_resource.Filter   `json:"filter,omitempty"`                                                        // 搜索的过滤器
	NextFlag data_resource.NextFlag `json:"next_flag,omitempty"`                                                     // 从该flag标志后获取数据，该flag标志由上次的搜索请求返回，若本次与上次的搜索参数存在变动，则该参数不能传入，否则结果不准确
}

// SearchForOper 请求的参数
type SearchForOperRequest struct {
	Keyword  string                      `json:"keyword,omitempty" binding:"TrimSpace,omitempty,min=1" example:"keyword"`
	Filter   data_resource.FilterForOper `json:"filter,omitempty"`
	NextFlag data_resource.NextFlag      `json:"next_flag,omitempty"`
}

// Search 搜索数据资源(普通用户视角)
//
//	@Description	数据资源搜索接口(普通用户视角)
//	@Tags			open数据服务超市
//	@Summary		(普通用户视角)搜索所有数据资源（逻辑视图、接口服务及指标）
//	@Accept			application/json
//	@Produce		application/json
//	@Param			_	body		SearchRequest				true	"请求参数"
//	@Success		200	{object}	data_resource.SearchResult	"成功响应参数"
//	@Failure		400	{object}	rest.HttpError				"失败响应参数"
//	@Router			/api/data-catalog/frontend/v1/data-resources/search [post]
func (ctrl *Controller) Search(c *gin.Context) {
	log := log.WithContext(c)

	req := &SearchRequest{}
	if err := c.ShouldBindJSON(req); err != nil {
		log.Error("bind request body fail", zap.Error(err))
		form_validator.ReqParamErrorHandle(c, err)
		return
	}

	// 校验 request 参数
	if err := ValidateSearchRequest(req, nil); err != nil {
		log.Error("invalid search request", zap.Error(err))
		ginx.ResErrJsonWithCode(c, http.StatusBadRequest, errorcode.Detail(errorcode.PublicInvalidParameter, err))
		return
	}

	result, err := ctrl.domain.Search(c, req.Keyword, req.Filter, req.NextFlag)
	if err != nil {
		ginx.ResErrJsonWithCode(c, http.StatusInternalServerError, err)
		return
	}

	ginx.ResOKJson(c, result)
}

// SearchForOper 搜索数据资源(运营视角)
//
//	@Description	数据资源搜索接口(运营视角)
//	@Tags			数据服务超市
//	@Summary		(运营视角)搜索所有数据资源（逻辑视图、接口服务及指标）
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string						true	"token"
//	@Param			_				body		SearchForOperRequest		true	"请求参数"
//	@Success		200				{object}	data_resource.SearchResult	"成功响应参数"
//	@Failure		400				{object}	rest.HttpError				"失败响应参数"
//	@Router			/api/data-catalog/frontend/v1/data-resources/searchForOper [post]
func (ctrl *Controller) SearchForOper(c *gin.Context) {
	log := log.WithContext(c)

	req := &SearchForOperRequest{}
	if err := c.ShouldBindJSON(req); err != nil {
		log.Error("bind request body fail", zap.Error(err))
		form_validator.ReqParamErrorHandle(c, err)
		return
	}

	// 校验 request 参数
	if err := ValidateSearchForOperRequest(req, nil); err != nil {
		log.Error("invalid search request", zap.Error(err))
		ginx.ResErrJsonWithCode(c, http.StatusBadRequest, errorcode.Detail(errorcode.PublicInvalidParameter, err))
		return
	}

	result, err := ctrl.domain.SearchForOper(c, req.Keyword, req.Filter, req.NextFlag)
	if err != nil {
		ginx.ResErrJsonWithCode(c, http.StatusInternalServerError, err)
		return
	}

	ginx.ResOKJson(c, result)
}
