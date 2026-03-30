package impl

import (
	"context"

	driven "github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/gorm/code_generation_rule"
)

// ExistenceCheckPrefix implements domain.UseCase.
func (c *UseCase) ExistenceCheckPrefix(ctx context.Context, prefix string) (bool, error) {
	number, err := c.codeRepo.Count(ctx, driven.ListOptions{Prefix: prefix})
	if err != nil {
		return false, err
	}
	return number > 0, nil
}
