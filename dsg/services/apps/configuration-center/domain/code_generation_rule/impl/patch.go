package impl

import (
	"context"

	domain "github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/code_generation_rule"
)

// Patch implements domain.UseCase.
func (c *UseCase) Patch(ctx context.Context, rule *domain.CodeGenerationRule) (*domain.CodeGenerationRule, error) {
	modelRule, err := c.codeRepo.Update(ctx, &rule.CodeGenerationRule)
	if err != nil {
		return nil, err
	}

	var result domain.CodeGenerationRule
	modelRule.DeepCopyInto(&result.CodeGenerationRule)

	c.completeCodeGenerationRuleUpdaterName(ctx, &result)

	return &result, nil
}
