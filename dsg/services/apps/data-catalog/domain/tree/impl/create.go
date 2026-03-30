package impl

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/models/response"
	domain "github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/tree"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
)

func (u *useCase) Create(ctx context.Context, req *domain.CreateReqParam) (*domain.CreateRespParam, error) {
	// 检测名称是否存在
	if exist, err := u.existByName(ctx, *req.Name); err != nil {
		return nil, err
	} else if exist {
		log.WithContext(ctx).Errorf("tree name repeat")
		return nil, errorcode.Desc(errorcode.TreeNameRepeat)
	}

	treeM := req.ToModel("userId")
	err := u.repo.Create(ctx, treeM)
	if err != nil {
		return nil, err
	}

	return &domain.CreateRespParam{
		IDResp: response.IDResp{
			ID: treeM.ID,
		},
	}, nil
}
