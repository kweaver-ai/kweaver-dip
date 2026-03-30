package audit_process_bind

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/kweaver-ai/dsg/services/apps/data-application-service/common/dto"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/common/form_validator"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/domain"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest/ginx"
)

type AuditProcessBindController struct {
	domain *domain.AuditProcessBindDomain
}

func NewAuditProcessBindController(d *domain.AuditProcessBindDomain) *AuditProcessBindController {
	return &AuditProcessBindController{domain: d}
}

// AuditProcessBindCreate 审核流程绑定创建
//
//	@Description	审核流程绑定创建
//	@Tags			审核流程绑定
//	@Summary		审核流程绑定创建
//	@Accept			json
//	@Produce		json
//	@Param			_	body		dto.AuditProcessBindCreateReq	true	"请求参数"
//	@Success		200	{object}	rest.HttpError					"成功响应参数"
//	@Failure		400	{object}	rest.HttpError					"失败响应参数"
//	@Router			/api/data-application-service/v1/audit-process [post]
func (s *AuditProcessBindController) AuditProcessBindCreate(c *gin.Context) {
	req := &dto.AuditProcessBindCreateReq{}

	_, err := form_validator.BindJsonAndValid(c, req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		if errors.As(err, &form_validator.ValidErrors{}) {
			ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
			return
		}

		ginx.ResErrJson(c, errorcode.Desc(errorcode.PublicRequestParameterError))
		return
	}

	err = s.domain.AuditProcessBindCreate(c, req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}

	ginx.ResOKJson(c, errorcode.Success)
}

// AuditProcessBindList 审核流程绑定列表
//
//	@Description	审核流程绑定列表
//	@Tags			审核流程绑定
//	@Summary		审核流程绑定列表
//	@Accept			json
//	@Produce		json
//	@Param			_	query		dto.AuditProcessBindListReq	true	"请求参数"
//	@Success		200	{object}	dto.AuditProcessBindListRes	"成功响应参数"
//	@Failure		400	{object}	rest.HttpError				"失败响应参数"
//	@Router			/api/data-application-service/v1/audit-process [get]
func (s *AuditProcessBindController) AuditProcessBindList(c *gin.Context) {
	req := &dto.AuditProcessBindListReq{}

	_, err := form_validator.BindQueryAndValid(c, req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		if errors.As(err, &form_validator.ValidErrors{}) {
			ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
			return
		}

		ginx.ResErrJson(c, errorcode.Desc(errorcode.PublicRequestParameterError))
		return
	}

	if req.Sort == "" {
		req.Sort = "create_time"
	}

	if req.Direction == "" {
		req.Direction = "desc"
	}

	resp, err := s.domain.AuditProcessBindList(c, req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}

	ginx.ResOKJson(c, resp)
}

// AuditProcessBindGet 审核流程绑定详情
//
//	@Description	审核流程绑定详情
//	@Tags			审核流程绑定
//	@Summary		审核流程绑定详情
//	@Accept			json
//	@Produce		json
//	@Param			bind_id	path		string						true	"绑定id"
//	@Success		200		{object}	dto.AuditProcessBindGetRes	"成功响应参数"
//	@Failure		400		{object}	rest.HttpError				"失败响应参数"
//	@Router			/api/data-application-service/v1/audit-process/{bind_id} [get]
func (s *AuditProcessBindController) AuditProcessBindGet(c *gin.Context) {
	req := &dto.AuditProcessBindGetReq{}

	_, err := form_validator.BindUriAndValid(c, req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		if errors.As(err, &form_validator.ValidErrors{}) {
			ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
			return
		}

		ginx.ResErrJson(c, errorcode.Desc(errorcode.PublicRequestParameterError))
		return
	}

	resp, err := s.domain.AuditProcessBindGet(c, req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}

	ginx.ResOKJson(c, resp)
}

// AuditProcessBindUpdate 审核流程绑定更新
//
//	@Description	审核流程绑定更新
//	@Tags			审核流程绑定
//	@Summary		审核流程绑定更新
//	@Accept			json
//	@Produce		json
//	@Param			bind_id	path		string								true	"绑定id"
//	@Param			_		body		dto.AuditProcessBindUpdateBodyReq	true	"请求参数"
//	@Success		200		{object}	rest.HttpError						"成功响应参数"
//	@Failure		400		{object}	rest.HttpError						"失败响应参数"
//	@Router			/api/data-application-service/v1/audit-process/{bind_id} [put]
func (s *AuditProcessBindController) AuditProcessBindUpdate(c *gin.Context) {
	req := &dto.AuditProcessBindUpdateReq{}

	_, err := form_validator.BindUriAndValid(c, &req.AuditProcessBindUpdateUriReq)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		if errors.As(err, &form_validator.ValidErrors{}) {
			ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
			return
		}

		ginx.ResErrJson(c, errorcode.Desc(errorcode.PublicRequestParameterError))
		return
	}

	_, err = form_validator.BindJsonAndValid(c, &req.AuditProcessBindUpdateBodyReq)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		if errors.As(err, &form_validator.ValidErrors{}) {
			ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
			return
		}

		ginx.ResErrJson(c, errorcode.Desc(errorcode.PublicRequestParameterError))
		return
	}

	err = s.domain.AuditProcessBindUpdate(c, req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}

	ginx.ResOKJson(c, errorcode.Success)
}

// AuditProcessBindDelete 审核流程绑定删除
//
//	@Description	审核流程绑定删除
//	@Tags			审核流程绑定
//	@Summary		审核流程绑定删除
//	@Accept			json
//	@Produce		json
//	@Param			bind_id	path		string			true	"绑定id"
//	@Success		200		{object}	rest.HttpError	"成功响应参数"
//	@Failure		400		{object}	rest.HttpError	"失败响应参数"
//	@Router			/api/data-application-service/v1/audit-process/{bind_id} [delete]
func (s *AuditProcessBindController) AuditProcessBindDelete(c *gin.Context) {
	req := &dto.AuditProcessBindDeleteReq{}

	_, err := form_validator.BindUriAndValid(c, req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		if errors.As(err, &form_validator.ValidErrors{}) {
			ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
			return
		}

		ginx.ResErrJson(c, errorcode.Desc(errorcode.PublicRequestParameterError))
		return
	}

	err = s.domain.AuditProcessBindDelete(c, req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}

	ginx.ResOKJson(c, errorcode.Success)
}
