package impl

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/models"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/models/request"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/models/response"
	domain "github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/tree_node"
)

func (u *useCase) Edit(ctx context.Context, req *domain.EditReqParam) (*domain.EditRespParam, error) {
	userInfo := request.GetUserInfo(ctx)

	if err := u.treeExistCheckDie(ctx, req.TreeID, req.ID); err != nil {
		return nil, err
	}

	nodeM, err := u.repo.GetByIdAndTreeId(ctx, req.ID, req.TreeID)
	if err != nil {
		return nil, err
	}

	if err = u.existByNameDie(ctx, *req.Name, nodeM.ParentID, req.TreeID, req.ID); err != nil {
		return nil, err
	}

	m := req.ToModel(models.NewUserID(userInfo.ID))
	if err = u.repo.UpdateByEdit(ctx, m); err != nil {
		return nil, err
	}

	return &domain.EditRespParam{
		IDResp: response.IDResp{
			ID: req.ID,
		},
	}, nil
}
