package impl

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/models"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/models/response"
	domain "github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/tree"
)

func (u *useCase) NameExistCheck(ctx context.Context, req *domain.NameExistReqParam) (*domain.NameExistRespParam, error) {
	var excludedIds []models.ModelID
	if req.CurID != nil && req.CurID.Uint64() > 0 {
		excludedIds = []models.ModelID{*req.CurID}
	}

	exist, err := u.existByName(ctx, *req.Name, excludedIds...)
	if err != nil {
		return nil, err
	}

	return &domain.NameExistRespParam{
		CheckRepeatResp: response.CheckRepeatResp{
			Name:   *req.Name,
			Repeat: exist,
		},
	}, nil
}
