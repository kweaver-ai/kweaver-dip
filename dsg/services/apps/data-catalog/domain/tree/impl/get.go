package impl

import (
	"context"

	domain "github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/tree"
)

func (u *useCase) Get(ctx context.Context, req *domain.IDPathParam) (*domain.GetRespParam, error) {
	m, err := u.repo.Get(ctx, req.ID)
	if err != nil {
		return nil, err
	}

	return domain.NewGetRespParam(m, "create_user", "update_user"), nil
}
