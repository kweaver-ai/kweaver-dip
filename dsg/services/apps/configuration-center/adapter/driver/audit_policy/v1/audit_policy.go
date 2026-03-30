package audit_policy

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/form_validator"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/models/response"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/user_util"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/audit_policy"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	af_trace "github.com/kweaver-ai/idrm-go-frame/core/telemetry/trace"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest/ginx"
)

type Service struct {
	uc audit_policy.AppsUseCase
}

func NewService(uc audit_policy.AppsUseCase) *Service {
	return &Service{
		uc: uc,
	}
}

// Create  godoc
// @Summary     创建审核策略
// @Description Create Description
// @Accept      application/json
// @Produce     application/json
// @Param 		data body audit_policy.CreateReqBody true "创建审核策略请求体"
// @Tags        审核策略
// @Success     200 {object}  audit_policy.CreateOrUpdateResBody
// @Failure     400 {object} rest.HttpError
// @Router      /audit_policy [post]
func (s *Service) Create(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	req := &audit_policy.CreateReqBody{}
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

	resp, err := s.uc.Create(ctx, req, userInfo)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}

// Update  godoc
// @Summary     更新审核策略
// @Description  更新审核策略，包括添加/移除资源、绑定/解绑审核流程
// @Accept      application/json
// @Produce     application/json
// @Tags        审核策略
// @Param       id path string true "审核策略ID，uuid"
// @Param 		data body audit_policy.UpdateReqBody  true "更新审核策略请求体"
// @Success     200  {object} audit_policy.CreateOrUpdateResBody
// @Failure     400  {object} rest.HttpError
// @Router     /audit_policy/{id} [put]
func (s *Service) Update(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	UriReq := &audit_policy.UpdateReqPath{}
	BodyReq := &audit_policy.UpdateReqBody{}
	if _, err = form_validator.BindUriAndValid(c, UriReq); err != nil {
		log.WithContext(ctx).Errorf("failed to bind req param in Update api, err: %v", err)
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

	userInfo, err := user_util.ObtainUserInfo(c)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicRequestParameterError, err))
		return
	}

	req := &audit_policy.UpdateReq{
		UpdateReqPath: *UriReq,
		UpdateReqBody: *BodyReq,
	}

	resp, err := s.uc.Update(ctx, req, userInfo)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}

// UpdateStatus  godoc
// @Summary     更新审核策略状态
// @Description 更新审核策略状态
// @Accept      application/json
// @Produce     application/json
// @Tags        审核策略
// @Param       id path string true "审核策略ID，uuid"
// @Param 		data body audit_policy.UpdateStatusReqBody  true "更新审核策略请求体"
// @Success     200  {object} audit_policy.CreateOrUpdateResBody
// @Failure     400  {object} rest.HttpError
// @Router     /audit_policy/{id}/status [put]
func (s *Service) UpdateStatus(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	UriReq := &audit_policy.UpdateReqPath{}
	BodyReq := &audit_policy.UpdateStatusReqBody{}
	if _, err = form_validator.BindUriAndValid(c, UriReq); err != nil {
		log.WithContext(ctx).Errorf("failed to bind req param in UpdateStatus api, err: %v", err)
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

	userInfo, err := user_util.ObtainUserInfo(c)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicRequestParameterError, err))
		return
	}

	req := &audit_policy.UpdateStatusReq{
		UpdateReqPath:       *UriReq,
		UpdateStatusReqBody: *BodyReq,
	}

	resp, err := s.uc.UpdateStatus(ctx, req, userInfo)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}

// Delete  godoc
// @Summary     删除审核策略
// @Description Delete Description
// @Accept      application/json
// @Produce     application/json
// @Tags        审核策略
// @Param       id path string true "审核策略ID，uuid"
// @Success     200
// @Failure     400  {object} rest.HttpError
// @Router     /audit_policy/{id} [delete]
func (s *Service) Delete(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	req := &audit_policy.DeleteReq{}
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
	err = s.uc.Delete(ctx, req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, true)
}

// GetById  godoc
// @Summary     审核策略详情
// @Description GetById Description
// @Accept      application/json
// @Produce     application/json
// @Tags        审核策略
// @Param       id path string true "审核策略ID，uuid"
// @Success     200  {object} audit_policy.AuditPolicyRes
// @Failure     400  {object} rest.HttpError
// @Router     /audit_policy/{id} [get]
func (s *Service) GetById(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	req := &audit_policy.AuditPolicyReq{}
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

	resp, err := s.uc.GetById(ctx, req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}

// AppsList  godoc
// @Summary     审核策略列表
// @Description AppsList Description
// @Accept      application/json
// @Produce     application/json
// @Tags        审核策略
// @Param			query			query		audit_policy.ListReqQuery	true	"查询参数"
// @Success     200       {object} audit_policy.ListRes "desc"
// @Failure     400       {object} rest.HttpError
// @Router      /audit_policy [get]
func (s *Service) List(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	req := &audit_policy.ListReqQuery{}
	if _, err = form_validator.BindFormAndValid(c, req); err != nil {
		log.WithContext(ctx).Errorf("failed to bind req param in query List api, err: %v", err)
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
		return
	}

	userInfo, err := user_util.ObtainUserInfo(c)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicRequestParameterError, err))
		return
	}

	resp, err := s.uc.List(ctx, req, userInfo)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}

// NameRepeat  godoc
// @Summary     判审核策略名称是否重复
// @Description 判断审核策略是否重复，true表示不重复，重复会报错
// @Accept      application/json
// @Produce     application/json
// @Tags        审核策略
// @Param       name   query    string     true "审核策略名称"
// @Param       id   query    string     false "审核策略Id"
// @Success     200 {object} response.CheckRepeatResp
// @Failure     400 {object} rest.HttpError
// @Router     /audit_policy/repeat [get]
func (s *Service) IsNameRepeat(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	req := &audit_policy.NameRepeatReq{}
	valid, errs := form_validator.BindQueryAndValid(c, req)
	if !valid {
		c.Writer.WriteHeader(http.StatusBadRequest)
		_, ok := errs.(form_validator.ValidErrors)
		if ok {
			ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, errs))
		} else {
			ginx.ResErrJson(c, errorcode.Desc(errorcode.PublicInvalidParameterJson))
		}
		return
	}
	err = s.uc.IsNameRepeat(ctx, req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, response.CheckRepeatResp{Name: req.Name, Repeat: false})
}

// GetAuditPolicyByResourceIds 根据资源id合集批量获取是否有审核策略（前端适配显示申请权限按钮）
// @Summary     根据资源id合集批量获取是否有审核策略（前端适配显示申请权限按钮）
// @Description 根据资源id合集批量获取是否有审核策略（前端适配显示申请权限按钮）
// @Tags        审核策略
// @Accept      application/json
// @Produce     json
// @Success     200 {object} audit_policy.ResourcePolicyRes "成功响应参数"
// @Failure     400 {object} rest.HttpError     "失败响应参数"
// @Router      /audit_policy/resources/{ids} [get]
func (s *Service) GetAuditPolicyByResourceIds(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	var req audit_policy.ListByIdsReqParam
	valid, errs := form_validator.BindUriAndValid(c, &req)
	if !valid {
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.LabelInvalidParameter, errs))
		return
	}

	res, err := s.uc.GetAuditPolicyByResourceIds(ctx, req.Ids)
	if err != nil {
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, res)
}

func (s *Service) GetResourceAuditPolicy(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	req := &audit_policy.Resource{}
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

	resp, err := s.uc.GetResourceAuditPolicy(ctx, req.Id)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}
