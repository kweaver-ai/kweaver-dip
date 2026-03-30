package info_system

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"

	"github.com/google/uuid"
	"github.com/olivere/elastic/v7"
	"github.com/samber/lo"
	"go.uber.org/zap"

	"github.com/kweaver-ai/dsg/services/apps/basic-search/adapter/driven/es_info_system"
	"github.com/kweaver-ai/dsg/services/apps/basic-search/adapter/driven/opensearch"
	"github.com/kweaver-ai/dsg/services/apps/basic-search/common/es"
	"github.com/kweaver-ai/dsg/services/apps/basic-search/common/settings"
	basic_search_v1 "github.com/kweaver-ai/idrm-go-common/api/basic_search/v1"
	configuration_center_v1 "github.com/kweaver-ai/idrm-go-common/api/configuration-center/v1"
	meta_v1 "github.com/kweaver-ai/idrm-go-common/api/meta/v1"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/trace"
)

type Domain struct {
	// OpenSearch 客户端
	OpenSearch *opensearch.SearchClient
}

func New(openSearch *opensearch.SearchClient) (Interface, error) {
	ctx := context.TODO()
	// 创建索引，如果不存在
	existed, err := openSearch.ReadClient.IndexExists(es_info_system.IndexName).Do(ctx)
	if err != nil {
		return nil, err
	}
	if !existed {
		// 根据配置动态调整映射配置
		mapping := es_info_system.IndexAFInfoSystemV1
		config := settings.GetConfig()
		if !config.OpenSearchConf.UseHanLP {
			// 将 dict 类型转换为 map[string]any 以便调整
			mappingBytes, err := json.Marshal(mapping)
			if err == nil {
				var mappingMap map[string]any
				if err := json.Unmarshal(mappingBytes, &mappingMap); err == nil {
					es.AdjustMappingForStandardTokenizer(mappingMap)
					mapping = mappingMap
				}
			}
		}
		if _, err := openSearch.WriteClient.CreateIndex(es_info_system.IndexName).BodyJson(mapping).Do(ctx); err != nil {
			return nil, err
		}
	}
	return &Domain{
		OpenSearch: openSearch,
	}, nil
}

// Search 搜索信息系统
func (d *Domain) Search(ctx context.Context, query *basic_search_v1.InfoSystemSearchQuery, opts *basic_search_v1.InfoSystemSearchOptions) (*basic_search_v1.InfoSystemSearchResult, error) {
	var after []any
	if opts.Continue != "" {
		sort, err := base64.StdEncoding.DecodeString(opts.Continue)
		if err != nil {
			return nil, err
		}
		if err := json.Unmarshal(sort, &after); err != nil {
			return nil, err
		}
	}

	got, err := elastic.NewSearchService(d.OpenSearch.ReadClient).
		Index(es_info_system.IndexName).
		Query(newElasticQuery(query)).
		Size(opts.Limit).
		SearchAfter(after...).
		SortBy(newElasticSorter(query)...).
		Highlight(
			elastic.NewHighlight().Fields(
				elastic.NewHighlighterField("name"),
				elastic.NewHighlighterField("description"),
			).
				PreTags(settings.GetConfig().OpenSearchConf.Highlight.PreTag).
				PostTags(settings.GetConfig().OpenSearchConf.Highlight.PostTag),
		).
		Do(ctx)
	if err != nil {
		return nil, err
	}

	// TODO: OpenSearch Result -> InfoSystemSearchResult
	return convertOpenSearchResultToResult(got)
}

var _ Interface = &Domain{}

func newElasticQuery(q *basic_search_v1.InfoSystemSearchQuery) elastic.Query {
	if q == nil {
		return elastic.NewMatchAllQuery()
	}
	return elastic.NewBoolQuery().Must(lo.Filter([]elastic.Query{
		newElasticQueryForKeyword(q.Keyword),
		newElasticQueryForDepartmentIDs(q.DepartmentIDs),
	}, func(q elastic.Query, _ int) bool { return q != nil })...)
}

func newElasticQueryForKeyword(k string) elastic.Query {
	if k == "" {
		return nil
	}
	return elastic.NewMultiMatchQuery(k, "name", "description")
}

func newElasticQueryForDepartmentIDs(ids uuid.UUIDs) elastic.Query {
	if ids == nil {
		return nil
	}
	return elastic.NewTermsQuery("department_id", lo.ToAnySlice(ids)...)
}

func newElasticSorter(query *basic_search_v1.InfoSystemSearchQuery) (sorters []elastic.Sorter) {
	if query != nil && query.Keyword != "" {
		sorters = append(sorters, elastic.NewScoreSort())
		sorters = append(sorters, elastic.NewFieldSort("id"))

	} else {
		sorters = append(sorters, elastic.NewFieldSort("updated_at").Desc())
	}
	return
}

// convertOpenSearchResultToResult OpenSearch 搜索结果转为 InfoSystemSearchResult
func convertOpenSearchResultToResult(result *elastic.SearchResult) (*basic_search_v1.InfoSystemSearchResult, error) {
	out := new(basic_search_v1.InfoSystemSearchResult)

	hits := result.Hits
	if hits == nil {
		return out, nil
	}

	// total
	if hits.TotalHits != nil {
		out.Total.Relation = basic_search_v1.TotalRelation(hits.TotalHits.Relation)
		out.Total.Value = int(hits.TotalHits.Value)
	}

	// entries
	for _, h := range hits.Hits {
		if h == nil {
			continue
		}
		var entry basic_search_v1.InfoSystemWithHighlight
		if err := json.Unmarshal(h.Source, &entry.InfoSystem); err != nil {
			return nil, err
		}
		for k, values := range h.Highlight {
			for _, v := range values {
				switch k {
				// 名称
				case "name":
					entry.NameHighlight = v
				// 描述
				case "description":
					entry.DescriptionHighlight = v
				default:
					log.Warn("unsupported highlight field", zap.String("key", k), zap.String("value", v))
				}
			}
		}
		out.Entries = append(out.Entries, entry)
	}

	// continue
	if len(hits.Hits) > 0 {
		sort, err := json.Marshal(hits.Hits[len(hits.Hits)-1].Sort)
		if err != nil {
			return nil, fmt.Errorf("encode sort as json fail: %w", err)
		}
		out.Continue = base64.StdEncoding.EncodeToString(sort)
	}

	return out, nil
}

// 处理信息系统的创建、删除、更新事件
func (d *Domain) Reconcile(ctx context.Context, event *meta_v1.WatchEvent[configuration_center_v1.InfoSystem]) (err error) {
	ctx, span := trace.StartConsumerSpan(ctx)
	defer func() { trace.TelemetrySpanEnd(span, err) }()

	log.WithContext(ctx).Info("reconcile opensearch document for info system", zap.Any("resource", &event.Resource))
	switch event.Type {
	case meta_v1.Added:
		_, err = d.OpenSearch.WriteClient.
			Index().
			Index(es_info_system.IndexName).
			Id(event.Resource.ID).
			BodyJson(convertCCV1ToBSV1(&event.Resource)).
			Do(ctx)
	case meta_v1.Deleted:
		_, err = d.OpenSearch.WriteClient.
			Delete().
			Index(es_info_system.IndexName).
			Id(event.Resource.ID).
			Do(ctx)
	case meta_v1.Modified:
		_, err = d.OpenSearch.WriteClient.
			Update().
			Index(es_info_system.IndexName).
			Id(event.Resource.ID).
			Doc(convertCCV1ToBSV1(&event.Resource)).
			DocAsUpsert(true).
			Do(ctx)
	default:
		log.Warn("unsupported event type", zap.Any("event", event))
	}
	return
}

func convertCCV1ToBSV1(in *configuration_center_v1.InfoSystem) *basic_search_v1.InfoSystem {
	id, err := uuid.Parse(in.ID)
	if err != nil {
		log.Warn("parse configuration_center_v1/InfoSystem.ID fail", zap.Error(err), zap.String("id", in.ID))
	}
	return &basic_search_v1.InfoSystem{
		ID:           id,
		UpdatedAt:    in.UpdatedAt,
		Name:         in.Name,
		Description:  in.Description,
		DepartmentID: in.DepartmentID,
	}
}
