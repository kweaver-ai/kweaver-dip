package apps

import (
	"net/http"

	"github.com/kweaver-ai/idrm-go-common/rest/user_management"

	"github.com/gin-gonic/gin"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/form_validator"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/user_util"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/apps"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	af_trace "github.com/kweaver-ai/idrm-go-frame/core/telemetry/trace"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest/ginx"
)

type Service struct {
	uc                   apps.AppsUseCase
	userManagementDriven user_management.DrivenUserMgnt
}

func NewService(uc apps.AppsUseCase, userManagementDriven user_management.DrivenUserMgnt) *Service {
	return &Service{
		uc:                   uc,
		userManagementDriven: userManagementDriven,
	}
}

// AppsCreate  godoc
// @Summary     创建应用授权
// @Description AppsCreate Description
// @Accept      application/json
// @Produce     application/json
// @Param 		data body apps.CreateReqBody true "创建应用授权请求体"
// @Tags        应用授权
// @Success     200 {object}  apps.CreateOrUpdateResBody
// @Failure     400 {object} rest.HttpError
// @Router      /apps [post]
func (s *Service) AppsCreate(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	req := &apps.CreateReqBody{}
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

	resp, err := s.uc.AppsCreate(ctx, req, userInfo)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}

// AppsUpdate  godoc
// @Summary     更新应用授权更新
// @Description AppsUpdate Description
// @Accept      application/json
// @Produce     application/json
// @Tags        应用授权
// @Param       id path string true "应用授权ID，uuid"
// @Param 		data body apps.UpdateReqBody  true "更新应用授权请求体"
// @Success     200  {object} apps.CreateOrUpdateResBody
// @Failure     400  {object} rest.HttpError
// @Router     /apps/{id} [put]
func (s *Service) AppsUpdate(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	UriReq := &apps.UpdateReqPath{}
	BodyReq := &apps.UpdateReqBody{}
	if _, err = form_validator.BindUriAndValid(c, UriReq); err != nil {
		log.WithContext(ctx).Errorf("failed to bind req param in AppsUpdate api, err: %v", err)
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

	req := &apps.UpdateReq{
		UpdateReqPath: *UriReq,
		UpdateReqBody: *BodyReq,
	}

	resp, err := s.uc.AppsUpdate(ctx, req, userInfo)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}

// AppsDelete  godoc
// @Summary     应用授权删除
// @Description AppsDelete Description
// @Accept      application/json
// @Produce     application/json
// @Tags        应用授权
// @Param       id path string true "应用授权ID，uuid"
// @Success     200
// @Failure     400  {object} rest.HttpError
// @Router     /apps/{id} [delete]
func (s *Service) AppsDelete(c *gin.Context) {
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
	err = s.uc.AppsDelete(ctx, req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, true)
}

// AppsDelete  godoc
// @Summary     应用授权详情
// @Description AppsDelete Description
// @Accept      application/json
// @Produce     application/json
// @Tags        应用授权
// @Param       id path string true "应用授权ID，uuid"
// @Param       version   query    string  	false "查询详情传published, 编辑详情传editing"
// @Success     200  {object} apps.Apps
// @Failure     400  {object} rest.HttpError
// @Router     /apps/{id} [get]
func (s *Service) AppsGetById(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	req := &apps.AppReq{}
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

	reqVersion := &apps.AppReqQuery{}
	if _, err = form_validator.BindFormAndValid(c, reqVersion); err != nil {
		log.WithContext(ctx).Errorf("failed to bind req param in query AppsList api, err: %v", err)
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
		return
	}

	resp, err := s.uc.AppById(ctx, &req.AppsID, reqVersion.Version)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}

type PageResult struct {
	Entries    interface{} `json:"entries"`
	TotalCount int64       `json:"total_count"`
}

// AppsList  godoc
// @Summary     查询应用授权列表
// @Description AppsList Description
// @Accept      application/json
// @Produce     application/json
// @Tags        应用授权
// @Param       offset    query    int     	false "当前页码，默认1，大于等于1"                    default(1)                    minimum(1)
// @Param       limit     query    int     	false "每页条数，默认10，大于等于1"                   default(10)                   minimum(1)
// @Param       sort      query    string  	false "排序类型，默认按created_at排序，可选updated_at, name" Enums(created_at, updated_at, name) default('created_at')
// @Param       direction query    string  	false "排序方向，默认desc降序，可选asc升序"             Enums(desc, asc)              default(desc)
// @Param       keyword   query    string  	false "应用名称，支持模糊查询"
// @Param       only_developer   query    bool  	false "为ture只显示应用开发者自己管理的"
// @Success     200       {object} apps.ListRes "desc"
// @Failure     400       {object} rest.HttpError
// @Router      /apps [get]
func (s *Service) AppsList(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	req := &apps.ListReqQuery{}
	if _, err = form_validator.BindFormAndValid(c, req); err != nil {
		log.WithContext(ctx).Errorf("failed to bind req param in query AppsList api, err: %v", err)
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

	resp, err := s.uc.AppsList(ctx, req, userInfo)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}

// AppCancel  godoc
// @Summary     撤回创建或者更新应用系统审核
// @Description AppCancel Description
// @Accept      application/json
// @Produce     application/json
// @Tags        应用授权
// @Param       id path string true "应用授权ID，uuid"
// @Success     200
// @Failure     400  {object} rest.HttpError
// @Router    /apps/{id}/app-audit/cancel [put]
func (s *Service) AppCancel(c *gin.Context) {
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
	err = s.uc.Cancel(ctx, req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, true)

	// var req domain.AppPathReq
	// if _, err := form_validator.BindUriAndValid(c, &req); err != nil {
	// 	log.WithContext(c.Request.Context()).Errorf("failed to binding req uri param in demand escalate, err: %v", err)
	// 	form_validator.ReqParamErrorHandle(c, err)
	// 	return
	// }

	// var reqType domain.AuditType
	// if _, err := form_validator.BindUriAndValid(c, &reqType); err != nil {
	// 	log.WithContext(c.Request.Context()).Errorf("failed to binding req uri param in demand escalate, err: %v", err)
	// 	form_validator.ReqParamErrorHandle(c, err)
	// 	return
	// }

	// datas, err := s.uc.CancelApp(c, req.AppID.Uint64(), reqType.AuditType)
	// if err != nil {
	// 	c.Writer.WriteHeader(http.StatusBadRequest)
	// 	ginx.ResErrJson(c, err)
	// 	return
	// }
	// ginx.ResOKJson(c, datas)
	ginx.ResOKJson(c, nil)

}

// GetApplyAuditList  godoc
// @Summary     查询审核列表接口
// @Description AppCancel Description
// @Accept      application/json
// @Produce     application/json
// @Tags        应用授权
// @Param       _     query    apps.AuditListGetReq true "请求参数"
// @Success     200   {object} apps.AuditListResp    "成功响应参数"
// @Failure     400  {object} rest.HttpError
// @Router    /apps/apply-audit [get]
func (s *Service) GetApplyAuditList(c *gin.Context) {
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
	datas, err := s.uc.GetAuditList(c, req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, datas)
}

// AppsList  godoc
// @Summary     应用授权查询(获取所有)
// @Description AppsList Description
// @Accept      application/json
// @Produce     application/json
// @Tags        应用授权
// @Success     200       {array} apps.AppsAllListBrief
// @Failure     400       {object} rest.HttpError
// @Router      /apps/all-brief [get]
func (s *Service) AppsAllListBrief(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()

	resp, err := s.uc.AppsAllListBrief(ctx)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}

// NameRepeat  godoc
// @Summary     判断应用授权名称是否重复
// @Description 判断应用授权名称是否重复，true表示不重复，重复会报错
// @Accept      application/json
// @Produce     application/json
// @Tags        应用授权
// @Param       name   query    string     true "应用授权名称"
// @Param       id   query    string     false "应用授权Id"
// @Success     200 {string} string "true"
// @Failure     400 {object} rest.HttpError
// @Router     /apps/repeat [get]
func (s *Service) NameRepeat(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	req := &apps.NameRepeatReq{}
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
	res, err := s.uc.NameRepeat(ctx, req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, res)
}

// AccountNameRepeat  godoc
// @Summary     判断应用账号名称是否重复
// @Description 判断应用账号名称是否重复，true表示不重复，重复会报错
// @Accept      application/json
// @Produce     application/json
// @Tags        应用授权
// @Param       name   query    string     true "应用账号名称"
// @Param       id   query    string     false "应用账号Id"
// @Success     200 {string} string "true"
// @Failure     400 {object} rest.HttpError
// @Router     /apps/account_name/repeat [get]
// func (s *Service) AccountNameRepeat(c *gin.Context) {
// 	var err error
// 	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
// 	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
// 	req := &apps.NameRepeatReq{}
// 	valid, errs := form_validator.BindQueryAndValid(c, req)
// 	if !valid {
// 		c.Writer.WriteHeader(http.StatusBadRequest)
// 		_, ok := errs.(form_validator.ValidErrors)
// 		if ok {
// 			ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, errs))
// 		} else {
// 			ginx.ResErrJson(c, errorcode.Desc(errorcode.PublicInvalidParameterJson))
// 		}
// 		return
// 	}
// 	res, err := s.uc.AccountNameRepeat(ctx, req)
// 	if err != nil {
// 		c.Writer.WriteHeader(http.StatusBadRequest)
// 		ginx.ResErrJson(c, err)
// 		return
// 	}
// 	ginx.ResOKJson(c, res)
// }

// GetEnumConfig  godoc
// @Summary      获取省直达应用领域和应用范围
// @Description  GetEnumConfig Description
// @Accept       application/json
// @Produce      application/json
// @Tags         应用授权
// @Success      200 {object} apps.EnumObject "form enum config"
// @Failure      400 {object} rest.HttpError
// @Router       /enum-config [get]
func (s *Service) GetEnumConfig(context *gin.Context) {
	formEnum := s.uc.GetFormEnum()
	ginx.ResOKJson(context, formEnum)
}

// func (s *Service) HasAccessPermission(c *gin.Context) {
// 	var err error
// 	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
// 	defer func() { af_trace.TelemetrySpanEnd(span, err) }()

// 	var req apps.HasAccessPermissionReq
// 	if _, err := form_validator.BindQueryAndValid(c, &req); err != nil {
// 		log.WithContext(c).Error("failed to bind req param in HasAccessPermission api", zap.Error(err))
// 		c.Writer.WriteHeader(http.StatusBadRequest)
// 		ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
// 		return
// 	}

// 	res, err := s.uc.HasAccessPermission(ctx, &req)
// 	if err != nil {
// 		c.Writer.WriteHeader(http.StatusBadRequest)
// 		ginx.ResErrJson(c, err)
// 		return
// 	}
// 	ginx.ResOKJson(c, res)
// }

func (s *Service) AppByAccountId(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	req := &apps.AppReq{}
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
	resp, err := s.uc.AppByAccountId(ctx, &req.AppsID)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)

}

func (s *Service) AppByApplicationDeveloperId(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	req := &apps.AppReq{}
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
	resp, err := s.uc.AppByApplicationDeveloperId(ctx, &req.AppsID)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)

}

// AppsRegister  godoc
// @Summary     应用注册
// @Description AppsRegister Description
// @Accept      application/json
// @Produce     application/json
// @Tags        应用授权
// @Param       id path string true "应用授权ID，uuid"
// @Param 		data body apps.AppRegister  true "更新应用授权请求体"
// @Success     200  {object} apps.CreateOrUpdateResBody
// @Failure     400  {object} rest.HttpError
// @Router     /apps/{id}/register [put]
func (s *Service) AppsRegister(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	UriReq := &apps.UpdateReqPath{}
	BodyReq := &apps.AppRegister{}
	if _, err = form_validator.BindUriAndValid(c, UriReq); err != nil {
		log.WithContext(ctx).Errorf("failed to bind req param in AppsRegister api, err: %v", err)
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
	BodyReq.Id = UriReq.Id

	resp, err := s.uc.AppRegister(ctx, BodyReq, userInfo)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}

// AppsRegisterList  godoc
// @Summary     查询应用注册列表
// @Description AppsList Description
// @Accept      application/json
// @Produce     application/json
// @Tags        应用授权
// @Param       _ query apps.ListRegisteReqQuery true "请求参数"
// @Success     200       {object} apps.ListRegisteRes "desc"
// @Failure     400       {object} rest.HttpError
// @Router      /apps/register [get]
func (s *Service) AppsRegisterList(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	req := &apps.ListRegisteReqQuery{}
	if _, err = form_validator.BindFormAndValid(c, req); err != nil {
		log.WithContext(ctx).Errorf("failed to bind req param in query AppsList api, err: %v", err)
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

	resp, err := s.uc.AppsRegisterList(ctx, req, userInfo)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}

// PassIDRepeat  godoc
// @Summary     检查系统标识是否重复
// @Description 检查系统标识是否重复
// @Accept      application/json
// @Produce     application/json
// @Tags        应用授权
// @Param       pass_id   query    string     true "PassID"
// @Param       id   query    string     false "应用授权Id"
// @Success     200 {string} string "true"
// @Failure     400 {object} rest.HttpError
// @Router      /apps/pass-id/repeat [get]
func (s *Service) PassIDRepeat(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	req := &apps.PassIDRepeatReq{}
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
	res, err := s.uc.PassIDRepeat(ctx, req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, res)
}
