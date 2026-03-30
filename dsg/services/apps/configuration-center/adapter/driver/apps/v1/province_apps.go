package apps

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/form_validator"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/user_util"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/apps"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	af_trace "github.com/kweaver-ai/idrm-go-frame/core/telemetry/trace"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest/ginx"
)

// ReportAppsList  godoc
// @Summary     查询应用上报列表
// @Description ProvinceAppsList Description
// @Accept      application/json
// @Produce     application/json
// @Tags        省直达应用系统上报
// @Param       _     query    apps.ProvinceAppListReq true "请求参数"
// @Success     200       {object} apps.GetAppDetailInfoListResp "desc"
// @Failure     400       {object} rest.HttpError
// @Router      /province-apps [get]
func (s *Service) ReportAppsList(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	req := &apps.ProvinceAppListReq{}
	if _, err = form_validator.BindFormAndValid(c, req); err != nil {
		log.WithContext(ctx).Errorf("failed to bind req param in query AppsList api, err: %v", err)
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
		return
	}

	resp, err := s.uc.ReportAppsList(ctx, req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}

// Report 上报应用系统接口(支持批量)
// @Description 上报应用系统接口(支持批量)
// @Tags        省直达应用系统上报
// @Summary     上报应用系统接口(支持批量)
// @Accept      json
// @Produce     json
// @Param       Authorization header   string                    true "token"
// @Param 		data body apps.AppsIDS true "更新应用授权请求体"
// @Success     200
// @Failure     400   {object} rest.HttpError            "失败响应参数"
// @Router      /province-apps/report [put]
func (s *Service) Report(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	req := &apps.AppsIDS{}
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

	err = s.uc.Report(ctx, req, userInfo)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, true)

}

// GetReportAuditList  godoc
// @Summary     查询审核列表接口
// @Description GetReportAuditList Description
// @Accept      application/json
// @Produce     application/json
// @Tags        省直达应用系统上报
// @Param       _     query    apps.AuditListGetReq true "请求参数"
// @Success     200   {object} apps.AuditListResp    "成功响应参数"
// @Failure     400  {object} rest.HttpError
// @Router    /province-apps/report-audit [get]
func (s *Service) GetReportAuditList(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	req := &apps.AuditListGetReq{}
	if _, err := form_validator.BindFormAndValid(c, req); err != nil {
		log.WithContext(ctx).Errorf("failed to bind req param in query AppsList api, err: %v", err)
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
		return
	}
	datas, err := s.uc.GetReportAuditList(c, req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, datas)
}

// Cancel  godoc
// @Summary     撤回创建或者更新应用系统审核
// @Description Cancel Description
// @Accept      application/json
// @Produce     application/json
// @Tags        省直达应用系统上报
// @Param       id path string true "应用授权ID，uuid"
// @Success     200
// @Failure     400  {object} rest.HttpError
// @Router    /province-apps/{id}/report-audit/cancel [put]
func (s *Service) Cancel(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	req := &apps.DeleteReq{}
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
	err = s.uc.ReportCancel(ctx, req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, true)

}
