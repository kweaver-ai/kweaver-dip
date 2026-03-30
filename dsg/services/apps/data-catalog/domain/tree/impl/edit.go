package impl

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/models/response"
	domain "github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/tree"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
)

func (u *useCase) Edit(ctx context.Context, req *domain.EditReqParam) (*domain.EditRespParam, error) {
	// 检测tree是否存在
	if exist, err := u.existById(ctx, req.ID); err != nil {
		return nil, err
	} else if !exist {
		log.WithContext(ctx).Errorf("tree not found by id, id: %v", req.ID)
		return nil, errorcode.Desc(errorcode.TreeNotExist)
	}

	// 检测name是否存在
	if exist, err := u.existByName(ctx, *req.Name, req.ID); err != nil {
		return nil, err
	} else if exist {
		log.WithContext(ctx).Errorf("tree name repeat")
		return nil, errorcode.Desc(errorcode.TreeNameRepeat)
	}

	m := req.ToModel("userId")
	err := u.repo.UpdateByEdit(ctx, m)
	if err != nil {
		return nil, err
	}

	return &domain.EditRespParam{
		IDResp: response.IDResp{
			ID: req.ID,
		},
	}, nil
}
