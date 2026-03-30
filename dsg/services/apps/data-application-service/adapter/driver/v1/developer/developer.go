package developer

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

type DeveloperController struct {
	domain *domain.DeveloperDomain
}

func NewDeveloperController(d *domain.DeveloperDomain) *DeveloperController {
	return &DeveloperController{domain: d}
}

// DeveloperCreate 开发商创建
//
//	@Description	开发商创建
//	@Tags			开发商
//	@Summary		开发商创建
//	@Accept			json
//	@Produce		json
//	@Param			_	body		dto.DeveloperCreateReq	true	"请求参数"
//	@Success		200	{object}	rest.HttpError			"成功响应参数"
//	@Failure		400	{object}	rest.HttpError			"失败响应参数"
//	@Router			/api/data-application-service/v1/developers [post]
func (s *DeveloperController) DeveloperCreate(c *gin.Context) {
	req := &dto.DeveloperCreateReq{}

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

	err = s.domain.DeveloperCreate(c, req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}

	ginx.ResOKJson(c, errorcode.Success)
}

// DeveloperList 开发商列表
//
//	@Description	开发商列表
//	@Tags			开发商
//	@Summary		开发商列表
//	@Accept			json
//	@Produce		json
//	@Param			_	query		dto.DeveloperListReq	true	"请求参数"
//	@Success		200	{object}	dto.DeveloperListRes	"成功响应参数"
//	@Failure		400	{object}	rest.HttpError			"失败响应参数"
//	@Router			/api/data-application-service/v1/developers [get]
func (s *DeveloperController) DeveloperList(c *gin.Context) {
	req := &dto.DeveloperListReq{}

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

	resp, err := s.domain.DeveloperList(c, req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}

	ginx.ResOKJson(c, resp)
}

// DeveloperGet 开发商详情
//
//	@Description	开发商详情
//	@Tags			开发商
//	@Summary		开发商详情
//	@Accept			json
//	@Produce		json
//	@Param			_	query		dto.DeveloperGetReq	true	"请求参数"
//	@Success		200	{object}	dto.DeveloperGetRes	"成功响应参数"
//	@Failure		400	{object}	rest.HttpError		"失败响应参数"
//	@Router			/api/data-application-service/v1/developers/{id} [get]
func (s *DeveloperController) DeveloperGet(c *gin.Context) {
	req := &dto.DeveloperGetReq{}

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

	resp, err := s.domain.DeveloperGet(c, req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}

	ginx.ResOKJson(c, resp)
}

// DeveloperUpdate 开发商更新
//
//	@Description	开发商更新
//	@Tags			开发商
//	@Summary		开发商更新
//	@Accept			json
//	@Produce		json
//	@Param			id	path		string						true	"开发商id"
//	@Param			_	body		dto.DeveloperUpdateBodyReq	true	"请求参数"
//	@Success		200	{object}	rest.HttpError				"成功响应参数"
//	@Failure		400	{object}	rest.HttpError				"失败响应参数"
//	@Router			/api/data-application-service/v1/developers/{id} [put]
func (s *DeveloperController) DeveloperUpdate(c *gin.Context) {
	req := &dto.DeveloperUpdateReq{}

	_, err := form_validator.BindUriAndValid(c, &req.DeveloperUpdateUriReq)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		if errors.As(err, &form_validator.ValidErrors{}) {
			ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
			return
		}

		ginx.ResErrJson(c, errorcode.Desc(errorcode.PublicRequestParameterError))
		return
	}

	_, err = form_validator.BindJsonAndValid(c, &req.DeveloperUpdateBodyReq)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		if errors.As(err, &form_validator.ValidErrors{}) {
			ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
			return
		}

		ginx.ResErrJson(c, errorcode.Desc(errorcode.PublicRequestParameterError))
		return
	}

	err = s.domain.DeveloperUpdate(c, req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}

	ginx.ResOKJson(c, errorcode.Success)
}

// DeveloperDelete 开发商删除
//
//	@Description	开发商删除
//	@Tags			开发商
//	@Summary		开发商删除
//	@Accept			json
//	@Produce		json
//	@Param			id	path		string			true	"开发商id"
//	@Success		200	{object}	rest.HttpError	"成功响应参数"
//	@Failure		400	{object}	rest.HttpError	"失败响应参数"
//	@Router			/api/data-application-service/v1/developers/{id} [delete]
func (s *DeveloperController) DeveloperDelete(c *gin.Context) {
	req := &dto.DeveloperDeleteReq{}

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

	err = s.domain.DeveloperDelete(c, req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}

	ginx.ResOKJson(c, errorcode.Success)
}
