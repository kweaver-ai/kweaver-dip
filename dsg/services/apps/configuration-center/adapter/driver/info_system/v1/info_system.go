package v1

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/form_validator"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/models/response"
	_ "github.com/kweaver-ai/dsg/services/apps/configuration-center/common/models/response"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/user_util"
	domain "github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/info_system"
	_ "github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/repository/db/model"
	_ "github.com/kweaver-ai/idrm-go-frame/core/transport/rest"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest/ginx"
)

type Service struct {
	uc domain.UseCase
}

func NewService(uc domain.UseCase) *Service {
	return &Service{
		uc: uc,
	}
}

// PageInfoSystem
// @Summary     查询信息系统列表
// @Description 查询信息系统列表
// @Tags        open信息系统
// @Accept      x-www-form-urlencoded
// @Produce     json
// @Param       _  query    domain.QueryPageReqParam  false "查询参数"
// @Success     200 {object} domain.QueryPageRes  "成功响应参数"
// @Failure     400 {object} rest.HttpError     "失败响应参数"
// @Router      /info-system [get]
func (s *Service) PageInfoSystem(c *gin.Context) {
	req := &domain.QueryPageReqParam{}
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
	res, err := s.uc.GetInfoSystems(c, req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, res)

}

// GetInfoSystem
// @Summary     查询单个信息系统
// @Description 查询单个信息系统
// @Tags        open信息系统
// @Accept      x-www-form-urlencoded
// @Produce     json
// @Param 		id path string  true "信息系统标识"
// @Success     200 {object} model.InfoSystem  "成功响应参数"
// @Failure     400 {object} rest.HttpError     "失败响应参数"
// @Router      /info-system/{id} [get]
func (s *Service) GetInfoSystem(c *gin.Context) {
	req := &domain.GetInfoSystemReq{}
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
	res, err := s.uc.GetInfoSystem(c, req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, res)

}

// NameRepeat godoc
// @Summary     查询信息系统名称是否重复
// @Description 查询信息系统名称是否重复
// @Tags        信息系统
// @Accept      x-www-form-urlencoded
// @Produce     json
// @Param       _   query    domain.NameRepeatReq     true "查询参数"
// @Success     200 {string} string "true"
// @Failure     400 {object} rest.HttpError           "失败响应参数"
// @Router      /info-system/repeat [get]
func (s *Service) NameRepeat(c *gin.Context) {
	req := &domain.NameRepeatReq{}
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
	res, err := s.uc.CheckInfoSystemRepeat(c, req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, res)
}

// CreateInfoSystem
// @Summary     新建信息系统
// @Description 新建信息系统
// @Tags        信息系统
// @Accept      application/json
// @Produce     json
// @Param       _   body    domain.CreateInfoSystem  true "新建信息系统参数"
// @Success     200 {object}  response.NameIDResp "成功响应参数"
// @Failure     400 {object} rest.HttpError     "失败响应参数"
// @Router      /info-system [post]
func (s *Service) CreateInfoSystem(c *gin.Context) {
	req := &domain.CreateInfoSystem{}
	valid, errs := form_validator.BindJsonAndValid(c, req)
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
	res, err := s.uc.CreateInfoSystem(c, req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, res)

}

// ModifyInfoSystem
// @Summary     修改信息系统
// @Description 修改信息系统
// @Tags        信息系统
// @Accept      application/json
// @Produce     json
// @Param 		id path string  true "信息系统标识"
// @Param       _   body    domain.ModifyInfoSystemReq  true "修改信息系统参数"
// @Success     200 {object}  response.NameIDResp "成功响应参数"
// @Failure     400 {object} rest.HttpError     "失败响应参数"
// @Router      /info-system/{id} [put]
func (s *Service) ModifyInfoSystem(c *gin.Context) {
	InfoSystemId := &domain.InfoSystemId{}
	valid, errs := form_validator.BindUriAndValid(c, InfoSystemId)
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

	req := &domain.ModifyInfoSystemReq{}
	valid, errs = form_validator.BindJsonAndValid(c, req)
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

	req.ID = InfoSystemId.ID

	res, err := s.uc.ModifyInfoSystem(c, req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, res)
}

// DeleteInfoSystem
// @Summary     删除信息系统
// @Description 删除信息系统
// @Tags        信息系统
// @Accept      application/json
// @Produce     json
// @Param 		id path string  true "信息系统标识"
// @Success     200 {object}  response.NameIDResp "成功响应参数"
// @Failure     400 {object} rest.HttpError     "失败响应参数"
// @Router      /info-system/{id} [delete]
func (s *Service) DeleteInfoSystem(c *gin.Context) {
	req := &domain.InfoSystemId{}
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
	res, err := s.uc.DeleteInfoSystem(c, req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, res)
}

// GetInfoSystemPrecision
// @Summary     查询信息系统
// @Description 查询信息系统
// @Tags        open信息系统
// @Accept      x-www-form-urlencoded
// @Produce     json
// @Param       _  query    domain.GetInfoSystemByIdsReq  true "查询参数"
// @Success     200 {array} domain.GetInfoSystemByIdsRes "成功响应参数"
// @Failure     400 {object} rest.HttpError     "失败响应参数"
// @Router      /info-system/precision [get]
func (s *Service) GetInfoSystemPrecision(c *gin.Context) {
	req := &domain.GetInfoSystemByIdsReq{}
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
	res, err := s.uc.GetInfoSystemByIds(c, req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, res)

}

// EnqueueInfoSystem
// @Summary 入队信息系统
func (s *Service) EnqueueInfoSystem(c *gin.Context) {
	InfoSystemId := &domain.InfoSystemId{}
	valid, errs := form_validator.BindUriAndValid(c, InfoSystemId)
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

	if err := s.uc.EnqueueInfoSystem(c, InfoSystemId.ID); err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, nil)
}

// EnqueueInfoSystems
// @Summary 入队信息系统
func (s *Service) EnqueueInfoSystems(c *gin.Context) {
	res, err := s.uc.EnqueueInfoSystems(c)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, res)
}

// @Summary     注册信息系统
// @Description 注册信息系统
// @Tags        信息系统
// @Accept      application/json
// @Produce     json
// @Param 		id path string  true "信息系统标识"
// @Param       _   body    domain.RegisterInfoSystem  true "修改信息系统参数"
// @Success     200 {object}  response.NameIDResp2 "成功响应参数"
// @Failure     400 {object} rest.HttpError     "失败响应参数"
// @Router      /info-system/{id}/register [put]
func (s *Service) RegisterInfoSystem(c *gin.Context) {
	InfoSystemId := &domain.InfoSystemId{}
	valid, errs := form_validator.BindUriAndValid(c, InfoSystemId)
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
	req := &domain.RegisterInfoSystem{}
	valid, errs = form_validator.BindJsonAndValid(c, req)
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

	userInfo, err := user_util.ObtainUserInfo(c)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicRequestParameterError, err))
		return
	}

	res, err := s.uc.RegisterInfoSystem(c, InfoSystemId.ID, req, userInfo)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, res)
}

// SystemIdentifierRepeat  godoc
// @Summary     检查系统标识是否重复
// @Description 检查系统标识是否重复
// @Accept      application/json
// @Produce     application/json
// @Tags        信息系统
// @Param       name   query    string     true "系统标识名称"
// @Param       id   query    string     false "系统标识Id"
// @Success     200 {string} string "true"
// @Failure     400 {object} rest.HttpError
// @Router      /info-system/system_identifier/repeat [get]
func (s *Service) SystemIdentifierRepeat(c *gin.Context) {
	var err error
	// ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	// defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	req := &domain.IdentifierRepeat{}
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
	err = s.uc.SystemIdentifierRepeat(c, req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, response.CheckRepeatResp{Name: req.Identifier, Repeat: false})

}
