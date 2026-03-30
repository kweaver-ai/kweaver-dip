package data_catalog

import (
	"context"

	es "github.com/kweaver-ai/dsg/services/apps/basic-search/adapter/driven/es_data_datalog"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/trace"
)

type useCase struct {
	search es.Search
}

func NewUseCase(search es.Search) UseCase {
	return &useCase{search: search}
}

func (u useCase) Search(ctx context.Context, req *SearchReqParam) (res *SearchRespParam, err error) {
	ctx, span := trace.StartInternalSpan(ctx)
	defer func() { trace.TelemetrySpanEnd(span, err) }()
	if req.Statistics && len(req.NextFlag) > 0 {
		// 获取下一页时，不返回统计信息
		req.Statistics = false
	}

	if len(req.Orders) < 1 {
		// keyword为空时，默认以  online_at desc,updated_at desc 排序
		if len(req.Keyword) < 1 {
			req.Orders = append(req.Orders, Order{
				Sort:      "online_at",
				Direction: "desc",
			})
			req.Orders = append(req.Orders, Order{
				Sort:      "updated_at",
				Direction: "desc",
			})
		} else {
			// keyword不为空，默认以 _score desc 排序
			req.Orders = append(req.Orders, Order{
				Sort:      "_score",
				Direction: "desc",
			})
		}
	}

	result, err := u.search.Search(ctx, req.ToSearchParam())
	if err != nil {
		return nil, err
	}

	return NewSearchRespParam(result), nil
}

func (u useCase) Statistics(ctx context.Context, req *StatisticsReqParam) (*StatisticsRespParam, error) {
	result, err := u.search.Aggs(ctx, req.ToAggsParam())
	if err != nil {
		return nil, err
	}

	return NewStatisticsRespParam(result), nil
}

func (u useCase) IndexToES(ctx context.Context, req *IndexToESReqParam) (result *IndexToESRespParam, err error) {
	ctx, span := trace.StartInternalSpan(ctx)
	defer func() { trace.TelemetrySpanEnd(span, err) }()
	if err = u.search.Index(ctx, req.ToItem()); err != nil {
		return nil, err
	}

	return NewIndexToESRespParam(req.DocId), nil
}

func (u useCase) DeleteFromES(ctx context.Context, req *DeleteFromESReqParam) (result *DeleteFromESRespParam, err error) {
	ctx, span := trace.StartInternalSpan(ctx)
	defer func() { trace.TelemetrySpanEnd(span, err) }()
	if err = u.search.Delete(ctx, req.ID); err != nil {
		return nil, err
	}

	return NewDeleteFromESRespParam(req.ID), nil
}
