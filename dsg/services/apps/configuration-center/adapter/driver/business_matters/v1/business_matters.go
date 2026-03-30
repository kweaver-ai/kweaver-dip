package business_matters

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/form_validator"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/models/response"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/user_util"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/business_matters"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	af_trace "github.com/kweaver-ai/idrm-go-frame/core/telemetry/trace"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest/ginx"
)

type Service struct {
	uc business_matters.BusinessMattersUseCase
}

func NewService(uc business_matters.BusinessMattersUseCase) *Service {
	return &Service{
		uc: uc,
	}
}

// CreateBusinessMatters  godoc
// @Summary     创建业务事项
// @Description AppsCreate Description
// @Accept      application/json
// @Produce     application/json
// @Param 		data body business_matters.CreateReqBody true "创建创建业务事项请求体"
// @Tags        业务事项管理
// @Success     200 {object}  business_matters.ID
// @Failure     400 {object} rest.HttpError
// @Router      /business_matters [post]
func (s *Service) CreateBusinessMatters(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	req := &business_matters.CreateReqBody{}
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

	resp, err := s.uc.CreateBusinessMatters(ctx, req, userInfo)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}

// UpdateBusinessMatters  godoc
// @Summary     更新业务事项
// @Description UpdateBusinessMatters Description
// @Accept      application/json
// @Produce     application/json
// @Tags        业务事项管理
// @Param       id path string true "业务事项ID，uuid"
// @Param 		data body business_matters.UpdateReqBody  true "更新业务事项请求体"
// @Success     200  {object} business_matters.ID
// @Failure     400  {object} rest.HttpError
// @Router     /business_matters/{id} [put]
func (s *Service) UpdateBusinessMatters(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	UriReq := &business_matters.UpdateReqPath{}
	BodyReq := &business_matters.UpdateReqBody{}
	if _, err = form_validator.BindUriAndValid(c, UriReq); err != nil {
		log.WithContext(ctx).Errorf("failed to bind req param in UpdateBusinessMatters api, err: %v", err)
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

	req := &business_matters.UpdateReq{
		UpdateReqPath: *UriReq,
		UpdateReqBody: *BodyReq,
	}

	resp, err := s.uc.UpdateBusinessMatters(ctx, req, userInfo)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}

// DeleteBusinessMatters  godoc
// @Summary     删除业务事项
// @Description AppsDelete Description
// @Accept      application/json
// @Produce     application/json
// @Tags        业务事项管理
// @Param       id path string true "业务事项ID，uuid"
// @Success     200
// @Failure     400  {object} rest.HttpError
// @Router     /business_matters/{id} [delete]
func (s *Service) DeleteBusinessMatters(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	req := &business_matters.DeleteReq{}
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
	err = s.uc.DeleteBusinessMatters(ctx, req.Id)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, true)
}

// GetBusinessMattersList  godoc
// @Summary     查询业务事项列表
// @Description AppsList Description
// @Accept      application/json
// @Produce     application/json
// @Tags        业务事项管理
// @Param		_		  query	   business_matters.ListReqQuery true "请求参数"
// @Success     200       {object} business_matters.ListRes "desc"
// @Failure     400       {object} rest.HttpError
// @Router      /business_matters [get]
func (s *Service) GetBusinessMattersList(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	req := &business_matters.ListReqQuery{}
	if _, err = form_validator.BindFormAndValid(c, req); err != nil {
		log.WithContext(ctx).Errorf("failed to bind req param in query GetBusinessMattersList api, err: %v", err)
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
		return
	}

	resp, err := s.uc.GetBusinessMattersList(ctx, req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}

// GetBusinessMattersNameRepeat  godoc
// @Summary     查询业务事项列名称是否重复
// @Description 查询业务事项列名称是否重复，true表示不重复，重复会报错
// @Accept      application/json
// @Produce     application/json
// @Tags        业务事项管理
// @Param       name   query    string     true "业务事项名称"
// @Param       id   query    string     false "业务事项Id"
// @Success     200 {object} response.CheckRepeatResp	"成功响应参数"
// @Failure     400 {object} rest.HttpError
// @Router     /business_matters/name-check [get]
func (s *Service) GetBusinessMattersNameRepeat(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	req := &business_matters.NameRepeatReq{}
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
	err = s.uc.NameRepeat(ctx, req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, response.CheckRepeatResp{Name: req.Name, Repeat: false})
}

func (s *Service) GetListByIds(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	var req business_matters.IDs
	valid, err := form_validator.BindUriAndValid(c, &req)
	if !valid {
		log.WithContext(ctx).Errorf("failed to bind req param in GetListByIds api, err: %v", err)
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
		return
	}

	res, err := s.uc.GetListByIds(ctx, req.Ids)
	if err != nil {
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, res)
}
