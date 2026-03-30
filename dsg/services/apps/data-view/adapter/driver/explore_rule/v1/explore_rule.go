package v1

import (
	"github.com/gin-gonic/gin"
	"github.com/kweaver-ai/dsg/services/apps/data-view/common/form_validator"
	"github.com/kweaver-ai/dsg/services/apps/data-view/common/models/response"
	"github.com/kweaver-ai/dsg/services/apps/data-view/common/util"
	"github.com/kweaver-ai/dsg/services/apps/data-view/domain/explore_rule"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest/ginx"
)

var _ = new(response.BoolResp)

type ExploreRuleService struct {
	uc explore_rule.ExploreRuleUseCase
}

func NewExploreRuleService(uc explore_rule.ExploreRuleUseCase) *ExploreRuleService {
	return &ExploreRuleService{uc: uc}
}

// CreateTemplateRule 新建模板规则
// @Description 新建模板规则
// @Tags        模板规则
// @Summary     新建模板规则
// @Accept      json
// @Produce     json
// @Param       Authorization     header   string   true 			"token"
// @Param       _     body       explore_rule.CreateTemplateRuleReq true 	"请求参数"
// @Success     201       {object} explore_rule.TemplateRuleIDResp    	"成功响应参数"
// @Failure     400       {object} rest.HttpError            		"失败响应参数"
// @Router      /template-rule [post]
func (f *ExploreRuleService) CreateTemplateRule(c *gin.Context) {
	req := form_validator.Valid[explore_rule.CreateTemplateRuleReq](c)
	if req == nil {
		return
	}
	res, err := util.TraceA1R2(c, req, f.uc.CreateTemplateRule)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}

	c.JSON(201, res)
}

// GetTemplateRuleList 获取模板规则列表
// @Description	获取模板规则列表
// @Tags		模板规则
// @Summary		获取模板规则列表
// @Accept		application/json
// @Produce		application/json
// @Param		Authorization	header		string	true	"token"
// @Param       _     query       explore_rule.GetTemplateRuleListReq true 	"请求参数"
// @Success		200				{array}	explore_rule.GetTemplateRuleListResp	"成功响应参数"
// @Failure		400				{object}	rest.HttpError			    "失败响应参数"
// @Router		/template-rule [get]
func (f *ExploreRuleService) GetTemplateRuleList(c *gin.Context) {
	req := form_validator.Valid[explore_rule.GetTemplateRuleListReq](c)
	if req == nil {
		return
	}

	res, err := util.TraceA1R2(c, req, f.uc.GetTemplateRuleList)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}

	ginx.ResOKJson(c, res)
}

// GetTemplateRule 获取模板规则详情
// @Description	获取模板规则详情
// @Tags		模板规则
// @Summary		获取模板规则详情
// @Accept		application/json
// @Produce		application/json
// @Param		Authorization	header		string	true	"token"
// @Param       id				path		string	true	"规则ID"
// @Success		200				{object}	explore_rule.GetTemplateRuleResp	"成功响应参数"
// @Failure		400				{object}	rest.HttpError			    "失败响应参数"
// @Router		/template-rule/{id} [get]
func (f *ExploreRuleService) GetTemplateRule(c *gin.Context) {
	req := form_validator.Valid[explore_rule.GetTemplateRuleReq](c)
	if req == nil {
		return
	}

	res, err := util.TraceA1R2(c, req, f.uc.GetTemplateRule)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}

	ginx.ResOKJson(c, res)
}

// TemplateRuleNameRepeat 模板规则重名校验
// @Description	模板规则重名校验
// @Tags		模板规则
// @Summary		模板规则重名校验
// @Accept		application/json
// @Produce		application/json
// @Param		Authorization	header		string	true	"token"
// @Param       _     query       explore_rule.TemplateRuleNameRepeatReq true 	"请求参数"
// @Success		200				{object}	response.BoolResp "成功响应参数"
// @Failure		400				{object}	rest.HttpError			    "失败响应参数"
// @Router		/template-rule/repeat [get]
func (f *ExploreRuleService) TemplateRuleNameRepeat(c *gin.Context) {
	req := form_validator.Valid[explore_rule.TemplateRuleNameRepeatReq](c)
	if req == nil {
		return
	}

	res, err := util.TraceA1R2(c, req, f.uc.TemplateRuleNameRepeat)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}

	ginx.ResOKJson(c, res)
}

// UpdateTemplateRule 修改模板规则
// @Description	修改模板规则
// @Tags		模板规则
// @Summary		修改模板规则
// @Accept		json
// @Produce		json
// @Param		Authorization 	header 		string	true	"token"
// @Param       id				path		string	true	"规则ID"
// @Param		_     			body      	explore_rule.CreateTemplateRuleReqBody true 	"请求参数"
// @Success		200				{object}	explore_rule.TemplateRuleIDResp	"成功响应参数"
// @Failure		400				{object}	rest.HttpError					"失败响应参数"
// @Router		/template-rule/{id} [put]
func (f *ExploreRuleService) UpdateTemplateRule(c *gin.Context) {
	req := form_validator.Valid[explore_rule.UpdateTemplateRuleReq](c)
	if req == nil {
		return
	}

	res, err := util.TraceA1R2(c, req, f.uc.UpdateTemplateRule)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}

	ginx.ResOKJson(c, res)
}

// UpdateTemplateRuleStatus 修改模板规则启用状态
// @Description	修改模板规则启用状态
// @Tags		模板规则
// @Summary		修改模板规则启用状态
// @Accept		json
// @Produce		json
// @Param		Authorization 	header 		string	true	"token"
// @Param		_     			body      	explore_rule.UpdateTemplateRuleStatusReqBody true 	"请求参数"
// @Success		200				{object}	response.BoolResp "成功响应参数"
// @Failure		400				{object}	rest.HttpError					"失败响应参数"
// @Router		/template-rule/status [put]
func (f *ExploreRuleService) UpdateTemplateRuleStatus(c *gin.Context) {
	req := form_validator.Valid[explore_rule.UpdateTemplateRuleStatusReq](c)
	if req == nil {
		return
	}

	res, err := util.TraceA1R2(c, req, f.uc.UpdateTemplateRuleStatus)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}

	ginx.ResOKJson(c, res)
}

// DeleteTemplateRule 删除模板规则
// @Description	删除模板规则
// @Tags		模板规则
// @Summary		删除模板规则
// @Accept		json
// @Produce		json
// @Param		Authorization	header		string	true	"token"
// @Param       id				path		string	true	"规则ID"
// @Success		200				{object}	explore_rule.TemplateRuleIDResp	"成功响应参数"
// @Failure		400				{object}	rest.HttpError			     	"失败响应参数"
// @Router		/template-rule/{id} [delete]
func (f *ExploreRuleService) DeleteTemplateRule(c *gin.Context) {
	req := form_validator.Valid[explore_rule.DeleteTemplateRuleReq](c)
	if req == nil {
		return
	}

	res, err := util.TraceA1R2(c, req, f.uc.DeleteTemplateRule)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}

	ginx.ResOKJson(c, res)
}

// CreateRule 新建规则
// @Description 新建规则
// @Tags        探查规则（新）
// @Summary     新建规则
// @Accept      json
// @Produce     json
// @Param       Authorization     header   string   true 			"token"
// @Param       _     body       explore_rule.CreateRuleReq true 	"请求参数"
// @Success     201       {object} explore_rule.RuleIDResp    	"成功响应参数"
// @Failure     400       {object} rest.HttpError            		"失败响应参数"
// @Router      /explore-rule [post]
func (f *ExploreRuleService) CreateRule(c *gin.Context) {
	req := form_validator.Valid[explore_rule.CreateRuleReq](c)
	if req == nil {
		return
	}
	res, err := util.TraceA1R2(c, req, f.uc.CreateRule)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}

	c.JSON(201, res)
}

// BatchCreateRule 批量添加规则
// @Description 批量添加规则
// @Tags        探查规则（新）
// @Summary     批量添加规则
// @Accept      json
// @Produce     json
// @Param       Authorization     header   string   true 			"token"
// @Param       _     body       explore_rule.BatchCreateRuleReq true 	"请求参数"
// @Success     201       {object} explore_rule.BatchCreateRuleResp    	"成功响应参数"
// @Failure     400       {object} rest.HttpError            		"失败响应参数"
// @Router      /explore-rule/batch [post]
func (f *ExploreRuleService) BatchCreateRule(c *gin.Context) {
	req := form_validator.Valid[explore_rule.BatchCreateRuleReq](c)
	if req == nil {
		return
	}
	res, err := util.TraceA1R2(c, req, f.uc.BatchCreateRule)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}

	c.JSON(201, res)
}

// GetRuleList 获取规则列表
// @Description	获取规则列表
// @Tags		探查规则（新）
// @Summary		获取规则列表
// @Accept		application/json
// @Produce		application/json
// @Param		Authorization	header		string	true	"token"
// @Param       _     query       explore_rule.GetRuleListReq true 	"请求参数"
// @Success		200				{array}	explore_rule.GetRuleResp	"成功响应参数"
// @Failure		400				{object}	rest.HttpError			    "失败响应参数"
// @Router		/explore-rule [get]
func (f *ExploreRuleService) GetRuleList(c *gin.Context) {
	req := form_validator.Valid[explore_rule.GetRuleListReq](c)
	if req == nil {
		return
	}

	res, err := util.TraceA1R2(c, req, f.uc.GetRuleList)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}

	ginx.ResOKJson(c, res)
}

// GetRule 获取规则详情
// @Description	获取规则详情
// @Tags		探查规则（新）
// @Summary		获取规则详情
// @Accept		application/json
// @Produce		application/json
// @Param		Authorization	header		string	true	"token"
// @Param       id				path		string	true	"规则ID"
// @Success		200				{object}	explore_rule.GetRuleResp	"成功响应参数"
// @Failure		400				{object}	rest.HttpError			    "失败响应参数"
// @Router		/explore-rule/{id} [get]
func (f *ExploreRuleService) GetRule(c *gin.Context) {
	req := form_validator.Valid[explore_rule.GetRuleReq](c)
	if req == nil {
		return
	}

	res, err := util.TraceA1R2(c, req, f.uc.GetRule)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}

	ginx.ResOKJson(c, res)
}

// NameRepeat 规则重名校验
// @Description	规则重名校验
// @Tags		探查规则（新）
// @Summary		规则重名校验
// @Accept		application/json
// @Produce		application/json
// @Param		Authorization	header		string	true	"token"
// @Param       _     query       explore_rule.NameRepeatReq true 	"请求参数"
// @Success		200				{object}	response.BoolResp "成功响应参数"
// @Failure		400				{object}	rest.HttpError			    "失败响应参数"
// @Router		/explore-rule/repeat [get]
func (f *ExploreRuleService) NameRepeat(c *gin.Context) {
	req := form_validator.Valid[explore_rule.NameRepeatReq](c)
	if req == nil {
		return
	}

	res, err := util.TraceA1R2(c, req, f.uc.NameRepeat)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}

	ginx.ResOKJson(c, res)
}

// UpdateRule 修改规则
// @Description	修改规则
// @Tags		探查规则（新）
// @Summary		修改规则
// @Accept		json
// @Produce		json
// @Param		Authorization 	header 		string	true	"token"
// @Param       id				path		string	true	"规则ID"
// @Param		_     			body      	explore_rule.UpdateRuleReqBody true 	"请求参数"
// @Success		200				{object}	explore_rule.RuleIDResp	"成功响应参数"
// @Failure		400				{object}	rest.HttpError					"失败响应参数"
// @Router		/explore-rule/{id} [put]
func (f *ExploreRuleService) UpdateRule(c *gin.Context) {
	req := form_validator.Valid[explore_rule.UpdateRuleReq](c)
	if req == nil {
		return
	}

	res, err := util.TraceA1R2(c, req, f.uc.UpdateRule)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}

	ginx.ResOKJson(c, res)
}

// UpdateRuleStatus 修改规则启用状态
// @Description	修改规则启用状态
// @Tags		探查规则（新）
// @Summary		修改规则启用状态
// @Accept		json
// @Produce		json
// @Param		Authorization 	header 		string	true	"token"
// @Param		_     			body      	explore_rule.UpdateRuleStatusReqBody true 	"请求参数"
// @Success		200				{object}	response.BoolResp "成功响应参数"
// @Failure		400				{object}	rest.HttpError					"失败响应参数"
// @Router		/explore-rule/status [put]
func (f *ExploreRuleService) UpdateRuleStatus(c *gin.Context) {
	req := form_validator.Valid[explore_rule.UpdateRuleStatusReq](c)
	if req == nil {
		return
	}

	res, err := util.TraceA1R2(c, req, f.uc.UpdateRuleStatus)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}

	ginx.ResOKJson(c, res)
}

// DeleteRule 删除规则
// @Description	删除规则
// @Tags		探查规则（新）
// @Summary		删除规则
// @Accept		json
// @Produce		json
// @Param		Authorization	header		string	true	"token"
// @Param       id				path		string	true	"规则ID"
// @Success		200				{object}	explore_rule.RuleIDResp	"成功响应参数"
// @Failure		400				{object}	rest.HttpError			     	"失败响应参数"
// @Router		/explore-rule/{id} [delete]
func (f *ExploreRuleService) DeleteRule(c *gin.Context) {
	req := form_validator.Valid[explore_rule.DeleteRuleReq](c)
	if req == nil {
		return
	}

	res, err := util.TraceA1R2(c, req, f.uc.DeleteRule)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}

	ginx.ResOKJson(c, res)
}
