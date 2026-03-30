package v1

import (
	"context"
	"encoding/json"
	"time"

	"github.com/kweaver-ai/idrm-go-common/interception"
	"github.com/kweaver-ai/idrm-go-common/middleware"
	"github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/gorm/explore_rule_config"
	repo "github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/gorm/form_view"
	fieldRepo "github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/gorm/form_view_field"
	"github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/gorm/template_rule"
	"github.com/kweaver-ai/dsg/services/apps/data-view/common/constant"
	"github.com/kweaver-ai/dsg/services/apps/data-view/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-view/domain/explore_rule"
	"github.com/kweaver-ai/dsg/services/apps/data-view/infrastructure/db/model"
	"github.com/kweaver-ai/idrm-go-frame/core/enum"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
)

type exploreRuleUseCase struct {
	repo             repo.FormViewRepo
	fieldRepo        fieldRepo.FormViewFieldRepo
	exploreRuleRepo  explore_rule_config.ExploreRuleConfigRepo
	templateRuleRepo template_rule.TemplateRuleRepo
}

func NewExploreRuleUseCase(
	repo repo.FormViewRepo,
	fieldRepo fieldRepo.FormViewFieldRepo,
	exploreRuleRepo explore_rule_config.ExploreRuleConfigRepo,
	templateRuleRepo template_rule.TemplateRuleRepo,
) explore_rule.ExploreRuleUseCase {
	uc := &exploreRuleUseCase{
		repo:             repo,
		fieldRepo:        fieldRepo,
		exploreRuleRepo:  exploreRuleRepo,
		templateRuleRepo: templateRuleRepo,
	}
	return uc
}

func (e *exploreRuleUseCase) CreateRule(ctx context.Context, req *explore_rule.CreateRuleReq) (*explore_rule.RuleIDResp, error) {
	var ruleLevel, formViewId string
	var field *model.FormViewField
	var err error
	var status, draft int32
	if *req.Enable {
		status = 1
	}
	if req.Draft != nil && *req.Draft {
		draft = 1
	}

	if req.FormViewId == "" && req.FieldId == "" {
		return nil, errorcode.Detail(errorcode.RuleConfigError, "form_view_id 和 field_id至少填一个")
	}
	if req.FormViewId != "" {
		_, err := e.repo.GetById(ctx, req.FormViewId)
		if err != nil {
			return nil, err
		}
		formViewId = req.FormViewId
	}
	if req.FieldId != "" {
		field, err = e.fieldRepo.GetField(ctx, req.FieldId)
		if err != nil {
			return nil, err
		}
		if formViewId == "" {
			formViewId = field.FormViewID
		} else {
			if field.FormViewID != formViewId {
				return nil, errorcode.Detail(errorcode.RuleConfigError, "该视图下无此字段")
			}
		}
	}
	createdTime := time.Now()
	ruleModel := &model.ExploreRuleConfig{
		RuleName:        req.RuleName,
		RuleDescription: req.RuleDescription,
		FormViewID:      formViewId,
		FieldID:         req.FieldId,
		TemplateID:      req.TemplateId,
		RuleConfig:      req.RuleConfig,
		Enable:          status,
		Draft:           draft,
		CreatedAt:       createdTime,
		CreatedByUID:    ctx.Value(interception.InfoName).(*middleware.User).ID,
		UpdatedAt:       createdTime,
		UpdatedByUID:    ctx.Value(interception.InfoName).(*middleware.User).ID,
	}
	if req.TemplateId != "" {
		repeat, err := e.exploreRuleRepo.CheckRuleByTemplateId(ctx, req.TemplateId, formViewId, req.FieldId)
		if err != nil {
			return nil, err
		}
		if repeat {
			return nil, errorcode.Desc(errorcode.RuleAlreadyExists)
		}
		rule, err := e.exploreRuleRepo.GetByTemplateId(ctx, req.TemplateId)
		if err != nil {
			return nil, err
		}
		ruleLevel = enum.ToString[explore_rule.RuleLevel](rule.RuleLevel)
		if req.RuleName != "" || req.RuleDescription != "" || req.RuleLevel != "" || req.Dimension != "" {
			return nil, errorcode.Detail(errorcode.RuleConfigError, "内置规则rule_name,rule_description,rule_level,dimension不用传")
		}
		if rule.RuleLevel == explore_rule.RuleLevelField.Integer.Int32() && req.FieldId == "" {
			return nil, errorcode.Detail(errorcode.RuleConfigError, "field_id 必填")
		}
		//if req.FieldId != "" && !explore_rule.ColTypeRuleMap[constant.SimpleTypeMapping[field.DataType]][req.TemplateId] {
		//	return nil, errorcode.Detail(errorcode.RuleConfigError, "字段不支持该项规则")
		//}
		ruleModel.RuleName = rule.RuleName
		ruleModel.RuleDescription = rule.RuleDescription
		ruleModel.RuleLevel = rule.RuleLevel
		ruleModel.Dimension = rule.Dimension
		ruleModel.DimensionType = rule.DimensionType
	} else {
		if req.RuleName == "" {
			return nil, errorcode.Detail(errorcode.RuleConfigError, "自定义规则rule_name 必填")
		}
		if req.RuleLevel == "" {
			return nil, errorcode.Detail(errorcode.RuleConfigError, "自定义规则rule_level 必填")
		}
		if req.Dimension == "" {
			return nil, errorcode.Detail(errorcode.RuleConfigError, "自定义规则dimension 必填")
		} else {
			if req.RuleLevel == explore_rule.RuleLevelMetadata.String {
				return nil, errorcode.Detail(errorcode.RuleConfigError, "不能添加元数据级自定义规则")
			}
			if req.RuleLevel == explore_rule.RuleLevelField.String && (req.Dimension == explore_rule.DimensionConsistency.String || req.Dimension == explore_rule.DimensionTimeliness.String) {
				return nil, errorcode.Detail(errorcode.RuleConfigError, "不能添加字段级一致性、及时性自定义规则")
			}
			if req.RuleLevel == explore_rule.RuleLevelRow.String && req.Dimension != explore_rule.DimensionCompleteness.String && req.Dimension != explore_rule.DimensionUniqueness.String && req.Dimension != explore_rule.DimensionAccuracy.String {
				return nil, errorcode.Detail(errorcode.RuleConfigError, "行级只能添加完整性、唯一性、准确性自定义规则")
			}
			if req.RuleLevel == explore_rule.RuleLevelView.String && (req.Dimension != explore_rule.DimensionCompleteness.String && req.Dimension != explore_rule.DimensionTimeliness.String) {
				return nil, errorcode.Detail(errorcode.RuleConfigError, "视图级只能添加完整性、及时性自定义规则")
			}
			ruleModel.RuleLevel = enum.ToInteger[explore_rule.RuleLevel](req.RuleLevel).Int32()
			ruleModel.Dimension = enum.ToInteger[explore_rule.Dimension](req.Dimension).Int32()
			if req.DimensionType != "" {
				ruleModel.DimensionType = enum.ToInteger[explore_rule.DimensionType](req.DimensionType).Int32()
			}
		}
		if req.RuleConfig == nil {
			return nil, errorcode.Detail(errorcode.RuleConfigError, "自定义规则rule_config 必填")
		}
		ruleLevel = req.RuleLevel
	}
	switch ruleLevel {
	case explore_rule.RuleLevelMetadata.String, explore_rule.RuleLevelRow.String, explore_rule.RuleLevelView.String:
		if req.FormViewId == "" {
			return nil, errorcode.Detail(errorcode.RuleConfigError, "form_view_id 必填")
		}
	case explore_rule.RuleLevelField.String:
		if req.FieldId == "" {
			return nil, errorcode.Detail(errorcode.RuleConfigError, "field_id 必填")
		}
	}
	//err = e.CheckRuleConfig(ctx, req)
	//if err != nil {
	//	return nil, err
	//}
	if req.TemplateId == "" {
		repeat, err := e.exploreRuleRepo.NameRepeat(ctx, req.FormViewId, req.FieldId, "", req.RuleName)
		if err != nil {
			return nil, err
		}
		if repeat {
			return nil, errorcode.Detail(errorcode.RuleConfigError, "rule_name重复")
		}
	}

	ruleId, err := e.exploreRuleRepo.Create(ctx, ruleModel)
	if err != nil {
		return nil, err
	}
	return &explore_rule.RuleIDResp{RuleID: ruleId}, nil
}

func (e *exploreRuleUseCase) CheckRuleConfig(ctx context.Context, req *explore_rule.CreateRuleReq) error {
	res := &explore_rule.RuleConfig{}
	if req.RuleConfig != nil {
		err := json.Unmarshal([]byte(*req.RuleConfig), res)
		if err != nil {
			log.WithContext(ctx).Errorf("解析探查规则配置失败，err is %v", err)
			return errorcode.Detail(errorcode.RuleConfigError, "规则配置错误")
		}
	}
	if req.TemplateId != "" {
		ruleConfig, _ := explore_rule.TemplateRuleMap[req.TemplateId]
		switch ruleConfig {
		case explore_rule.RuleNull:
			if res.Null == nil {
				return errorcode.Detail(errorcode.RuleConfigError, "null配置必填")
			}
		case explore_rule.RuleDict:
			if res.Dict == nil {
				return errorcode.Detail(errorcode.RuleConfigError, "dict配置必填")
			}
		case explore_rule.RuleFormat:
			if res.Format == nil {
				return errorcode.Detail(errorcode.RuleConfigError, "format配置必填")
			}
		case explore_rule.RuleRowNull:
			if res.RowNull == nil {
				return errorcode.Detail(errorcode.RuleConfigError, "row_null配置必填")
			}
		case explore_rule.RuleRowRepeat:
			if res.RowRepeat == nil {
				return errorcode.Detail(errorcode.RuleConfigError, "row_repeat配置必填")
			}
		case explore_rule.RuleUpdatePeriod:
			if res.UpdatePeriod == nil || !explore_rule.ValidPeriods[*res.UpdatePeriod] {
				return errorcode.Detail(errorcode.RuleConfigError, "update_period配置必填,且为day week month quarter half_a_year year中的一个")
			}
		case explore_rule.RuleOther:
			if req.RuleConfig != nil {
				return errorcode.Detail(errorcode.RuleConfigError, "rule_config错误，该内置规则无配置")
			}
		}
	} else {
		if res.RuleExpression == nil {
			return errorcode.Detail(errorcode.RuleConfigError, "rule_expression配置必填")
		}
	}
	return nil
}

func (e *exploreRuleUseCase) BatchCreateRule(ctx context.Context, req *explore_rule.BatchCreateRuleReq) (*explore_rule.BatchCreateRuleResp, error) {
	resp := &explore_rule.BatchCreateRuleResp{FormViewId: req.FormViewId}
	_, err := e.repo.GetById(ctx, req.FormViewId)
	if err != nil {
		return nil, err
	}
	rules := make([]*model.ExploreRuleConfig, 0)
	rules, err = e.exploreRuleRepo.GetRulesByFormViewIdAndLevel(ctx, req.FormViewId, enum.ToInteger[explore_rule.RuleLevel](req.RuleLevel).Int32())
	if err != nil {
		return nil, err
	}
	if len(rules) > 0 {
		return resp, nil
	}
	templateRules, err := e.templateRuleRepo.GetInternalRules(ctx)
	createdTime := time.Now()
	templateRuleMap := make(map[string]*model.TemplateRule)
	for _, templateRule := range templateRules {
		if req.RuleLevel == explore_rule.RuleLevelMetadata.String && templateRule.RuleLevel == explore_rule.RuleLevelMetadata.Integer.Int32() {
			rule := &model.ExploreRuleConfig{
				RuleName:        templateRule.RuleName,
				RuleDescription: templateRule.RuleDescription,
				RuleLevel:       templateRule.RuleLevel,
				FormViewID:      req.FormViewId,
				FieldID:         "",
				Dimension:       templateRule.Dimension,
				RuleConfig:      nil,
				Enable:          templateRule.Enable,
				Draft:           0,
				TemplateID:      templateRule.RuleID,
				CreatedAt:       createdTime,
				CreatedByUID:    ctx.Value(interception.InfoName).(*middleware.User).ID,
				UpdatedAt:       createdTime,
				UpdatedByUID:    ctx.Value(interception.InfoName).(*middleware.User).ID,
				DeletedAt:       0,
			}
			if templateRule.DimensionType != nil {
				rule.DimensionType = *templateRule.DimensionType
			}
			rules = append(rules, rule)
		}
		if req.RuleLevel == explore_rule.RuleLevelField.String && templateRule.RuleLevel == explore_rule.RuleLevelField.Integer.Int32() {
			templateRuleMap[templateRule.RuleID] = templateRule
		}
	}
	if req.RuleLevel == explore_rule.RuleLevelField.String {
		fields, err := e.fieldRepo.GetFormViewFields(ctx, req.FormViewId)
		if err != nil {
			log.WithContext(ctx).Errorf("get field info failed, err: %v", err)
			return nil, errorcode.Detail(errorcode.GetDataTableDetailError, err)
		}
		for _, field := range fields {
			templateIds := explore_rule.ColTypeInternalRuleMap[constant.SimpleTypeMapping[field.DataType]]
			for _, templateId := range templateIds {
				rule := &model.ExploreRuleConfig{
					RuleName:        templateRuleMap[templateId].RuleName,
					RuleDescription: templateRuleMap[templateId].RuleDescription,
					RuleLevel:       templateRuleMap[templateId].RuleLevel,
					FormViewID:      req.FormViewId,
					FieldID:         field.ID,
					Dimension:       templateRuleMap[templateId].Dimension,
					RuleConfig:      nil,
					Enable:          templateRuleMap[templateId].Enable,
					Draft:           0,
					TemplateID:      templateRuleMap[templateId].RuleID,
					CreatedAt:       createdTime,
					CreatedByUID:    ctx.Value(interception.InfoName).(*middleware.User).ID,
					UpdatedAt:       createdTime,
					UpdatedByUID:    ctx.Value(interception.InfoName).(*middleware.User).ID,
					DeletedAt:       0,
				}
				if templateRuleMap[templateId].DimensionType != nil {
					rule.DimensionType = *templateRuleMap[templateId].DimensionType
				}
				rules = append(rules, rule)
			}
		}
	}
	if len(rules) > 0 {
		err = e.exploreRuleRepo.BatchCreate(ctx, rules)
		if err != nil {
			return nil, err
		}
	}
	return resp, nil
}

func (e *exploreRuleUseCase) GetRuleList(ctx context.Context, req *explore_rule.GetRuleListReq) ([]*explore_rule.GetRuleResp, error) {
	exploreRules := make([]*explore_rule.GetRuleResp, 0)
	rules, err := e.exploreRuleRepo.GetList(ctx, &req.GetRuleListReqQuery)
	if err != nil {
		return nil, err
	}
	for _, rule := range rules {
		exploreRule := convertToExploreRule(rule)
		exploreRules = append(exploreRules, exploreRule)
	}
	return exploreRules, nil
}

func (e *exploreRuleUseCase) GetRule(ctx context.Context, req *explore_rule.GetRuleReq) (*explore_rule.GetRuleResp, error) {
	rule, err := e.exploreRuleRepo.GetByRuleId(ctx, req.RuleId)
	if err != nil {
		return nil, err
	}
	resp := convertToExploreRule(rule)
	return resp, nil
}
func (e *exploreRuleUseCase) NameRepeat(ctx context.Context, req *explore_rule.NameRepeatReq) (bool, error) {
	if req.FormViewId != "" {
		_, err := e.repo.GetById(ctx, req.FormViewId)
		if err != nil {
			return false, err
		}
	}
	repeat, err := e.exploreRuleRepo.CheckSysRuleNameRepeat(ctx, req.RuleName)
	if err != nil {
		return false, err
	}
	if repeat {
		return true, nil
	}
	repeat, err = e.exploreRuleRepo.NameRepeat(ctx, req.FormViewId, req.FieldId, req.RuleId, req.RuleName)
	return repeat, err
}

func (e *exploreRuleUseCase) UpdateRule(ctx context.Context, req *explore_rule.UpdateRuleReq) (*explore_rule.RuleIDResp, error) {
	rule, err := e.exploreRuleRepo.GetByRuleId(ctx, req.RuleId)
	if err != nil {
		return nil, err
	}

	repeat, err := e.exploreRuleRepo.NameRepeat(ctx, rule.FormViewID, rule.FieldID, rule.RuleID, req.RuleName)
	if err != nil {
		return nil, err
	}
	if repeat {
		return nil, errorcode.Detail(errorcode.RuleConfigError, "rule_name重复")
	}

	// 检查规则配置
	//err = e.CheckRuleConfig(ctx, &explore_rule.CreateRuleReq{explore_rule.CreateRuleReqBody{TemplateId: rule.TemplateID, RuleConfig: req.RuleConfig}})
	//if err != nil {
	//	return nil, err
	//}
	rule.RuleName = req.RuleName
	rule.RuleDescription = req.RuleDescription
	rule.RuleConfig = req.RuleConfig
	var status, draft int32
	if req.Enable != nil {
		if *req.Enable {
			status = 1
		}
		rule.Enable = status
	}
	if req.Draft != nil {
		if *req.Draft {
			draft = 1
		}
		rule.Draft = draft
	}
	err = e.exploreRuleRepo.Update(ctx, rule)
	return &explore_rule.RuleIDResp{RuleID: req.RuleId}, err
}

func (e *exploreRuleUseCase) UpdateRuleStatus(ctx context.Context, req *explore_rule.UpdateRuleStatusReq) (bool, error) {
	err := e.exploreRuleRepo.UpdateStatus(ctx, req.RuleIds, *req.Enable)
	if err != nil {
		return false, err
	}
	return true, nil
}

func (e *exploreRuleUseCase) DeleteRule(ctx context.Context, req *explore_rule.DeleteRuleReq) (*explore_rule.RuleIDResp, error) {
	_, err := e.exploreRuleRepo.GetByRuleId(ctx, req.RuleId)
	if err != nil {
		return nil, err
	}
	err = e.exploreRuleRepo.Delete(ctx, req.RuleId)
	return &explore_rule.RuleIDResp{RuleID: req.RuleId}, err
}

func convertToExploreRule(rule *model.ExploreRuleConfig) *explore_rule.GetRuleResp {
	status := false
	draft := false
	if rule.Enable == 1 {
		status = true
	}
	if rule.Draft == 1 {
		draft = true
	}
	resp := &explore_rule.GetRuleResp{
		RuleId:          rule.RuleID,
		RuleName:        rule.RuleName,
		RuleDescription: rule.RuleDescription,
		RuleLevel:       enum.ToString[explore_rule.RuleLevel](rule.RuleLevel),
		FieldId:         rule.FieldID,
		Dimension:       enum.ToString[explore_rule.Dimension](rule.Dimension),
		RuleConfig:      rule.RuleConfig,
		Enable:          status,
		Draft:           draft,
		TemplateId:      rule.TemplateID,
	}
	if rule.DimensionType > 0 {
		resp.DimensionType = enum.ToString[explore_rule.DimensionType](rule.DimensionType)
	}
	return resp
}
