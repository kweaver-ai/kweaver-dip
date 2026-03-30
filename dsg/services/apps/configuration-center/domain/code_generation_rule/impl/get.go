package impl

import (
	"context"

	"github.com/google/uuid"
	"go.uber.org/zap"

	domain "github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/code_generation_rule"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
)

// Get implements domain.UseCase.
func (c *UseCase) Get(ctx context.Context, id uuid.UUID) (*domain.CodeGenerationRule, error) {
	modelRule, err := c.codeRepo.Get(ctx, id)
	if err != nil {
		return nil, err
	}

	var result domain.CodeGenerationRule
	modelRule.DeepCopyInto(&result.CodeGenerationRule)

	c.completeCodeGenerationRuleUpdaterName(ctx, &result)

	return &result, nil
}

// 补全更新者的名称
func (c *UseCase) completeCodeGenerationRuleUpdaterName(ctx context.Context, rule *domain.CodeGenerationRule) {
	log := log.WithContext(ctx)

	if rule.UpdaterID == uuid.Nil {
		return
	}

	users, err := c.userRepo.ListUserByIDs(ctx, rule.UpdaterID.String())
	if err != nil || len(users) != 1 || users[0] == nil {
		log.Warn("get updater fail", zap.Error(err), zap.Stringer("id", rule.UpdaterID), zap.Int("usersNumber", len(users)))
		return
	}

	rule.UpdaterName = users[0].Name
	return
}
