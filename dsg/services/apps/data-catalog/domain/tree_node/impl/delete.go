package impl

import (
	"context"

	domain "github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/tree_node"
)

func (u *useCase) Delete(ctx context.Context, req *domain.DeleteReqParam) (*domain.DeleteRespParam, error) {
	if err := u.treeExistCheckDie(ctx, req.TreeID, req.ID); err != nil {
		return nil, err
	}

	exist, err := u.repo.Delete(ctx, req.ID, req.TreeID)
	if err != nil {
		return nil, err
	}

	resp := &domain.DeleteRespParam{}
	if exist {
		resp.ID = req.ID
	}

	return resp, nil
}
