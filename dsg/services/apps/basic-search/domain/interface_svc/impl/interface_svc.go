package impl

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/basic-search/adapter/driven/es_interface_svc"
	domain "github.com/kweaver-ai/dsg/services/apps/basic-search/domain/interface_svc"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/trace"
)

type useCase struct {
	esClient es_interface_svc.ESInterfaceSvc
}

func NewUseCase(esClient es_interface_svc.ESInterfaceSvc) domain.UseCase {
	return &useCase{esClient: esClient}
}

func (u *useCase) Search(ctx context.Context, req *domain.SearchReqParam) (res *domain.SearchResp, err error) {
	ctx, span := trace.StartConsumerSpan(ctx)
	defer func() { trace.TelemetrySpanEnd(span, err) }()

	if len(req.Orders) < 1 {
		// keyword为空时，默认以 updated_at desc 排序
		if len(req.Keyword) < 1 {
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

	searchParam := req.ToSearchParam()

	result, err := u.esClient.Search(ctx, searchParam)
	// log.Infof("search result: %+v", result)
	if err != nil {
		return nil, err
	}

	entries := make([]*domain.InterfaceSvcBaseInfo, 0)
	var total int64
	var next []string
	if result != nil {
		for _, item := range result.Items {
			baseInfo := &domain.InterfaceSvcBaseInfo{
				ID:               item.ID,
				Name:             item.Name,
				RawName:          item.RawName,
				Description:      item.Description,
				RawDescription:   item.RawDescription,
				UpdatedAt:        item.UpdatedAt,
				OnlineAt:         item.OnlineAt,
				PublishedAt:      item.OnlineAt,
				DataOwnerID:      item.DataOwnerID,
				DataOwnerName:    item.DataOwnerName,
				RawDataOwnerName: item.RawDataOwnerName,
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
	if err = u.esClient.Index(ctx, req.ToInterfaceSvcDoc()); err != nil {
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
