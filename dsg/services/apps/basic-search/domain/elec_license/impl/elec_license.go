package elec_license

import (
	"context"

	es "github.com/kweaver-ai/dsg/services/apps/basic-search/adapter/driven/es_elec_license"
	domain "github.com/kweaver-ai/dsg/services/apps/basic-search/domain/elec_license"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/trace"
)

type useCase struct {
	searcher es.Searcher
}

func NewUseCase(searcher es.Searcher) domain.UseCase {
	return &useCase{searcher: searcher}
}

func (u useCase) Search(ctx context.Context, req *domain.SearchReqParam) (res *domain.SearchRespParam, err error) {
	ctx, span := trace.StartInternalSpan(ctx)
	defer func() { trace.TelemetrySpanEnd(span, err) }()

	if req.Statistics && len(req.NextFlag) > 0 {
		// 获取下一页时，不返回统计信息
		req.Statistics = false

	}

	if len(req.Orders) < 1 {
		// keyword为空时，默认以  online_at desc,updated_at desc 排序
		if len(req.Keyword) < 1 {
			req.Orders = append(req.Orders, domain.Order{
				Sort:      "online_at",
				Direction: "desc",
			})
			req.Orders = append(req.Orders, domain.Order{
				Sort:      "updated_at",
				Direction: "desc",
			})
		} else {
			// keyword不为空，默认以 _score desc 排序
			req.Orders = append(req.Orders, domain.Order{
				Sort:      "_score",
				Direction: "desc",
			})
		}
	}

	result, err := u.searcher.Search(ctx, req.ToSearchParam())
	if err != nil {
		return nil, err
	}

	return domain.NewSearchRespParam(result), nil
}

func (u useCase) Statistics(ctx context.Context, req *domain.StatisticsReqParam) (*domain.StatisticsRespParam, error) {
	result, err := u.searcher.Aggs(ctx, req.ToAggsParam())
	if err != nil {
		return nil, err
	}

	return domain.NewStatisticsRespParam(result), nil
}

func (u useCase) IndexToES(ctx context.Context, req *domain.IndexToESReqParam) (result *domain.IndexToESRespParam, err error) {
	ctx, span := trace.StartInternalSpan(ctx)
	defer func() { trace.TelemetrySpanEnd(span, err) }()
	if err = u.searcher.Index(ctx, req.ToItem()); err != nil {
		return nil, err
	}

	return domain.NewIndexToESRespParam(req.DocId), nil
}

func (u useCase) DeleteFromES(ctx context.Context, req *domain.DeleteFromESReqParam) (result *domain.DeleteFromESRespParam, err error) {
	ctx, span := trace.StartInternalSpan(ctx)
	defer func() { trace.TelemetrySpanEnd(span, err) }()
	if err = u.searcher.Delete(ctx, req.ID); err != nil {
		return nil, err
	}

	return domain.NewDeleteFromESRespParam(req.ID), nil
}
