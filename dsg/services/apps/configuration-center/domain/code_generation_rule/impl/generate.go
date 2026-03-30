package impl

import (
	"context"

	"github.com/google/uuid"

	domain "github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/code_generation_rule"
)

func (c *UseCase) Generate(ctx context.Context, id uuid.UUID, opts domain.GenerateOptions) (*domain.CodeList, error) {
	codes, err := c.codeRepo.Generate(ctx, id, opts.Count)
	if err != nil {
		return nil, err
	}

	return &domain.CodeList{
		Entries:    codes,
		TotalCount: len(codes),
	}, nil
}
