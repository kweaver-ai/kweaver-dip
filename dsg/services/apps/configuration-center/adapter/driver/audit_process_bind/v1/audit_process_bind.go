package audit_process_bind

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/form_validator"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/user_util"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/audit_process_bind"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	af_trace "github.com/kweaver-ai/idrm-go-frame/core/telemetry/trace"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest/ginx"
)

type Service struct {
	uc audit_process_bind.AuditProcessBindUseCase
}

func NewService(uc audit_process_bind.AuditProcessBindUseCase) *Service {
	return &Service{
		uc: uc,
	}
}

// AuditProcessBindCreate 审核流程绑定创建
//
//	@Description	审核流程绑定创建
//	@Tags			审核流程绑定
//	@Summary		审核流程绑定创建
//	@Accept			json
//	@Produce		json
//	@Param			_	body		audit_process_bind.CreateReqBody	true	"请求参数"
//	@Success		200	bool	true					"成功响应参数"
//	@Failure		400	{object}	rest.HttpError					"失败响应参数"
//	@Router			/audit-process [post]
func (s *Service) AuditProcessBindCreate(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	req := &audit_process_bind.CreateReqBody{}
	valid, err := form_validator.BindJsonAndValid(c, req)
	if !valid {
		c.Writer.WriteHeader(http.StatusBadRequest)
		_, ok := err.(form_validator.ValidErrors)
		if ok {
			ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameterJson, err))
		} else {
			ginx.ResErrJson(c, errorcode.Desc(errorcode.PublicInvalidParameterJson))
		}
		return
	}
	userInfo, err := user_util.ObtainUserInfo(c)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicRequestParameterError, err))
		return
	}
	err = s.uc.AuditProcessBindCreate(ctx, req, userInfo.ID)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, true)
}

// AuditProcessBindList 审核流程绑定列表
//
//	@Description	审核流程绑定列表
//	@Tags			审核流程绑定
//	@Summary		审核流程绑定列表
//	@Accept			json
//	@Produce		json
//	@Param			_	query		audit_process_bind.ListReqQuery	true	"请求参数"
//	@Success		200	{object}	audit_process_bind.ListRes	"成功响应参数"
//	@Failure		400	{object}	rest.HttpError				"失败响应参数"
//	@Router			/audit-process [get]
func (s *Service) AuditProcessBindList(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	req := &audit_process_bind.ListReqQuery{}
	if _, err = form_validator.BindFormAndValid(c, req); err != nil {
		log.WithContext(ctx).Errorf("failed to bind req param in query AuditProcessBindList api, err: %v", err)
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
		return
	}
	resp, err := s.uc.AuditProcessBindList(ctx, req)
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
//	@Param			_		body		audit_process_bind.UpdateReq	true	"请求参数"
//	@Success		200		bool	true						"成功响应参数"
//	@Failure		400		{object}	rest.HttpError						"失败响应参数"
//	@Router			/audit-process/{bind_id} [put]
func (s *Service) AuditProcessBindUpdate(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	UriReq := &audit_process_bind.UpdateReqPath{}
	BodyReq := &audit_process_bind.UpdateReqBody{}
	if _, err = form_validator.BindUriAndValid(c, UriReq); err != nil {
		log.WithContext(ctx).Errorf("failed to bind req param in AuditProcessBindUpdate api, err: %v", err)
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
		return
	}
	valid, err := form_validator.BindJsonAndValid(c, BodyReq)
	if !valid {
		c.Writer.WriteHeader(http.StatusBadRequest)
		_, ok := err.(form_validator.ValidErrors)
		if ok {
			ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameterJson, err))
		} else {
			ginx.ResErrJson(c, errorcode.Desc(errorcode.PublicInvalidParameterJson))
		}
		return
	}
	req := &audit_process_bind.UpdateReq{
		UpdateReqPath: *UriReq,
		UpdateReqBody: *BodyReq,
	}
	userInfo, err := user_util.ObtainUserInfo(c)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicRequestParameterError, err))
		return
	}
	err = s.uc.AuditProcessBindUpdate(ctx, req, userInfo.ID)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, true)
}

// AuditProcessBindDelete 审核流程绑定删除
//
//	@Description	审核流程绑定删除
//	@Tags			审核流程绑定
//	@Summary		审核流程绑定删除
//	@Accept			json
//	@Produce		json
//	@Param			bind_id	path		string			true	"绑定id"
//	@Success		200 	bool	true	"成功响应参数"
//	@Failure		400		{object}	rest.HttpError	"失败响应参数"
//	@Router			/audit-process/{bind_id} [delete]
func (s *Service) AuditProcessBindDelete(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	req := &audit_process_bind.DeleteReq{}
	valid, err := form_validator.BindUriAndValid(c, req)
	if !valid {
		c.Writer.WriteHeader(http.StatusBadRequest)
		_, ok := err.(form_validator.ValidErrors)
		if ok {
			ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
		} else {
			ginx.ResErrJson(c, errorcode.Desc(errorcode.PublicInvalidParameter))
		}
		return
	}
	err = s.uc.AuditProcessBindDelete(ctx, req)
	if err != nil {
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, true)
}

// AuditProcessBindGet 审核流程绑定详情
//
//	@Description	审核流程绑定详情
//	@Tags			审核流程绑定详情
//	@Summary		审核流程绑定详情
//	@Accept			json
//	@Produce		json
//	@Param			bind_id	path		string			true	"绑定id"
//	@Success		200 	bool	true	"成功响应参数"
//	@Failure		400		{object}	rest.HttpError	"失败响应参数"
//	@Router			/audit-process/{bind_id} [get]
func (s *Service) AuditProcessBindGet(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	req := &audit_process_bind.AuditProcessBindUriReq{}
	valid, err := form_validator.BindUriAndValid(c, req)
	if !valid {
		c.Writer.WriteHeader(http.StatusBadRequest)
		_, ok := err.(form_validator.ValidErrors)
		if ok {
			ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
		} else {
			ginx.ResErrJson(c, errorcode.Desc(errorcode.PublicInvalidParameter))
		}
		return
	}
	resp, err := s.uc.AuditProcessBindGet(ctx, req)
	if err != nil {
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}

func (s *Service) AuditProcessBindGetByAuditType(c *gin.Context) {
	req := &audit_process_bind.AuditTypeGetParameter{}
	if _, err := form_validator.BindUriAndValid(c, req); err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to bind req param in AuditProcessBindGet api, err: %v", err)
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
		return
	}
	resp, err := s.uc.AuditProcessBindGetByAuditType(c.Request.Context(), req)
	if err != nil {
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}

func (s *Service) AuditProcessBindDeleteByAuditType(c *gin.Context) {
	req := &audit_process_bind.AuditType{}
	if _, err := form_validator.BindUriAndValid(c, req); err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to bind req param in AuditProcessBindGet api, err: %v", err)
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
		return
	}
	err := s.uc.AuditProcessBindDeleteByAuditType(c.Request.Context(), req)
	if err != nil {
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, true)

}
