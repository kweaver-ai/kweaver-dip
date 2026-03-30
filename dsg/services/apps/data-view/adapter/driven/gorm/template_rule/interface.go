package template_rule

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/data-view/domain/explore_rule"
	"github.com/kweaver-ai/dsg/services/apps/data-view/infrastructure/db/model"
)

type TemplateRuleRepo interface {
	Create(ctx context.Context, m *model.TemplateRule) (string, error)
	GetByRuleId(ctx context.Context, ruleId string) (*model.TemplateRule, error)
	Update(ctx context.Context, m *model.TemplateRule) error
	UpdateStatus(ctx context.Context, id string, enable bool) error
	Delete(ctx context.Context, ruleId string) error
	GetList(ctx context.Context, req *explore_rule.GetTemplateRuleListReq) ([]*model.TemplateRule, error)
	GetInternalRules(ctx context.Context) ([]*model.TemplateRule, error)
	NameRepeat(ctx context.Context, ruleId, name string) (bool, error)
	CheckSysRuleNameRepeat(ctx context.Context, name string) (bool, error)
}
