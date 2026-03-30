package v1

import (
	"github.com/gin-gonic/gin"
	"github.com/kweaver-ai/dsg/services/apps/data-view/common/form_validator"
	"github.com/kweaver-ai/dsg/services/apps/data-view/common/util"
	"github.com/kweaver-ai/dsg/services/apps/data-view/domain/grade_rule_group"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest/ginx"
)

type GradeRuleGroupService struct {
	uc grade_rule_group.GradeRuleGroupUseCase
}

func NewGradeRuleGroupService(uc grade_rule_group.GradeRuleGroupUseCase) *GradeRuleGroupService {
	return &GradeRuleGroupService{uc: uc}
}

// List 获取规则组列表
//
//	@Description	获取规则组列表数据
//	@Tags			规则组
//	@Summary		获取规则组列表
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string					true	"token"
//	@Param			query			query		grade_rule_group.GradeRuleGroupListReq	true	"查询参数"
//	@Success		200				{object}	grade_rule_group.GradeRuleGroupListResp	"成功响应参数"
//	@Failure		400				{object}	rest.HttpError			"失败响应参数"
//	@Router			/grade-rule-group [get]
func (f *GradeRuleGroupService) List(c *gin.Context) {
	req := form_validator.Valid[grade_rule_group.GradeRuleGroupListReq](c)
	if req == nil {
		return
	}

	resp, err := util.TraceA1R2(c, req, f.uc.List)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}

	ginx.ResOKJson(c, resp)
}

// Create 创建规则组
//
//	@Description	创建规则组数据
//	@Tags			规则组
//	@Summary		创建规则组
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string					true	"token"
//	@Param			body			body		grade_rule_group.GradeRuleGroupCreateReq	true	"请求参数"
//	@Success		200				{object}	grade_rule_group.GradeRuleGroupCreateResp	"成功响应参数"
//	@Failure		400				{object}	rest.HttpError			"失败响应参数"
//	@Router			/grade-rule-group [post]
func (f *GradeRuleGroupService) Create(c *gin.Context) {
	req := form_validator.Valid[grade_rule_group.GradeRuleGroupCreateReq](c)
	if req == nil {
		return
	}

	resp, err := util.TraceA1R2(c, req, f.uc.Create)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}

	ginx.ResOKJson(c, resp)
}

// Update 更新规则组
//
//	@Description	更新规则组数据
//	@Tags			规则组
//	@Summary		更新规则组
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string					true	"token"
//	@Param			id				path		string					true	"规则组ID"	Format(uuid) example:"88f78432-ee4e-43df-804c-4ccc4ff17f15"
//	@Param			body			body		grade_rule_group.GradeRuleGroupUpdateReq	true	"请求参数"
//	@Success		200				{object}	grade_rule_group.GradeRuleGroupUpdateResp	"成功响应参数"
//	@Failure		400				{object}	rest.HttpError			"失败响应参数"
//	@Router			/grade-rule-group/{id} [put]
func (f *GradeRuleGroupService) Update(c *gin.Context) {
	req := form_validator.Valid[grade_rule_group.GradeRuleGroupUpdateReq](c)
	if req == nil {
		return
	}

	resp, err := util.TraceA1R2(c, req, f.uc.Update)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}

	ginx.ResOKJson(c, resp)
}

// Delete 删除规则组
//
//	@Description	删除规则组数据
//	@Tags			规则组
//	@Summary		删除规则组
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string					true	"token"
//	@Param			id				path		string					true	"分级规则ID"	Format(uuid) example:"88f78432-ee4e-43df-804c-4ccc4ff17f15"
//	@Success		200				{object}	grade_rule_group.GradeRuleGroupDeleteResp	"成功响应参数"
//	@Failure		400				{object}	rest.HttpError			"失败响应参数"
//	@Router			/grade-rule-group/{id} [delete]
func (f *GradeRuleGroupService) Delete(c *gin.Context) {
	req := form_validator.Valid[grade_rule_group.GradeRuleGroupDeleteReq](c)
	if req == nil {
		return
	}

	resp, err := util.TraceA1R2(c, req, f.uc.Delete)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}

	ginx.ResOKJson(c, resp)
}

// Repeat 规则组名验重
//
//	@Description	规则组名验重操作
//	@Tags			规则组
//	@Summary		规则组名验重
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string					true	"token"
//	@Param			body			body		grade_rule_group.GradeRuleGroupRepeatReq	true	"请求参数"
//	@Success		200				{object}	grade_rule_group.GradeRuleGroupRepeatResp	"成功响应参数"
//	@Failure		400				{object}	rest.HttpError			"失败响应参数"
//	@Router			/grade-rule-group/repeat [post]
func (f *GradeRuleGroupService) Repeat(c *gin.Context) {
	req := form_validator.Valid[grade_rule_group.GradeRuleGroupRepeatReq](c)
	if req == nil {
		return
	}

	resp, err := util.TraceA1R2(c, req, f.uc.Repeat)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}

	ginx.ResOKJson(c, resp)
}

// Limited 规则组数量上限检查
//
//	@Description	规则组数量上限检查
//	@Tags			规则组
//	@Summary		规则组上限检查
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string					true	"token"
//	@Param			query			query		grade_rule_group.GradeRuleGroupLimitedReq	true	"查询参数"
//	@Success		200				{object}	grade_rule_group.GradeRuleGroupLimitedResp	"成功响应参数"
//	@Failure		400				{object}	rest.HttpError			"失败响应参数"
//	@Router			/grade-rule-group [get]
func (f *GradeRuleGroupService) Limited(c *gin.Context) {
	req := form_validator.Valid[grade_rule_group.GradeRuleGroupLimitedReq](c)
	if req == nil {
		return
	}

	resp, err := util.TraceA1R2(c, req, f.uc.Limited)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}

	ginx.ResOKJson(c, resp)
}
