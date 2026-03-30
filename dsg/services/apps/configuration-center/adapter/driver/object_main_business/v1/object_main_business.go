package object_main_business

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/form_validator"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/user_util"
	domain "github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/object_main_business"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	af_trace "github.com/kweaver-ai/idrm-go-frame/core/telemetry/trace"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest/ginx"
	"go.uber.org/zap"
)

type Service struct {
	uc domain.UseCase
}

func NewService(uc domain.UseCase) *Service {
	return &Service{uc: uc}
}

// GetObjectMainBusinessList 获取对象主干业务列表
//
//		@Summary		获取对象主干业务列表
//		@Tags			主干业务
//		@Description	获取对象主干业务列表
//	    @Accept      application/json
//	    @Produce     application/json
//	    @Param       Authorization header   string           true   "Authorization header"
//	    @Param          _   path        domain.ObjectIdReq   true   "请求参数"
//		@Param			_	query		domain.QueryPageReq	 false	"查询参数"
//		@Success		200	{object}	domain.QueryPageResp	"成功响应参数"
//		@Failure		400	{object}	rest.HttpError				"失败响应参数"
//		@Router			/objects/{id}/main-business [get]
func (s *Service) GetObjectMainBusinessList(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	uriParam := &domain.ObjectIdReq{}
	_, err = form_validator.BindUriAndValid(c, uriParam)
	if err != nil {
		log.WithContext(ctx).Error("failed to bind req uri param", zap.Error(err))
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
		return
	}

	req := &domain.QueryPageReq{}
	_, err = form_validator.BindQueryAndValid(c, req)
	if err != nil {
		log.WithContext(ctx).Errorf("failed to bind req param , err: %v", err)
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
		return
	}

	res, err := s.uc.GetObjectMainBusinessList(ctx, uriParam.ID, req)
	if err != nil {
		log.WithContext(ctx).Error("failed to list object main business", zap.Error(err))
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}

	ginx.ResOKJson(c, res)
}

// AddObjectMainBusiness 添加对象主干业务
//
//		@Summary		添加对象主干业务
//		@Tags			主干业务
//		@Description	添加对象主干业务
//	    @Accept      application/json
//	    @Produce     application/json
//	    @Param       Authorization header   string           true   "Authorization header"
//	    @Param          _   path        domain.ObjectIdReq   true   "请求参数"
//		@Param			_	body		domain.AddObjectMainBusinessReq	true	"请求参数"
//		@Success		200	{object}	domain.CountResp	"成功响应参数"
//		@Failure		400	{object}	rest.HttpError				"失败响应参数"
//		@Router			/objects/{id}/main-business [post]
func (s *Service) AddObjectMainBusiness(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()

	uriParam := &domain.ObjectIdReq{}
	_, err = form_validator.BindUriAndValid(c, uriParam)
	if err != nil {
		log.WithContext(ctx).Error("failed to bind req uri param ", zap.Error(err))
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
		return
	}

	jsonParam := domain.AddObjectMainBusinessReq{}
	if _, err := form_validator.BindJsonAndValid(c, &jsonParam); err != nil {
		log.WithContext(ctx).Errorf("failed to bind req body param, err: %v", err)
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

	res, err := s.uc.AddObjectMainBusiness(ctx, uriParam.ID, jsonParam.MainBusinessInfos, userInfo.ID)
	if err != nil {
		log.WithContext(ctx).Error("failed to add object main business", zap.Error(err))
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}

	ginx.ResOKJson(c, res)
}

// UpdateObjectMainBusiness 修改对象主干业务
//
//		@Summary		修改对象主干业务
//		@Tags			主干业务
//		@Description	修改对象主干业务
//	    @Accept      application/json
//	    @Produce     application/json
//	    @Param       Authorization header   string           true   "Authorization header"
//		@Param			_	body		domain.UpdateObjectMainBusinessReq	true	"请求参数"
//		@Success		200	{object}	domain.CountResp	"成功响应参数"
//		@Failure		400	{object}	rest.HttpError				"失败响应参数"
//		@Router			/objects/main-business [put]
func (s *Service) UpdateObjectMainBusiness(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	jsonParam := domain.UpdateObjectMainBusinessReq{}
	if _, err := form_validator.BindJsonAndValid(c, &jsonParam); err != nil {
		log.WithContext(ctx).Errorf("failed to bind req body param, err: %v", err)
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

	res, err := s.uc.UpdateObjectMainBusiness(ctx, jsonParam.MainBusinessInfos, userInfo.ID)
	if err != nil {
		log.WithContext(ctx).Error("failed to update object main business", zap.Error(err))
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}

	ginx.ResOKJson(c, res)
}

// DeleteObjectMainBusiness 删除对象主干业务
//
//		@Summary		删除对象主干业务
//		@Tags			主干业务
//		@Description	删除对象主干业务
//	    @Accept      application/json
//	    @Produce     application/json
//	    @Param       Authorization header   string           true   "Authorization header"
//		@Param			_	body		domain.IdsReq	true	"请求参数"
//		@Success		200	{object}	domain.CountResp	"成功响应参数"
//		@Failure		400	{object}	rest.HttpError				"失败响应参数"
//		@Router			/objects/main-business [delete]
func (s *Service) DeleteObjectMainBusiness(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	jsonParam := domain.IdsReq{}
	if _, err := form_validator.BindJsonAndValid(c, &jsonParam); err != nil {
		log.WithContext(ctx).Errorf("failed to bind req body param, err: %v", err)
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

	res, err := s.uc.DeleteObjectMainBusiness(ctx, &jsonParam, userInfo.ID)
	if err != nil {
		log.WithContext(ctx).Error("failed to delete object main business", zap.Error(err))
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}

	ginx.ResOKJson(c, res)
}
