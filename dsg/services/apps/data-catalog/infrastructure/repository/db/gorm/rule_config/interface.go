package rule_config

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/model"
)

type RuleConfigRepo interface {
	Update(ctx context.Context, ruleConfigs []*model.TRuleConfig) error
	Get(ctx context.Context) ([]*model.TRuleConfig, error)
	GetNormalUpdateRule(ctx context.Context) (*model.TRuleConfig, error)
}
