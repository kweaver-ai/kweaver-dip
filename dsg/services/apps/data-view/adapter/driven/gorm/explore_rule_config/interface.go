package explore_rule_config

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/data-view/domain/explore_task"
	"github.com/kweaver-ai/dsg/services/apps/data-view/infrastructure/db/model"
)

type ExploreRuleConfigRepo interface {
	GetTemplateRules(ctx context.Context) ([]*model.ExploreRuleConfig, error)
	Create(ctx context.Context, m *model.ExploreRuleConfig) (string, error)
	BatchCreate(ctx context.Context, m []*model.ExploreRuleConfig) error
	GetByRuleId(ctx context.Context, ruleId string) (*model.ExploreRuleConfig, error)
	Update(ctx context.Context, m *model.ExploreRuleConfig) error
	UpdateStatus(ctx context.Context, ids []string, enable bool) error
	Delete(ctx context.Context, ruleId string) error
	GetList(ctx context.Context, req *explore_task.GetRuleListReqQuery) ([]*model.ExploreRuleConfig, error)
	CheckRuleNameRepeat(ctx context.Context, formViewId, ruleId, name string) (bool, error)
	NameRepeat(ctx context.Context, formViewId, filedId, ruleId, name string) (bool, error)
	GetByTemplateId(ctx context.Context, templateId string) (*model.ExploreRuleConfig, error)
	HasTemplateRule(ctx context.Context, ids []string) (bool, error)
	GetByFieldId(ctx context.Context, fieldId string) ([]*model.ExploreRuleConfig, error)
	GetByFieldIds(ctx context.Context, fieldIds []string) ([]*model.ExploreRuleConfig, error)
	GetRulesByFormViewIds(ctx context.Context, ids []string) ([]*model.ExploreRuleConfig, error)
	GetEnabledRules(ctx context.Context, formViewId string) ([]*model.ExploreRuleConfig, error)
	CheckRuleByTemplateId(ctx context.Context, templateId, formViewId, fieldId string) (bool, error)
	GetConfiguredViewsByFormViewIds(ctx context.Context, formViewIds []string) (total int64, err error)
	GetRulesByFormViewIdAndLevel(ctx context.Context, id string, ruleLevel int32) ([]*model.ExploreRuleConfig, error)
	CheckSysRuleNameRepeat(ctx context.Context, name string) (bool, error)
}
