package impl

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/models/request"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/models/response"
	domain "github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/category/module_config"
	repoiface "github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/category"
	repoModel "github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/model"
)

type useCase struct {
	repo repoiface.ModuleConfigRepo
}

func NewUseCase(repo repoiface.ModuleConfigRepo) domain.UseCase {
	return &useCase{repo: repo}
}

func (u *useCase) Get(ctx context.Context, req *domain.GetReq) (*domain.GetResp, error) {
	list, err := u.repo.GetByCategory(ctx, req.CategoryID)
	if err != nil {
		return nil, err
	}
	items := make([]domain.ModuleItem, 0, len(list))
	for _, v := range list {
		items = append(items, domain.ModuleItem{
			ModuleCode: v.ModuleCode,
			Selected:   v.Selected == 1,
			Required:   v.Required == 1,
		})
	}
	entries := make([]*domain.ModuleItem, 0, len(items))
	for i := range items {
		entries = append(entries, &items[i])
	}
	return &domain.GetResp{PageResult: response.PageResult[domain.ModuleItem]{Entries: entries, TotalCount: int64(len(items))}}, nil
}

func (u *useCase) SaveAll(ctx context.Context, req *domain.SaveAllReq) error {
	user := request.GetUserInfo(ctx)
	items := make([]*repoModel.CategoryModuleConfig, 0, len(req.Items))
	for _, it := range req.Items {
		items = append(items, it.ToModel(user, req.CategoryID))
	}
	return u.repo.UpsertAll(ctx, req.CategoryID, items)
}

func (u *useCase) Update(ctx context.Context, req *domain.UpdateReq) error {
	user := request.GetUserInfo(ctx)
	m := req.Item.ToModel(user, req.CategoryID)
	fields := []string{"selected", "required"}
	return u.repo.UpdateFields(ctx, m, fields)
}
