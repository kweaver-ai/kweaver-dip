package v1

import (
	"context"
	"github.com/kweaver-ai/idrm-go-common/interception"
	"github.com/kweaver-ai/idrm-go-common/middleware"
	"github.com/kweaver-ai/dsg/services/apps/data-view/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-view/domain/explore_rule"
	"github.com/kweaver-ai/dsg/services/apps/data-view/infrastructure/db/model"
	"github.com/kweaver-ai/idrm-go-frame/core/enum"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"encoding/json"
	"time"
)

func (e *exploreRuleUseCase) CreateTemplateRule(ctx context.Context, req *explore_rule.CreateTemplateRuleReq) (*explore_rule.TemplateRuleIDResp, error) {
	var err error
	var status int32
	if *req.Enable {
		status = 1
	}
	createdTime := time.Now()
	ruleModel := &model.TemplateRule{
		RuleName:        req.RuleName,
		RuleDescription: req.RuleDescription,
		RuleLevel:       enum.ToInteger[explore_rule.RuleLevel](req.RuleLevel).Int32(),
		Dimension:       enum.ToInteger[explore_rule.Dimension](req.Dimension).Int32(),
		Source:          explore_rule.SourceCustom.Integer.Int32(),
		RuleConfig:      req.RuleConfig,
		Enable:          status,
		CreatedAt:       &createdTime,
		CreatedByUID:    ctx.Value(interception.InfoName).(*middleware.User).ID,
		UpdatedAt:       &createdTime,
		UpdatedByUID:    ctx.Value(interception.InfoName).(*middleware.User).ID,
	}
	if req.DimensionType != "" {
		dimensionType := enum.ToInteger[explore_rule.DimensionType](req.DimensionType).Int32()
		ruleModel.DimensionType = &dimensionType
	}
	err = e.CheckTemplateRuleConfig(ctx, &req.CreateTemplateRuleReqBody)
	if err != nil {
		return nil, err
	}

	repeat, err := e.templateRuleRepo.NameRepeat(ctx, "", req.RuleName)
	if err != nil {
		return nil, err
	}
	if repeat {
		return nil, errorcode.Detail(errorcode.RuleConfigError, "rule_name重复")
	}

	ruleId, err := e.templateRuleRepo.Create(ctx, ruleModel)
	if err != nil {
		return nil, err
	}
	return &explore_rule.TemplateRuleIDResp{RuleID: ruleId}, nil
}

func (e *exploreRuleUseCase) CheckTemplateRuleConfig(ctx context.Context, req *explore_rule.CreateTemplateRuleReqBody) error {
	res := &explore_rule.TemplateRuleConfig{}
	if req.RuleConfig != nil {
		err := json.Unmarshal([]byte(*req.RuleConfig), res)
		if err != nil {
			log.WithContext(ctx).Errorf("解析模板规则配置失败，err is %v", err)
			return errorcode.Detail(errorcode.RuleConfigError, "规则配置错误")
		}
	}
	if req.DimensionType != "" {
		switch req.DimensionType {
		case explore_rule.DimensionTypeNull.String:
			if res.Null == nil {
				return errorcode.Detail(errorcode.RuleConfigError, "null配置必填")
			}
		case explore_rule.DimensionTypeDict.String:
			if res.Dict == nil {
				return errorcode.Detail(errorcode.RuleConfigError, "dict配置必填")
			}
		case explore_rule.DimensionTypeFormat.String:
			if res.Format == nil {
				return errorcode.Detail(errorcode.RuleConfigError, "format配置必填")
			}
		case explore_rule.DimensionTypeRowNull.String:
			if res.RowNull == nil {
				return errorcode.Detail(errorcode.RuleConfigError, "row_null配置必填")
			}
		case explore_rule.DimensionTypeCustom.String:
			if res.RuleExpression == nil {
				return errorcode.Detail(errorcode.RuleConfigError, "rule_expression配置必填")
			}
		}
	} else {
		if req.Dimension == explore_rule.DimensionTimeliness.String {
			if res.UpdatePeriod == nil || !explore_rule.ValidPeriods[*res.UpdatePeriod] {
				return errorcode.Detail(errorcode.RuleConfigError, "update_period配置必填,且为day week month quarter half_a_year year中的一个")
			}
		}
	}
	return nil
}

func (e *exploreRuleUseCase) GetTemplateRuleList(ctx context.Context, req *explore_rule.GetTemplateRuleListReq) ([]*explore_rule.GetTemplateRuleResp, error) {
	exploreRules := make([]*explore_rule.GetTemplateRuleResp, 0)
	rules, err := e.templateRuleRepo.GetList(ctx, req)
	if err != nil {
		return nil, err
	}
	for _, rule := range rules {
		exploreRule := convertToTemplateExploreRule(rule)
		exploreRules = append(exploreRules, exploreRule)
	}
	return exploreRules, nil
}

func (e *exploreRuleUseCase) GetTemplateRule(ctx context.Context, req *explore_rule.GetTemplateRuleReq) (*explore_rule.GetTemplateRuleResp, error) {
	rule, err := e.templateRuleRepo.GetByRuleId(ctx, req.RuleId)
	if err != nil {
		return nil, err
	}
	resp := convertToTemplateExploreRule(rule)
	return resp, nil
}
func (e *exploreRuleUseCase) TemplateRuleNameRepeat(ctx context.Context, req *explore_rule.TemplateRuleNameRepeatReq) (bool, error) {
	repeat, err := e.templateRuleRepo.NameRepeat(ctx, req.RuleId, req.RuleName)
	return repeat, err
}

func (e *exploreRuleUseCase) UpdateTemplateRule(ctx context.Context, req *explore_rule.UpdateTemplateRuleReq) (*explore_rule.TemplateRuleIDResp, error) {
	rule, err := e.templateRuleRepo.GetByRuleId(ctx, req.RuleId)
	if err != nil {
		return nil, err
	}
	repeat, err := e.templateRuleRepo.NameRepeat(ctx, rule.RuleID, req.RuleName)
	if err != nil {
		return nil, err
	}
	if repeat {
		return nil, errorcode.Detail(errorcode.RuleConfigError, "rule_name重复")
	}

	// 检查规则配置
	err = e.CheckTemplateRuleConfig(ctx, &req.CreateTemplateRuleReqBody)
	if err != nil {
		return nil, err
	}
	rule.RuleName = req.RuleName
	rule.RuleDescription = req.RuleDescription
	rule.RuleLevel = enum.ToInteger[explore_rule.RuleLevel](req.RuleLevel).Int32()
	rule.Dimension = enum.ToInteger[explore_rule.Dimension](req.Dimension).Int32()
	if req.DimensionType != "" {
		dimensionType := enum.ToInteger[explore_rule.DimensionType](req.DimensionType).Int32()
		rule.DimensionType = &dimensionType
	}
	rule.RuleConfig = req.RuleConfig
	var status int32
	if req.Enable != nil {
		if *req.Enable {
			status = 1
		}
		rule.Enable = status
	}
	err = e.templateRuleRepo.Update(ctx, rule)
	return &explore_rule.TemplateRuleIDResp{RuleID: req.RuleId}, err
}

func (e *exploreRuleUseCase) UpdateTemplateRuleStatus(ctx context.Context, req *explore_rule.UpdateTemplateRuleStatusReq) (bool, error) {
	err := e.templateRuleRepo.UpdateStatus(ctx, req.RuleId, *req.Enable)
	if err != nil {
		return false, err
	}
	return true, nil
}

func (e *exploreRuleUseCase) DeleteTemplateRule(ctx context.Context, req *explore_rule.DeleteTemplateRuleReq) (*explore_rule.TemplateRuleIDResp, error) {
	_, err := e.templateRuleRepo.GetByRuleId(ctx, req.RuleId)
	if err != nil {
		return nil, err
	}
	err = e.templateRuleRepo.Delete(ctx, req.RuleId)
	return &explore_rule.TemplateRuleIDResp{RuleID: req.RuleId}, err
}

func convertToTemplateExploreRule(rule *model.TemplateRule) *explore_rule.GetTemplateRuleResp {
	resp := &explore_rule.GetTemplateRuleResp{
		RuleId:          rule.RuleID,
		RuleName:        rule.RuleName,
		RuleDescription: rule.RuleDescription,
		RuleLevel:       enum.ToString[explore_rule.RuleLevel](rule.RuleLevel),
		Dimension:       enum.ToString[explore_rule.Dimension](rule.Dimension),
		RuleConfig:      rule.RuleConfig,
		Source:          enum.ToString[explore_rule.Source](rule.Source),
	}
	if rule.DimensionType != nil {
		resp.DimensionType = enum.ToString[explore_rule.DimensionType](*rule.DimensionType)
	}
	if rule.UpdatedAt != nil {
		resp.UpdatedAt = rule.UpdatedAt.UnixMilli()
	}
	if rule.Enable > 0 {
		resp.Enable = true
	}
	return resp
}
