package auth

import (
	"errors"
	"net/http"

	"github.com/kweaver-ai/dsg/services/apps/auth-service/domain/common_auth"
	"github.com/kweaver-ai/idrm-go-common/rest/authorization"

	"github.com/gin-gonic/gin"
	"github.com/kweaver-ai/dsg/services/apps/auth-service/common/dto"
	"github.com/kweaver-ai/dsg/services/apps/auth-service/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/auth-service/common/form_validator"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest/ginx"
)

type Controller struct {
	authDomain common_auth.Auth
}

func NewController(authDomain common_auth.Auth) *Controller {
	return &Controller{authDomain: authDomain}
}

// Create 策略创建
//
//	@Description	策略创建
//	@Tags			策略
//	@Summary		策略创建
//	@Accept			json
//	@Produce		json
//	@Param			_	body		dto.PolicyCreateReq	true	"请求参数"
//	@Success		200	{object}	rest.HttpError		"成功响应参数"
//	@Failure		400	{object}	rest.HttpError		"失败响应参数"
//	@Router			/api/auth-service/v1/policy [post]
func (s *Controller) Create(c *gin.Context) {
	req := &dto.PolicyCreateReq{}

	_, err := form_validator.BindAndValid(c, req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		if errors.As(err, &form_validator.ValidErrors{}) {
			ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
			return
		}

		ginx.ResErrJson(c, errorcode.Desc(errorcode.PublicRequestParameterError))
		return
	}

	if err := validateObjectTypeAndSubjectTypes(req.ObjectType, req.Subjects); err != nil {
		ginx.ResBadRequestJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, form_validator.NewValidErrorsForCommonFieldErrorList(err)))
		return
	}

	_, err = s.authDomain.Create(c.Request.Context(), req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}

	ginx.ResOKJson(c, errorcode.Success)
}

// Get 策略详情
//
//	@Description	策略详情
//	@Tags			open策略
//	@Summary		策略详情
//	@Accept			json
//	@Produce		json
//	@Param			_	query		dto.PolicyGetReq	true	"请求参数"
//	@Success		200	{object}	dto.PolicyGetRes	"成功响应参数"
//	@Failure		400	{object}	rest.HttpError		"失败响应参数"
//	@Router			/api/auth-service/v1/policy [get]
func (s *Controller) Get(c *gin.Context) {
	req := &dto.PolicyGetReq{}

	_, err := form_validator.BindAndValid(c, req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		if errors.As(err, &form_validator.ValidErrors{}) {
			ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
			return
		}
		ginx.ResErrJson(c, errorcode.Desc(errorcode.PublicRequestParameterError))
		return
	}
	data, err := s.authDomain.Get(c.Request.Context(), req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}

	ginx.ResOKJson(c, data)
}

// Update 策略更新
//
//	@Description	策略更新
//	@Tags			策略
//	@Summary		策略更新
//	@Accept			json
//	@Produce		json
//	@Param			_	body		dto.PolicyUpdateReq	true	"请求参数"
//	@Success		200	{object}	rest.HttpError		"成功响应参数"
//	@Failure		400	{object}	rest.HttpError		"失败响应参数"
//	@Router			/api/auth-service/v1/policy [put]
func (s *Controller) Update(c *gin.Context) {
	req := &dto.PolicyUpdateReq{}

	_, err := form_validator.BindAndValid(c, req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		if errors.As(err, &form_validator.ValidErrors{}) {
			ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
			return
		}

		ginx.ResErrJson(c, errorcode.Desc(errorcode.PublicRequestParameterError))
		return
	}

	if err := validateObjectTypeAndSubjectTypes(req.ObjectType, req.Subjects); err != nil {
		ginx.ResBadRequestJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, form_validator.NewValidErrorsForCommonFieldErrorList(err)))
		return
	}

	err = s.authDomain.Update(c.Request.Context(), req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}

	ginx.ResOKJson(c, errorcode.Success)
}

// Delete 策略删除
//
//	@Description	策略删除
//	@Tags			策略
//	@Summary		策略删除
//	@Accept			json
//	@Produce		json
//	@Param			_	query		dto.PolicyDeleteReq	true	"请求参数"
//	@Success		200	{object}	rest.HttpError		"成功响应参数"
//	@Failure		400	{object}	rest.HttpError		"失败响应参数"
//	@Router			/api/auth-service/v1/policy [delete]
func (s *Controller) Delete(c *gin.Context) {
	req := &dto.PolicyDeleteReq{}

	_, err := form_validator.BindAndValid(c, req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		if errors.As(err, &form_validator.ValidErrors{}) {
			ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
			return
		}

		ginx.ResErrJson(c, errorcode.Desc(errorcode.PublicRequestParameterError))
		return
	}

	err = s.authDomain.Delete(c.Request.Context(), req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}

	ginx.ResOKJson(c, errorcode.Success)
}

// Enforce 策略验证
//
//	@Description	策略验证
//	@Tags			策略
//	@Summary		策略验证
//	@Accept			json
//	@Produce		json
//	@Param			_	body		dto.PolicyEnforceReq	true	"请求参数"
//	@Success		200	{object}	dto.PolicyEnforceRes	"成功响应参数"
//	@Failure		400	{object}	rest.HttpError			"失败响应参数"
//	@Router			/api/auth-service/v1/enforce [post]
func (s *Controller) Enforce(c *gin.Context) {
	req := &dto.PolicyEnforceReq{}

	if _, err := form_validator.BindJsonAndValid(c, req); err != nil {
		switch err.(type) {
		case form_validator.ValidErrors:
			ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameterJson, err))
		default:
			ginx.ResErrJsonWithCode(c, http.StatusBadRequest, errorcode.Desc(errorcode.PublicInvalidParameterJson))
		}
		return
	}

	res, err := s.authDomain.Enforce(c.Request.Context(), *req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}

	ginx.ResOKJson(c, res)
}

// UserOperationCheck 当前用户的策略验证
//
//	@Description	策略验证
//	@Tags			策略
//	@Summary		策略验证
//	@Accept			json
//	@Produce		json
//	@Param			_	body		dto.PolicyEnforceReq	true	"请求参数"
//	@Success		200	{object}	dto.PolicyEnforceRes	"成功响应参数"
//	@Failure		400	{object}	rest.HttpError			"失败响应参数"
//	@Router			/api/auth-service/v1/enforce [post]
func (s *Controller) UserOperationCheck(c *gin.Context) {
	req := &dto.CurrentUserEnforce{}

	if _, err := form_validator.BindJsonAndValid(c, req); err != nil {
		switch err.(type) {
		case form_validator.ValidErrors:
			ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameterJson, err))
		default:
			ginx.ResErrJsonWithCode(c, http.StatusBadRequest, errorcode.Desc(errorcode.PublicInvalidParameterJson))
		}
		return
	}

	res, err := s.authDomain.CurrentUserEnforce(c.Request.Context(), req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}

	ginx.ResOKJson(c, res)
}

// GetObjectsBySubjectId 访问者拥有的资源
//
//	@Description	访问者拥有的资源
//	@Tags			策略
//	@Summary		访问者拥有的资源
//	@Accept			json
//	@Produce		json
//	@Param			_	query		dto.GetObjectsBySubjectIdReq	true	"请求参数"
//	@Success		200	{object}	dto.GetObjectsBySubjectIdRes	"成功响应参数"
//	@Failure		400	{object}	rest.HttpError					"失败响应参数"
//	@Router			/api/auth-service/v1/subject/objects [get]
func (s *Controller) GetObjectsBySubjectId(c *gin.Context) {
	req := &dto.GetObjectsBySubjectIdReq{}

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

	res, err := s.authDomain.GetObjectsBySubjectId(c.Request.Context(), req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}

	ginx.ResOKJson(c, res)
}

// QueryPolicyExpiredObjects 查询包含策略过期的object
func (s *Controller) QueryPolicyExpiredObjects(c *gin.Context) {
	query := &dto.QueryPolicyExpiredObjectsArgs{}
	c.ShouldBindQuery(query)

	res, err := s.authDomain.QueryPolicyExpiredObjects(c, query)
	if err != nil {
		ginx.ResErrJsonWithCode(c, http.StatusInternalServerError, err)
		return
	}
	ginx.ResOKJson(c, res)
}

// RuleEnforce 规则策略验证
//
//	@Description	规则策略验证，接口，视图的行列规则的权限验证
//	@Tags			策略
//	@Summary		规则策略验证
//	@Accept			json
//	@Produce		json
//	@Param			_	body		dto.RulePolicyEnforce		true	"请求参数"
//	@Success		200	{object}	dto.RulePolicyEnforceEffect	"成功响应参数"
//	@Failure		400	{object}	rest.HttpError				"失败响应参数"
//	@Router			/api/auth-service/v1/enforce [post]
func (s *Controller) RuleEnforce(c *gin.Context) {
	req := &dto.RulePolicyEnforce{}

	if _, err := form_validator.BindJsonAndValid(c, req); err != nil {
		switch err.(type) {
		case form_validator.ValidErrors:
			ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameterJson, err))
		default:
			ginx.ResErrJsonWithCode(c, http.StatusBadRequest, errorcode.Desc(errorcode.PublicInvalidParameterJson))
		}
		return
	}

	res, err := s.authDomain.CheckUserPermission(c.Request.Context(), req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}

	ginx.ResOKJson(c, res)
}

// ListSubViews 获取用户拥有权限的子视图（行列规则）列表
//
//	@Description	获取用户拥有权限的子视图（行列规则）列表
//	@Summary		获取用户拥有权限的子视图（行列规则）列表
//	@Accept			json
//	@Produce		json
//	@Param			_	query		dto.ListSubViewsReq	true	"请求参数"
//	@Success		200	{object}	dto.ListSubViewsRes	"成功响应参数"
//	@Failure		400	{object}	rest.HttpError		"失败响应参数"
//	@Router			/api/auth-service/v1/sub-views [get]
func (s *Controller) ListSubViews(c *gin.Context) {
	req := &dto.ListSubViewsReq{}

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

	// 补全参数
	completeListSubViewsReq(c, req)
	// 参数校验
	if err = validateListSubViewsReq(req); err != nil {
		ginx.ResErrJsonWithCode(c, http.StatusBadRequest, errorcode.Detail(errorcode.PublicRequestParameterError, err))
		return
	}

	res, err := s.authDomain.ListSubViews(c.Request.Context(), req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}

	ginx.ResOKJson(c, res)
}

// MenuResourceEnforce 权限资源策略验证
//
//	@Description	权限资源策略验证
//	@Tags			策略
//	@Summary		权限资源策略验证
//	@Accept			json
//	@Produce		json
//	@Param			_	body		dto.PolicyEnforceReq	true	"请求参数"
//	@Success		200	{object}	dto.PolicyEnforceRes	"成功响应参数"
//	@Failure		400	{object}	rest.HttpError			"失败响应参数"
//	@Router			/api/auth-service/v1/enforce [post]
func (s *Controller) MenuResourceEnforce(c *gin.Context) {
	req := &dto.MenuResourceEnforceArg{}
	if _, err := form_validator.BindUriAndValid(c, req); err != nil {
		ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameterJson, err))
		return
	}
	if _, err := form_validator.BindQueryAndValid(c, req); err != nil {
		ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameterJson, err))
		return
	}

	res, err := s.authDomain.MenuResourceEnforce(c.Request.Context(), req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}

	ginx.ResOKJson(c, res)
}

// MenuResourceActions 查询菜单资源的允许的操作
//
//	@Description	查询菜单资源的允许的操作
//	@Tags			策略
//	@Summary		查询菜单资源的允许的操作
//	@Accept			json
//	@Produce		json
//	@Param			_	body		dto.PolicyEnforceReq	true	"请求参数"
//	@Success		200	{object}	dto.PolicyEnforceRes	"成功响应参数"
//	@Failure		400	{object}	rest.HttpError			"失败响应参数"
//	@Router			/api/auth-service/v1/enforce [post]
func (s *Controller) MenuResourceActions(c *gin.Context) {
	req := &dto.MenuResourceActionsArg{}
	if _, err := form_validator.BindQueryAndValid(c, req); err != nil {
		ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameterJson, err))
		return
	}

	if req.ResourceType == "" {
		req.ResourceType = authorization.RESOURCE_TYPE_MENUS
	}

	res, err := s.authDomain.MenuResourceActions(c.Request.Context(), req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}

	ginx.ResOKJson(c, res)
}
