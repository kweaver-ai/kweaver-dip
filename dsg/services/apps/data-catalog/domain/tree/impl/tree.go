package impl

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/models"
	domain "github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/tree"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/tree"
)

type useCase struct {
	repo tree.Repo
}

func NewUseCase(repo tree.Repo) domain.UseCase {
	return &useCase{repo: repo}
}

func (u *useCase) existByName(ctx context.Context, name string, excludedIds ...models.ModelID) (bool, error) {
	return u.repo.ExistByName(ctx, name, excludedIds...)
}

func (u *useCase) existById(ctx context.Context, id models.ModelID) (bool, error) {
	return u.repo.ExistById(ctx, id)
}
