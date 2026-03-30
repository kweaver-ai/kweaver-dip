package impl

import (
	"context"
	"errors"
	"time"

	"go.uber.org/zap"
	"gorm.io/gorm"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
)

func (c *CodeGenerationRuleRepo) Update(ctx context.Context, rule *model.CodeGenerationRule) (*model.CodeGenerationRule, error) {
	log := log.WithContext(ctx)
	tx := c.db.WithContext(ctx).Debug()

	var current = &model.CodeGenerationRule{ID: rule.ID}
	if err := tx.Transaction(func(tx *gorm.DB) error {
		if err := tx.First(current).Error; errors.Is(err, gorm.ErrRecordNotFound) {
			log.Error("code generation rule is not found", zap.Stringer("id", current.ID))
			return errorcode.Desc(errorcode.CodeGenerationRuleNotFound)
		} else if err != nil {
			log.Error("get code generation rule fail", zap.Error(err), zap.Stringer("id", current.ID))
			return errorcode.Detail(errorcode.ConfigurationDataBaseError, err)
		}
		log.Info("original code generation rule", zap.Any("object", current))

		// 在已有的编码规则的基础上更新
		log.Info("code generation rule patch", zap.Any("patch", rule))
		// 仅更新部分字段
		current = &model.CodeGenerationRule{
			SnowflakeID: current.SnowflakeID,
			ID:          current.ID,
			Name:        current.Name,
			CodeGenerationRuleSpec: model.CodeGenerationRuleSpec{
				Type:                 current.Type, // 不更新编码规则类型
				Prefix:               ifElseThen(rule.Prefix != "", rule.Prefix, current.Prefix),
				PrefixEnabled:        rule.PrefixEnabled,
				RuleCode:             current.RuleCode, // 不更新规则码
				RuleCodeEnabled:      rule.RuleCodeEnabled,
				CodeSeparator:        ifElseThen(rule.CodeSeparator != "", rule.CodeSeparator, current.CodeSeparator),
				CodeSeparatorEnabled: rule.CodeSeparatorEnabled,
				DigitalCodeType:      current.DigitalCodeType, // 不更新数字码类型
				DigitalCodeWidth:     rule.DigitalCodeWidth,
				DigitalCodeStarting:  rule.DigitalCodeStarting,
				DigitalCodeEnding:    rule.DigitalCodeEnding,
			},
			CodeGenerationRuleStatus: model.CodeGenerationRuleStatus{
				UpdaterID: rule.UpdaterID,
				CreatedAt: current.CreatedAt, // 不更新创建时间
				UpdatedAt: time.Now(),
			},
		}

		log.Info("save code generation rule", zap.Any("object", current))
		if err := tx.Save(current).Error; err != nil {
			log.Error("update code generation rule fail", zap.Error(err), zap.Any("object", current))
			return errorcode.Detail(errorcode.ConfigurationDataBaseError, err)
		}

		return nil
	}); err != nil {
		return nil, err
	}
	return current, nil
}

func ifElseThen[T any](cond bool, a, b T) T {
	if cond {
		return a
	}
	return b
}
