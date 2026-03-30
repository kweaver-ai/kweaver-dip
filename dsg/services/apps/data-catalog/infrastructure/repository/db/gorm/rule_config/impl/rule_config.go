package impl

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/rule_config"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/model"
	"gorm.io/gorm"
)

type RuleConfigRepoImpl struct {
	db *gorm.DB
}

func NewRuleConfigRepo(db *gorm.DB) rule_config.RuleConfigRepo {
	return &RuleConfigRepoImpl{db: db}
}

func (r *RuleConfigRepoImpl) Update(ctx context.Context, ruleConfigs []*model.TRuleConfig) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		for _, ruleConfig := range ruleConfigs {
			if err := tx.Model(&model.TRuleConfig{}).Where("rule_name = ?", ruleConfig.RuleName).Updates(ruleConfig).Error; err != nil {
				return err
			}
		}
		return nil
	})
}

func (r *RuleConfigRepoImpl) Get(ctx context.Context) ([]*model.TRuleConfig, error) {
	var ruleConfigs []*model.TRuleConfig
	err := r.db.WithContext(ctx).Model(&model.TRuleConfig{}).Where("id is not null").Find(&ruleConfigs).Error
	return ruleConfigs, err
}

func (r *RuleConfigRepoImpl) GetNormalUpdateRule(ctx context.Context) (*model.TRuleConfig, error) {
	var ruleConfig *model.TRuleConfig
	err := r.db.WithContext(ctx).Model(&model.TRuleConfig{}).Where("rule_name = ?", "normal_update").First(&ruleConfig).Error
	return ruleConfig, err
}
