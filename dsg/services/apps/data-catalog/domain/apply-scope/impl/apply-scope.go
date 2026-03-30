package impl

import (
	"context"

	domain_apply_scope "github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/apply-scope"
	repo_apply_scope "github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/apply-scope"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/model"
)

type ApplyScopeUseCaseImpl struct {
	repo repo_apply_scope.Repo
}

func NewApplyScopeUseCaseImpl(repo repo_apply_scope.Repo) domain_apply_scope.ApplyScopeUseCase {
	return &ApplyScopeUseCaseImpl{
		repo: repo,
	}
}

func (u *ApplyScopeUseCaseImpl) AllList(ctx context.Context) (res []*model.ApplyScope, err error) {
	return u.repo.List(ctx)
}
