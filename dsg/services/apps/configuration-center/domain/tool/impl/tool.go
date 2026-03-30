package impl

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/tool"
	domain "github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/tool"
)

type toolUsecase struct {
	repo tool.Repo
}

func NewToolUsecase(repo tool.Repo) domain.UseCase {
	return &toolUsecase{repo: repo}
}

func (t *toolUsecase) List(ctx context.Context) ([]*domain.SummaryInfo, int64, error) {
	tools, err := t.repo.List(ctx)
	if err != nil {
		return nil, 0, err
	}

	ret := make([]*domain.SummaryInfo, len(tools))
	for i, to := range tools {
		ret[i] = &domain.SummaryInfo{
			ID:   to.ID,
			Name: to.Name,
		}
	}

	return ret, int64(len(ret)), nil
}
