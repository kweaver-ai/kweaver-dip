package data_search_all

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/basic-search/adapter/driven/data_search_all"
	domain "github.com/kweaver-ai/dsg/services/apps/basic-search/domain/data_search_all"
)

type useCase struct {
	all data_search_all.EsAll
}

func NewUseCase(all data_search_all.EsAll) domain.UseCase {
	return &useCase{all: all}
}

func (u useCase) SearchAll(ctx context.Context, req *domain.SearchAllReqParam) (*domain.SearchAllRespParam, error) {

	if len(req.Orders) < 1 {
		if req.Keyword != "" {
			// keyword不为空，默认以 _score desc 排序
			req.Orders = append(req.Orders, domain.Order{
				Sort:      "_score",
				Direction: "desc",
			})
		} else {
			req.Orders = append(req.Orders, domain.Order{
				Sort:      "online_at",
				Direction: "desc",
			})
		}
	}

	result, err := u.all.Search(ctx, req.ToSearchAllParam())
	if err != nil {
		return nil, err
	}

	return domain.NewSearchAllRespParam(result), nil
}
