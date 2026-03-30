package v1

import (
	"github.com/gin-gonic/gin"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/form_validator"
	_ "github.com/kweaver-ai/dsg/services/apps/data-catalog/common/models/response"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/my_favorite"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest/ginx"
)

type Controller struct {
	mf my_favorite.UseCase
}

func NewController(mf my_favorite.UseCase) *Controller {
	return &Controller{mf: mf}
}

// Create 新增收藏接口
//
//	@Description	新增收藏接口
//	@Tags			服务超市资源收藏管理
//	@Summary		新增收藏接口
//	@Accept			json
//	@Produce		json
//	@Param			Authorization	header		string					true	"token"
//	@Param			_				body		my_favorite.CreateReq	true	"请求参数"
//	@Success		200				{object}	response.IDResp			"成功响应参数"
//	@Failure		400				{object}	rest.HttpError			"失败响应参数"
//	@Router			/api/data-catalog/frontend/v1/favorite [post]
func (controller *Controller) Create(c *gin.Context) {
	var req my_favorite.CreateReq
	if _, err := form_validator.BindJsonAndValid(c, &req); err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to binding req body param in create favorite, err: %v", err)
		form_validator.ReqParamErrorHandle(c, err)
		return
	}

	resp, err := controller.mf.Create(c, &req)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}

// Delete 取消收藏接口
//
//	@Description	取消收藏接口
//	@Tags			服务超市资源收藏管理
//	@Summary		取消收藏接口
//	@Accept			json
//	@Produce		json
//	@Param			Authorization	header		string			true	"token"
//	@Param			favor_id		path		string			true	"收藏项ID"
//	@Success		200				{object}	response.IDResp	"成功响应参数"
//	@Failure		400				{object}	rest.HttpError	"失败响应参数"
//	@Router			/api/data-catalog/frontend/v1/favorite/{favor_id} [delete]
func (controller *Controller) Delete(c *gin.Context) {
	var req my_favorite.FavorIDPathReq
	if _, err := form_validator.BindUriAndValid(c, &req); err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to binding req uri param in delete favor, err: %v", err)
		form_validator.UriParamErrorHandle(c, err)
		return
	}

	resp, err := controller.mf.Delete(c, req.FavorID.Uint64())
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}

// GetList 我的收藏列表接口
//
//	@Description	我的收藏列表接口
//	@Tags			服务超市资源收藏管理
//	@Summary		我的收藏列表接口
//	@Accept			json
//	@Produce		json
//	@Param			Authorization	header		string					true	"token"
//	@Param			req				query		my_favorite.ListReq		true	"请求参数"
//	@Success		200				{object}	my_favorite.ListResp	"成功响应参数"
//	@Failure		400				{object}	rest.HttpError			"失败响应参数"
//	@Router			/api/data-catalog/frontend/v1/favorite [get]
func (controller *Controller) GetList(c *gin.Context) {
	var req my_favorite.ListReq
	if _, err := form_validator.BindQueryAndValid(c, &req); err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to binding req query param in get my favorites, err: %v", err)
		form_validator.ReqParamErrorHandle(c, err)
		return
	}

	resp, err := controller.mf.GetList(c, &req)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}

// CheckIsFavored 资源是否已收藏查询接口
//
//	@Description	资源是否已收藏查询接口
//	@Tags			服务超市资源收藏管理
//	@Summary		资源是否已收藏查询接口
//	@Accept			json
//	@Produce		json
//	@Param			Authorization	header		string					true	"token"
//	@Param			_				query		my_favorite.CheckV2Req	true	"请求参数"
//	@Success		200				{array}		my_favorite.CheckV2Resp	"成功响应参数"
//	@Failure		400				{object}	rest.HttpError			"失败响应参数"
//	@Router			/api/data-catalog/frontend/v1/favorite/check [post]
func (controller *Controller) CheckIsFavored(c *gin.Context) {
	var req my_favorite.CheckV2Req
	if _, err := form_validator.BindJsonAndValid(c, &req); err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to binding req body param in check is favored, err: %v", err)
		form_validator.ReqParamErrorHandle(c, err)
		return
	}

	resp, err := controller.mf.CheckIsFavoredV2(c, &req)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}

// CheckIsFavoredByResID 当前资源是否已收藏查询接口
//
//	@Description	资源是否已收藏查询接口
//	@Tags			服务超市资源收藏管理
//	@Summary		资源是否已收藏查询接口
//	@Accept			json
//	@Produce		json
//	@Param			Authorization	header		string					true	"token"
//	@Param			_				query		my_favorite.CheckV2Req	true	"请求参数"
//	@Success		200				{array}		my_favorite.CheckV2Resp	"成功响应参数"
//	@Failure		400				{object}	rest.HttpError			"失败响应参数"
//	@Router			/api/data-catalog/frontend/v1/favorite/check [post]
func (controller *Controller) CheckIsFavoredByResID(c *gin.Context) {
	var req my_favorite.CheckV1Req
	if _, err := form_validator.BindJsonAndValid(c, &req); err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to binding req body param in check is favored, err: %v", err)
		form_validator.ReqParamErrorHandle(c, err)
		return
	}

	resp, err := controller.mf.CheckIsFavoredV1(c, &req)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}
