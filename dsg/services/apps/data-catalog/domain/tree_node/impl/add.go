package impl

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/models"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/models/request"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/models/response"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/util"
	domain "github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/tree_node"
)

// Add 在父节点的子节点列表的末尾处添加新的子节点
func (u *useCase) Add(ctx context.Context, req *domain.AddReqParam) (*domain.AddRespParam, error) {
	userInfo := request.GetUserInfo(ctx)
	// 父节点和tree存在性检测
	if err := u.parentNodeExistCheckDie(ctx, &req.ParentID, req.TreeID); err != nil {
		return nil, err
	}

	// name重复检测
	if err := u.existByNameDie(ctx, *req.Name, req.ParentID, req.TreeID); err != nil {
		return nil, err
	}

	m := req.ToModel(models.NewUserID(userInfo.ID))
	m.CategoryNum = genCategoryNum()
	if err := u.repo.InsertWithMaxLayer(ctx, m, MaxLayers); err != nil {
		return nil, err
	}

	return &domain.AddRespParam{
		IDResp: response.IDResp{
			ID: m.ID,
		},
	}, nil
}

func genCategoryNum() string {
	return util.NewUUID()
}
