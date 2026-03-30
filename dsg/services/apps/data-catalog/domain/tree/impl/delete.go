package impl

import (
	"context"

	domain "github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/tree"
)

func (u *useCase) Delete(ctx context.Context, req *domain.IDPathParam) (*domain.DeleteRespParam, error) {
	exist, err := u.repo.Delete(ctx, req.ID)
	if err != nil {
		return nil, err
	}

	resp := &domain.DeleteRespParam{}
	if exist {
		resp.ID = req.ID
	}

	return resp, nil
}
