package v1

import (
	"fmt"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/form_validator"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/models/request"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/res_feedback"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest/ginx"
)

type Controller struct {
	cf res_feedback.UseCase
}

func NewController(cf res_feedback.UseCase) *Controller {
	return &Controller{cf: cf}
}

// cleanResIDInResponse 清理响应中res_id字段的双重转义
func (controller *Controller) cleanResIDInResponse(resp interface{}) {
	switch v := resp.(type) {
	case *res_feedback.ListResp:
		controller.cleanListResp(v)
	case *res_feedback.DetailResp:
		controller.cleanDetailResp(v)
	}
}

// cleanListResp 清理ListResp中的res_id字段
func (controller *Controller) cleanListResp(resp *res_feedback.ListResp) {
	if resp == nil || resp.Entries == nil {
		return
	}

	for _, entry := range resp.Entries {
		if entry != nil {
			entry.CatalogID = controller.cleanResIDValue(entry.CatalogID)
		}
	}
}

// cleanDetailResp 清理DetailResp中的res_id字段
func (controller *Controller) cleanDetailResp(resp *res_feedback.DetailResp) {
	if resp == nil || resp.BasicInfo == nil {
		return
	}

	resp.BasicInfo.CatalogID = controller.cleanResIDValue(resp.BasicInfo.CatalogID)
}

// cleanResIDValue 清理单个res_id值
func (controller *Controller) cleanResIDValue(value string) string {
	if value == "" {
		return value
	}

	originalValue := value

	// 移除开头和结尾的双引号
	cleaned := strings.Trim(value, `"`)

	// 如果清理后的值仍然包含转义的双引号，继续清理
	if strings.HasPrefix(cleaned, `\"`) && strings.HasSuffix(cleaned, `\"`) {
		cleaned = strings.TrimPrefix(cleaned, `\"`)
		cleaned = strings.TrimSuffix(cleaned, `\"`)
	}

	// 如果值发生了变化，记录日志
	if cleaned != originalValue {
		log.WithContext(nil).Infof("清理res_id值: %s -> %s", originalValue, cleaned)
	}

	return cleaned
}

// Create 目录反馈创建
//
//	@Description	目录反馈创建
//	@Tags			资源目录反馈管理
//	@Summary		目录反馈创建
//	@Accept			json
//	@Produce		json
//	@Param			Authorization	header		string						true	"token"
//	@Param			_				body		res_feedback.CreateReq	true	"请求参数"
//	@Success		200				{object}	res_feedback.IDResp		"成功响应参数"
//	@Failure		400				{object}	rest.HttpError				"失败响应参数"
//	@Router			/api/data-catalog/frontend/v1/feedback [post]
func (controller *Controller) Create(c *gin.Context) {
	var req res_feedback.CreateReq
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
//	@Param			_				body		res_feedback.ReplyReq	true	"请求参数"
//	@Success		200				{object}	res_feedback.IDResp		"成功响应参数"
//	@Failure		400				{object}	rest.HttpError				"失败响应参数"
//	@Router			/api/data-catalog/frontend/v1/feedback/{feedback_id}/reply [put]
func (controller *Controller) Reply(c *gin.Context) {
	var req res_feedback.FeedbackIDPathReq
	if _, err := form_validator.BindUriAndValid(c, &req); err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to binding req uri param in reply catalog feedback, err: %v", err)
		form_validator.UriParamErrorHandle(c, err)
		return
	}

	var qReq res_feedback.ReplyReq
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
//	@Success		200				{object}	res_feedback.DetailResp	"成功响应参数"
//	@Failure		400				{object}	rest.HttpError				"失败响应参数"
//	@Router			/api/data-catalog/frontend/v1/feedback/{feedback_id} [get]
func (controller *Controller) GetDetail(c *gin.Context) {
	var req res_feedback.FeedbackIDPathReq
	if _, err := form_validator.BindUriAndValid(c, &req); err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to binding req uri param in get catalog feedback detail, err: %v", err)
		form_validator.UriParamErrorHandle(c, err)
		return
	}

	// 添加参数验证
	if req.ResType == "" {
		log.WithContext(c.Request.Context()).Errorf("res_type is empty in get catalog feedback detail")
		ginx.ResBadRequestJson(c, fmt.Errorf("res_type cannot be empty"))
		return
	}

	resp, err := controller.cf.GetDetail(c, req.FeedbackID.Uint64(), req.ResType)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}

	// 清理响应中res_id字段的双重转义
	controller.cleanResIDInResponse(resp)

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
//	@Param			_				query		res_feedback.ListReq	true	"请求参数"
//	@Success		200				{object}	res_feedback.ListResp[res_feedback.ListItem]	"成功响应参数"
//	@Failure		400				{object}	rest.HttpError				"失败响应参数"
//	@Router			/api/data-catalog/frontend/v1/feedback [get]
func (controller *Controller) GetList(c *gin.Context) {
	var req res_feedback.ListReq
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

	// 清理响应中res_id字段的双重转义
	controller.cleanResIDInResponse(resp)

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
//	@Success		200				{object}	res_feedback.CountResp	"成功响应参数"
//	@Failure		400				{object}	rest.HttpError				"失败响应参数"
//	@Router			/api/data-catalog/frontend/v1/feedback/count [get]
func (controller *Controller) GetCount(c *gin.Context) {
	// 获取当前登录用户信息
	uInfo := request.GetUserInfo(c)

	resp, err := controller.cf.GetCount(c, uInfo.ID)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}
