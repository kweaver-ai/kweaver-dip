package v1

import (
	"github.com/gin-gonic/gin"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/form_validator"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/catalog_feedback"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest/ginx"
)

type Controller struct {
	cf catalog_feedback.UseCase
}

func NewController(cf catalog_feedback.UseCase) *Controller {
	return &Controller{cf: cf}
}

// Create 目录反馈创建
//
//	@Description	目录反馈创建
//	@Tags			资源目录反馈管理
//	@Summary		目录反馈创建
//	@Accept			json
//	@Produce		json
//	@Param			Authorization	header		string						true	"token"
//	@Param			_				body		catalog_feedback.CreateReq	true	"请求参数"
//	@Success		200				{object}	catalog_feedback.IDResp		"成功响应参数"
//	@Failure		400				{object}	rest.HttpError				"失败响应参数"
//	@Router			/api/data-catalog/v1/data-catalog/feedback [post]
func (controller *Controller) Create(c *gin.Context) {
	var req catalog_feedback.CreateReq
	if _, err := form_validator.BindJsonAndValid(c, &req); err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to binding req body param in create catalog feedback, err: %v", err)
		form_validator.ReqParamErrorHandle(c, err)
		return
	}

	resp, err := controller.cf.Create(c, &req)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}

// Reply 目录反馈回复
//
//	@Description	目录反馈回复
//	@Tags			资源目录反馈管理
//	@Summary		目录反馈回复
//	@Accept			json
//	@Produce		json
//	@Param			Authorization	header		string						true	"token"
//	@Param			feedback_id		path		string						true	"目录反馈ID"
//	@Param			_				body		catalog_feedback.ReplyReq	true	"请求参数"
//	@Success		200				{object}	catalog_feedback.IDResp		"成功响应参数"
//	@Failure		400				{object}	rest.HttpError				"失败响应参数"
//	@Router			/api/data-catalog/v1/data-catalog/feedback/{feedback_id}/reply [put]
func (controller *Controller) Reply(c *gin.Context) {
	var req catalog_feedback.FeedbackIDPathReq
	if _, err := form_validator.BindUriAndValid(c, &req); err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to binding req uri param in reply catalog feedback, err: %v", err)
		form_validator.UriParamErrorHandle(c, err)
		return
	}

	var qReq catalog_feedback.ReplyReq
	if _, err := form_validator.BindJsonAndValid(c, &qReq); err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to binding req body param in reply catalog feedback, err: %v", err)
		form_validator.ReqParamErrorHandle(c, err)
		return
	}

	resp, err := controller.cf.Reply(c, req.FeedbackID.Uint64(), &qReq)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}

// GetDetail 目录反馈详情
//
//	@Description	目录反馈详情
//	@Tags			资源目录反馈管理
//	@Summary		目录反馈详情
//	@Accept			json
//	@Produce		json
//	@Param			Authorization	header		string						true	"token"
//	@Param			feedback_id		path		string						true	"目录反馈ID"
//	@Success		200				{object}	catalog_feedback.DetailResp	"成功响应参数"
//	@Failure		400				{object}	rest.HttpError				"失败响应参数"
//	@Router			/api/data-catalog/v1/data-catalog/feedback/{feedback_id} [get]
func (controller *Controller) GetDetail(c *gin.Context) {
	var req catalog_feedback.FeedbackIDPathReq
	if _, err := form_validator.BindUriAndValid(c, &req); err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to binding req uri param in get catalog feedback detail, err: %v", err)
		form_validator.UriParamErrorHandle(c, err)
		return
	}

	resp, err := controller.cf.GetDetail(c, req.FeedbackID.Uint64())
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}

// GetList 目录反馈列表
//
//	@Description	目录反馈列表
//	@Tags			资源目录反馈管理
//	@Summary		目录反馈列表
//	@Accept			json
//	@Produce		json
//	@Param			Authorization	header		string						true	"token"
//	@Param			_				query		catalog_feedback.ListReq	true	"请求参数"
//	@Success		200				{object}	catalog_feedback.ListResp[catalog_feedback.ListItem]	"成功响应参数"
//	@Failure		400				{object}	rest.HttpError				"失败响应参数"
//	@Router			/api/data-catalog/v1/data-catalog/feedback [get]
func (controller *Controller) GetList(c *gin.Context) {
	var req catalog_feedback.ListReq
	if _, err := form_validator.BindQueryAndValid(c, &req); err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to binding req query param in get catalog feedback list, err: %v", err)
		form_validator.ReqParamErrorHandle(c, err)
		return
	}

	resp, err := controller.cf.GetList(c, &req)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}

// GetCount 目录反馈统计
//
//	@Description	目录反馈统计
//	@Tags			资源目录反馈管理
//	@Summary		目录反馈统计
//	@Accept			json
//	@Produce		json
//	@Param			Authorization	header		string						true	"token"
//	@Success		200				{object}	catalog_feedback.CountResp	"成功响应参数"
//	@Failure		400				{object}	rest.HttpError				"失败响应参数"
//	@Router			/api/data-catalog/v1/data-catalog/feedback/count [get]
func (controller *Controller) GetCount(c *gin.Context) {
	resp, err := controller.cf.GetCount(c)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}
