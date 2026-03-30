package impl

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/basic-search/adapter/driven/es_data_view"
	domain "github.com/kweaver-ai/dsg/services/apps/basic-search/domain/data_view"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/trace"
)

type useCase struct {
	esClient es_data_view.ESDataView
}

func NewUseCase(esClient es_data_view.ESDataView) domain.UseCase {
	return &useCase{esClient: esClient}
}

func (u *useCase) Search(ctx context.Context, req *domain.SearchReqParam) (res *domain.SearchResp, err error) {
	ctx, span := trace.StartConsumerSpan(ctx)
	defer func() { trace.TelemetrySpanEnd(span, err) }()

	if len(req.Orders) < 1 {
		// keyword为空时，默认以 updated_at desc 排序
		if len(req.Keyword) < 1 {
			req.Orders = append(req.Orders, domain.Order{
				Sort:      "published_at",
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

	searchParam := req.ToSearchParam()

	result, err := u.esClient.Search(ctx, searchParam)
	// log.Infof("search result: %+v", result)
	if err != nil {
		return nil, err
	}

	entries := make([]*domain.DataViewBaseInfo, 0)
	var total int64
	var next []string
	if result != nil {
		for _, item := range result.Items {
			baseInfo := &domain.DataViewBaseInfo{
				ID:               item.ID,
				Name:             item.Name,
				RawName:          item.RawName,
				Description:      item.Description,
				RawDescription:   item.RawDescription,
				UpdatedAt:        item.UpdatedAt,
				PublishedAt:      item.PublishedAt,
				DataOwnerID:      item.DataOwnerID,
				DataOwnerName:    item.DataOwnerName,
				RawDataOwnerName: item.RawDataOwnerName,
				IsPublish:        item.IsPublish,
				Fields:           item.Fields,
			}
			entries = append(entries, baseInfo)
		}
		total = result.TotalCount
		next = result.NextFlag
	}

	return domain.NewSearchResp(entries, total, next), nil
}

func (u *useCase) IndexToES(ctx context.Context, req *domain.IndexToESReqParam) (res *domain.IndexToESRespParam, err error) {
	ctx, span := trace.StartInternalSpan(ctx)
	defer func() { trace.TelemetrySpanEnd(span, err) }()
	if err = u.esClient.Index(ctx, req.ToDataViewDoc()); err != nil {
		return nil, err
	}
	return &domain.IndexToESRespParam{ID: req.ID}, nil
}

func (u *useCase) DeleteFromES(ctx context.Context, req *domain.DeleteFromESReqParam) (res *domain.DeleteFromEsRespParam, err error) {
	ctx, span := trace.StartInternalSpan(ctx)
	defer func() { trace.TelemetrySpanEnd(span, err) }()

	if err = u.esClient.Delete(ctx, req.ID); err != nil {
		return nil, err
	}
	return &domain.DeleteFromEsRespParam{ID: req.ID}, nil
}
