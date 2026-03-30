package indicator_dimensional_rule

import (
	"encoding/json"
	"errors"
	"github.com/kweaver-ai/dsg/services/apps/auth-service/domain/indicator_dimensional_rule"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"github.com/kweaver-ai/dsg/services/apps/auth-service/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/auth-service/common/form_validator"
	auth_service_v1 "github.com/kweaver-ai/idrm-go-common/api/auth-service/v1"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest/ginx"
)

type Controller struct {
	Domain indicator_dimensional_rule.UseCase
}

func New(domain indicator_dimensional_rule.UseCase) *Controller {
	return &Controller{Domain: domain}
}

// Create 创建
//
//	@Summary	创建指标维度规则
//	@Tags		指标维度规则
//	@Accept		json
//	@Produce	json
//	@Param		_	body		auth_service_v1.IndicatorDimensionalRule	true	"请求参数"
//	@Success	200	{object}	auth_service_v1.IndicatorDimensionalRule	"成功响应参数"
//	@Failure	400	{object}	rest.HttpError								"失败响应参数"
//	@Router		/api/auth-service/v1/indicator-dimensional-rules [POST]
func (ctrl *Controller) Create(c *gin.Context) {
	// Body 参数
	rule := &auth_service_v1.IndicatorDimensionalRule{}
	if _, err := form_validator.BindJsonAndValid(c, rule); isJSONSyntaxError(err) {
		ginx.AbortResponseWithCode(c, http.StatusBadRequest, errorcode.Desc(errorcode.PublicInvalidParameterJson))
		return
	} else if err != nil {
		ginx.AbortResponseWithCode(c, http.StatusBadRequest, errorcode.Detail(errorcode.PublicInvalidParameter, err))
		return
	}

	// TODO: Completion

	// TODO: Validation

	result, err := ctrl.Domain.Create(c, rule)
	if err != nil {
		// TODO: 不同错误码对应不同的 http status code
		ginx.AbortResponseWithCode(c, http.StatusInternalServerError, err)
		return
	}

	ginx.ResOKJson(c, result)
}

// Delete 删除
//
//	@Summary	删除指标维度规则
//	@Tags		指标维度规则
//	@Accept		json
//	@Produce	json
//	@Param		id	path		string										true	"指标维度规则 ID"	Format(uuid)
//	@Success	200	{object}	auth_service_v1.IndicatorDimensionalRule	"成功响应参数"
//	@Failure	400	{object}	rest.HttpError								"失败响应参数"
//	@Router		/api/auth-service/v1/indicator-dimensional-rules/{id} [DELETE]
func (ctrl *Controller) Delete(c *gin.Context) {
	// Path 参数
	id := c.Param("id")
	if _, err := uuid.Parse(id); err != nil {
		ginx.AbortResponseWithCode(c, http.StatusBadRequest, errorcode.Detail(errorcode.PublicInvalidParameter, form_validator.ValidErrors{{Key: "id", Message: "id 必须是一个有效的 uuid"}}))
		return
	}

	// TODO: Validation

	result, err := ctrl.Domain.Delete(c, id)
	if err != nil {
		// TODO: 不同错误码对应不同的 http status code
		ginx.AbortResponseWithCode(c, http.StatusInternalServerError, err)
		return
	}

	ginx.ResOKJson(c, result)
}

// UpdateSpec 更新 Spec
//
//	@Summary	更新指标维度规则 Spec
//	@Tags		指标维度规则
//	@Accept		json
//	@Produce	json
//	@Param		id	path		string											true	"指标维度规则 ID"	Format(uuid)
//	@Param		_	body		auth_service_v1.IndicatorDimensionalRuleSpec	true	"请求参数"
//	@Success	200	{object}	auth_service_v1.IndicatorDimensionalRule		"成功响应参数"
//	@Failure	400	{object}	rest.HttpError									"失败响应参数"
//	@Router		/api/auth-service/v1/indicator-dimensional-rules/{id}/spec [PUT]
func (ctrl *Controller) UpdateSpec(c *gin.Context) {
	// Path 参数
	id := c.Param("id")
	if _, err := uuid.Parse(id); err != nil {
		ginx.AbortResponseWithCode(c, http.StatusBadRequest, errorcode.Detail(errorcode.PublicInvalidParameter, form_validator.ValidErrors{{Key: "id", Message: "id 必须是一个有效的 uuid"}}))
		return
	}
	// Body 参数
	spec := &auth_service_v1.IndicatorDimensionalRuleSpec{}
	if _, err := form_validator.BindJsonAndValid(c, spec); isJSONSyntaxError(err) {
		ginx.AbortResponseWithCode(c, http.StatusBadRequest, errorcode.Desc(errorcode.PublicInvalidParameterJson))
		return
	} else if err != nil {
		ginx.AbortResponseWithCode(c, http.StatusBadRequest, errorcode.Detail(errorcode.PublicInvalidParameter, err))
		return
	}

	// TODO: Completion

	// TODO: Validation

	result, err := ctrl.Domain.UpdateSpec(c, id, spec)
	if err != nil {
		// TODO: 不同错误码对应不同的 http status code
		ginx.AbortResponseWithCode(c, http.StatusInternalServerError, err)
		return
	}

	ginx.ResOKJson(c, result)
}

// Get 指标维度规则
//
//	@Summary	获取指标维度规则
//	@Tags		指标维度规则
//	@Accept		json
//	@Produce	json
//	@Param		id	path		string										true	"指标维度规则 ID"	Format(uuid)
//	@Success	200	{object}	auth_service_v1.IndicatorDimensionalRule	"成功响应参数"
//	@Failure	400	{object}	rest.HttpError								"失败响应参数"
//	@Router		/api/auth-service/v1/indicator-dimensional-rules/{id} [get]
func (ctrl *Controller) Get(c *gin.Context) {
	// Path 参数
	id := c.Param("id")
	if _, err := uuid.Parse(id); err != nil {
		ginx.AbortResponseWithCode(c, http.StatusBadRequest, errorcode.Detail(errorcode.PublicInvalidParameter, form_validator.ValidErrors{{Key: "id", Message: "id 必须是一个有效的 uuid"}}))
		return
	}

	// TODO: Validation

	result, err := ctrl.Domain.Get(c, id)
	if err != nil {
		// TODO: 不同错误码对应不同的 http status code
		ginx.AbortResponseWithCode(c, http.StatusInternalServerError, err)
		return
	}

	ginx.ResOKJson(c, result)
}

// List 获取指标维度规则列表
//
//	@Summary	获取指标维度规则
//	@Tags		指标维度规则
//	@Accept		json
//	@Produce	json
//	@Param		_	query		auth_service_v1.IndicatorDimensionalRuleListOptions	true	"请求参数"
//	@Success	200	{object}	auth_service_v1.IndicatorDimensionalRuleList		"成功响应参数"
//	@Failure	400	{object}	rest.HttpError										"失败响应参数"
//	@Router		/api/auth-service/v1/indicator-dimensional-rules [GET]
func (ctrl *Controller) List(c *gin.Context) {
	// Query 参数
	opts := &auth_service_v1.IndicatorDimensionalRuleListOptions{}
	if err := opts.UnmarshalQuery(c.Request.URL.Query()); err != nil {
		ginx.AbortResponseWithCode(c, http.StatusBadRequest, errorcode.Desc(errorcode.PublicInvalidParameter))
		return
	}

	// TODO: Completion
	if opts.Offset == 0 {
		opts.Offset = 1
	}
	if opts.Limit == 0 {
		opts.Limit = 10
	}

	// TODO: Validation

	result, err := ctrl.Domain.List(c, opts)
	if err != nil {
		// TODO: 不同错误码对应不同的 http status code
		ginx.AbortResponseWithCode(c, http.StatusInternalServerError, err)
		return
	}

	ginx.ResOKJson(c, result)
}

// GetIndicatorDimensionalRules  批量查询维度列表
func (ctrl *Controller) GetIndicatorDimensionalRules(c *gin.Context) {
	req := &auth_service_v1.IndicatorDimensionalRuleListArgs{}
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
	result, err := ctrl.Domain.GetIndicatorDimensionalRules(c, req)
	if err != nil {
		ginx.AbortResponseWithCode(c, http.StatusInternalServerError, err)
		return
	}

	ginx.ResOKJson(c, result)
}

// GetIndicatorDimensionalRulesByIndicator  批量查询维度列表
func (ctrl *Controller) GetIndicatorDimensionalRulesByIndicator(c *gin.Context) {
	req := &auth_service_v1.IndicatorDimensionalByIndicatorRulesReq{}
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
	result, err := ctrl.Domain.GetIndicatorDimensionalRulesByIndicators(c, req)
	if err != nil {
		ginx.AbortResponseWithCode(c, http.StatusInternalServerError, err)
		return
	}

	ginx.ResOKJson(c, result)
}

func isJSONSyntaxError(err error) bool {
	var errPtr *json.SyntaxError
	return errors.As(err, &errPtr)
}
