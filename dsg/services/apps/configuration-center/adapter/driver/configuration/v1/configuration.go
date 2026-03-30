package configuration

import (
	"net/http"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/models/response"

	"github.com/gin-gonic/gin"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/constant"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/form_validator"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/util"
	domain "github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/configuration"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	af_trace "github.com/kweaver-ai/idrm-go-frame/core/telemetry/trace"
	_ "github.com/kweaver-ai/idrm-go-frame/core/transport/rest"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest/ginx"
)

type Service struct {
	uc domain.ConfigurationCase
}

func NewService(uc domain.ConfigurationCase) *Service {
	return &Service{uc: uc}
}

// GetThirdPartyAddrWithOutPath
// @Summary     获取第三方平台访问地址
// @Description 用于可配置第三方平台访问地址获取
// @Tags        配置
// @Accept      application/json
// @Produce     json
//
//	@Param      path	query  bool	false	"查询路径参数,ture返回带路径地址"
//
// @Success     200 {array} domain.GetThirdPartyAddressRes "成功响应参数"
// @Failure     400 {object} rest.HttpError     "失败响应参数"
// @Router      /third_party_addr [get]
func (s *Service) GetThirdPartyAddrWithOutPath(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	req := &domain.GetThirdPartyAddressReq{}
	if _, err = form_validator.BindQueryAndValid(c, req); err != nil {
		log.WithContext(ctx).Errorf("failed to bind req param in query Get third_party_addr  api, err: %v", err)
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
		return
	}
	res, err := s.uc.GetThirdPartyAddr(ctx, req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, res)
}

// GetConfigValueByKey
// @Summary     通过入参获取配置表key中对应的值value
// @Description 通用方法，用于配置表中key对应值value的获取
// @Tags        配置
// @Accept      application/json
// @Produce     json
// @Param		_	query	domain.GetConfigValueReq	true	"用于获取名字对应的配置值"
// @Success     200 object domain.GetConfigValueRes   "成功响应参数"
// @Failure     400 {object} rest.HttpError     "失败响应参数"
// @Router      /config-value [get]
func (s *Service) GetConfigValueByKey(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	req := &domain.GetConfigValueReq{}
	if _, err = form_validator.BindQueryAndValid(c, req); err != nil {
		log.WithContext(ctx).Errorf("failed to bind req param in query GetConfigValueByKey api, err: %v", err)
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
		return
	}
	res, err := s.uc.GetConfigValue(ctx, req.Key)
	if err != nil {
		// 有错误
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	} else if res == nil {
		// 没有找到
		ginx.ResOKJson(c, nil)
		return
	}

	// 返回找到的
	ginx.ResOKJson(c, res)
}

// GetConfigValueByKeys
// @Summary     通过入参获取配置表key中对应的值value(批量)
// @Description 通用方法，用于配置表中key对应值value的获取(批量)
// @Tags        配置
// @Accept      application/json
// @Produce     json
// @Param		_	query	domain.GetConfigValuesReq	true	"用于获取名字对应的配置值"
// @Success     200 {array} domain.GetConfigValueRes   "成功响应参数"
// @Failure     400 {object} rest.HttpError     "失败响应参数"
// @Router      /config-values [get]
func (s *Service) GetConfigValueByKeys(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	req := &domain.GetConfigValuesReq{}
	if _, err = form_validator.BindQueryAndValid(c, req); err != nil {
		log.WithContext(ctx).Errorf("failed to bind req param in query GetConfigValueByKeys api, err: %v", err)
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
		return
	}
	res, err := s.uc.GetConfigValues(ctx, req.Keys)
	if err != nil {
		// 有错误
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	} else if res == nil {
		// 没有找到
		ginx.ResOKJson(c, nil)
		return
	}

	// 返回找到的
	ginx.ResOKJson(c, res)
}

// PutConfigValueByKey
// @Summary     通过入参获取配置表key中对应的值value
// @Description 通用方法，用于配置表中key对应值value的获取
// @Tags        配置
// @Accept      application/json
// @Produce     json
// @Param		_	query	domain.GetConfigValueRes	true	"用于获取名字对应的配置值"
// @Success     200 object  response.NameIDResp2   "成功响应参数"
// @Failure     400 {object} rest.HttpError     "失败响应参数"
// @Router      /config-value [put]
func (s *Service) PutConfigValueByKey(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()

	req := &domain.GetConfigValueRes{}
	if _, err = form_validator.BindJsonAndValid(c, req); err != nil {
		log.WithContext(ctx).Errorf("failed to bind req param in query PutConfigValueByKey api, err: %v", err)
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
		return
	}
	if err := s.uc.PutConfigValue(ctx, req.Key, req.Value); err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, response.NameIDResp2{req.Key})
}

// GetByTypeList
// @Summary    根据类型获取配置集合
// @Description 根据类型获取配置集合
// @Tags     配置中心
// @Accept      application/json
// @Produce     json
// @Param 		resType path int  true "字典类型"
// @Success     200 object domain.GetConfigValueRes   "成功响应参数"
// @Failure     400 {object} rest.HttpError     "失败响应参数"
// @Router      /byType-list/{resType} [get]
func (s *Service) GetByTypeList(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	req := &domain.GetByTypeReq{}
	valid, errs := form_validator.BindUriAndValid(c, req)
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
	res, err := s.uc.GetByTypeList(ctx, req.ResType)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	} else if res == nil {
		ginx.ResOKJson(c, nil)
		return
	}
	ginx.ResOKJson(c, res)
}

// GetProjectProvider
// @Summary     获取项目提供类型
// @Description 获取项目提供类型，返回默认TC或者CS
// @Tags        配置
// @Accept      application/json
// @Produce     json
// @Success     200 object domain.GetProjectProviderRes   "成功响应参数"
// @Failure     400 {object} rest.HttpError     "失败响应参数"
// @Router      /project-provider [get]
func (s *Service) GetProjectProvider(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	res, err := s.uc.GetProjectProvider(ctx)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, res)
}

// GetBusinessDomainLevel
// @Summary     查询业务域层级
// @Description 查询业务域层级
// @Tags        业务域层级
// @Accept      application/json
// @Produce     json
// @Success     200 {array} string   "成功响应参数"
// @Failure     400 {object} rest.HttpError     "失败响应参数"
// @Router      /business-domain-level [get]
func (s *Service) GetBusinessDomainLevel(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	res, err := s.uc.GetBusinessDomainLevel(ctx)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, res)
}

// PutBusinessDomainLevel
// @Summary     修改业务域层级
// @Description 修改业务域层级
// @Tags        业务域层级
// @Accept      application/json
// @Produce     json
// @Param		level body domain.PutBusinessDomainLevelReq  true "业务域层级"
// @Success     200 boolean   "成功响应参数"
// @Failure     400 {object} rest.HttpError     "失败响应参数"
// @Router      /business-domain-level [put]
func (s *Service) PutBusinessDomainLevel(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	var req domain.PutBusinessDomainLevelReq
	//var req []string
	valid, errs := form_validator.BindJsonAndValid(c, &req)
	if !valid {
		log.WithContext(ctx).Error(errs.Error())
		c.Writer.WriteHeader(http.StatusBadRequest)
		_, ok := errs.(form_validator.ValidErrors)
		if ok {
			ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, errs))
		} else {
			ginx.ResErrJson(c, errorcode.Desc(errorcode.PublicInvalidParameterJson))
		}
		return
	}
	packaed := util.PackedSliceWithoutFirst[string](req.Level)
	if len(packaed) != 3 || packaed[0] != constant.DomainGroup.String || packaed[1] != constant.Domain.String {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, errorcode.Desc(errorcode.SetBusinessDomainLevelParameterError))
		return
	}
	err = s.uc.SetBusinessDomainLevel(ctx, req.Level)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, true)
}

// GetDataUsingType
// @Summary     查询资产或目录类型
// @Description 查询资产或目录类型
// @Tags        资产或目录类型
// @Accept      application/json
// @Produce     json
// @Success     200 object domain.GetDataUsingTypeRes  "成功响应参数"
// @Failure     400 {object} rest.HttpError     "失败响应参数"
// @Router      /data/using [get]
func (s *Service) GetDataUsingType(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	res, err := s.uc.GetDataUsingType(ctx)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, res)
}

// GetDataUsingType
// @Summary     设置资产或目录类型
// @Description 设置资产或目录类型
// @Tags        资产或目录类型
// @Accept      application/json
// @Produce     json
// @Success     200  "成功响应参数"
// @Failure     400 {object} rest.HttpError     "失败响应参数"
// @Router      /data/using [put]
func (s *Service) PutDataUsingType(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()

	var req domain.PutDataUsingTypeReq
	valid, errs := form_validator.BindJsonAndValid(c, &req)
	if !valid {
		log.WithContext(ctx).Error(errs.Error())
		c.Writer.WriteHeader(http.StatusBadRequest)
		_, ok := errs.(form_validator.ValidErrors)
		if ok {
			ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, errs))
		} else {
			ginx.ResErrJson(c, errorcode.Desc(errorcode.PublicInvalidParameterJson))
		}
		return
	}

	err = s.uc.PutDataUsingType(ctx, &req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, nil)
}

// GetTimestampBlacklist
// @Summary     查询业务更新时间黑名单
// @Description 查询业务更新时间黑名单
// @Tags        业务更新时间黑名单
// @Accept      application/json
// @Produce     json
// @Success     200 {array} string   "成功响应参数"
// @Failure     400 {object} rest.HttpError     "失败响应参数"
// @Router      /timestamp-blacklist [get]
func (s *Service) GetTimestampBlacklist(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	res, err := s.uc.GetTimestampBlacklist(ctx)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, res)
}

// PutTimestampBlacklist
// @Summary     修改业务更新时间黑名单
// @Description 修改业务更新时间黑名单
// @Tags        业务更新时间黑名单
// @Accept      application/json
// @Produce     json
// @Param		level body domain.PutTimestampBlacklistReq  true "业务更新时间黑名单"
// @Success     200 boolean   "成功响应参数"
// @Failure     400 {object} rest.HttpError     "失败响应参数"
// @Router      /timestamp-blacklist [put]
func (s *Service) PutTimestampBlacklist(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	var req domain.PutTimestampBlacklistReq
	//var req []string
	valid, errs := form_validator.BindJsonAndValid(c, &req)
	if !valid {
		log.WithContext(ctx).Error(errs.Error())
		c.Writer.WriteHeader(http.StatusBadRequest)
		_, ok := errs.(form_validator.ValidErrors)
		if ok {
			ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, errs))
		} else {
			ginx.ResErrJson(c, errorcode.Desc(errorcode.PublicInvalidParameterJson))
		}
		return
	}

	err = s.uc.SetTimestampBlacklist(ctx, req.TimestampBlacklist)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, true)
}

// PutGovernmentDataShare
// @Summary     设置共享配置
// @Description 设置共享配置
// @Tags        共享配置开关
// @Accept      application/json
// @Produce     json
// @Param 		data body domain.PutGovernmentDataShareReq true "设置共享配置请求体"
// @Success     200  "成功响应参数"
// @Failure     400 {object} rest.HttpError     "失败响应参数"
// @Router      /government-data-share [put]
func (s *Service) PutGovernmentDataShare(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()

	var req domain.PutGovernmentDataShareReq
	valid, errs := form_validator.BindJsonAndValid(c, &req)
	if !valid {
		log.WithContext(ctx).Error(errs.Error())
		c.Writer.WriteHeader(http.StatusBadRequest)
		_, ok := errs.(form_validator.ValidErrors)
		if ok {
			ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, errs))
		} else {
			ginx.ResErrJson(c, errorcode.Desc(errorcode.PublicInvalidParameterJson))
		}
		return
	}

	err = s.uc.PutGovernmentDataShare(ctx, &req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, nil)
}

// GetGovernmentDataShare
// @Summary     查询共享配置
// @Description 查询共享配置
// @Tags        共享配置开关
// @Accept      application/json
// @Produce     json
// @Success     200 object domain.GetGovernmentDataShareRes  "成功响应参数"
// @Failure     400 {object} rest.HttpError     "失败响应参数"
// @Router      /government-data-share [get]
func (s *Service) GetGovernmentDataShare(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	res, err := s.uc.GetGovernmentDataShare(ctx)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, res)
}

// GetCssjjStatus
// @Summary     查询cssjj配置状态
// @Description 查询cssjj配置是否启用
// @Tags        cssjj配置
// @Accept      application/json
// @Produce     json
// @Success     200 object domain.GetCssjjStatusRes  "成功响应参数"
// @Failure     400 {object} rest.HttpError     "失败响应参数"
// @Router      /cssjj/status [get]
func (s *Service) GetCssjjStatus(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	res, err := s.uc.GetCssjjStatus(ctx)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, res)
}

// GetApplicationVersion
// @Summary     获取应用版本信息
// @Description 获取应用版本信息
// @Tags        应用版本信息
// @Accept      application/json
// @Produce     json
// @Success     200 object domain.GetApplicationVersionRes  "成功响应参数"
// @Failure     400 {object} rest.HttpError     "失败响应参数"
// @Router      /application/version [get]
func (s *Service) GetApplicationVersion(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	res, err := s.uc.GetApplicationVersion(ctx)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, res)
}

// GetEnumConfig  godoc
// @Summary      获取表单枚举配置
// @Description  GetEnumConfig Description
// @Accept       text/plain
// @Produce      application/json
// @Tags         配置
// @Success      200 {object} domain.EnumObject "form enum config"
// @Failure      400 {object} rest.HttpError
// @Router       /enum-config [get]
func (b *Service) GetEnumConfig(context *gin.Context) {
	ginx.ResOKJson(context, domain.GetEnumConfig())
}
