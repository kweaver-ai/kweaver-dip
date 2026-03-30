package impl

import (
	"context"
	_ "embed"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strconv"
	"strings"

	"github.com/olivere/elastic/v7"
	"github.com/samber/lo"

	"github.com/kweaver-ai/dsg/services/apps/basic-search/adapter/driven/es_common"
	es "github.com/kweaver-ai/dsg/services/apps/basic-search/adapter/driven/es_data_view"
	"github.com/kweaver-ai/dsg/services/apps/basic-search/adapter/driven/opensearch"
	"github.com/kweaver-ai/dsg/services/apps/basic-search/common/errorcode"
	es_common_object "github.com/kweaver-ai/dsg/services/apps/basic-search/common/es"
	"github.com/kweaver-ai/dsg/services/apps/basic-search/common/settings"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/trace"
)

const (
	mappingVersionV1 = "af_data_view_idx_v1"
	mappingVersionV2 = "af_data_view_idx_v2"
)

var (
	//go:embed mapping_v1.json
	mappingV1 string
	//go:embed mapping_v2.json
	mappingV2 string
)

const (
	indicesAlias = "af_data_view_idx"
	IndicesName  = mappingVersionV2
)

var (
	mappingVersionMap = map[string]string{
		mappingVersionV1: mappingV1,
		mappingVersionV2: mappingV2,
	}

	mapping = mappingVersionMap[IndicesName]
)

const (
	rfc3339ms = "2006-01-02T15:04:05.999Z07:00"
)

type objSearch struct {
	esClient *opensearch.SearchClient
}

func NewObjSearch(esClient *opensearch.SearchClient) (es.ESDataView, error) {
	if err := es_common_object.InitIndices(
		context.Background(),
		indicesAlias,
		IndicesName,
		mapping,
		esClient,
	); err != nil {
		return nil, err
	}
	return &objSearch{esClient: esClient}, nil
}

func (e objSearch) Search(ctx context.Context, param *es.SearchParam) (res *es.SearchResult, err error) {
	ctx, span := trace.StartInternalSpan(ctx)
	defer func() { trace.TelemetrySpanEnd(span, err) }()

	searchSource := elastic.NewSearchSource()
	searchSource.Size(param.Size)

	e.addQuery(searchSource, &param.BaseSearchParam)

	isHighlight := len(param.Keyword) > 0
	if isHighlight {
		highlight := elastic.NewHighlight().NumOfFragments(0).Order("score").
			Fields(
				elastic.NewHighlighterField(es.Name),
				elastic.NewHighlighterField(es.NameNgram),
				elastic.NewHighlighterField(es.NameNgram),
				elastic.NewHighlighterField(es.Description),
				elastic.NewHighlighterField(es.DescriptionNgram),
				elastic.NewHighlighterField(es.DescriptionGraph),
				elastic.NewHighlighterField(es.Fields+"."+es.FieldNameZH),
				elastic.NewHighlighterField(es.Fields+"."+es.FieldNameEN),
				elastic.NewHighlighterField(es.Fields+"."+es.FieldNameZHNgram),
				elastic.NewHighlighterField(es.Fields+"."+es.FieldNameZHGraph),
				elastic.NewHighlighterField(es.Fields+"."+es.FieldNameENNgram),
				elastic.NewHighlighterField(es.Fields+"."+es.FieldNameENGraph),
			)
		if len(settings.GetConfig().OpenSearchConf.Highlight.PreTag) > 0 {
			highlight.PreTags(settings.GetConfig().OpenSearchConf.Highlight.PreTag)
		}
		if len(settings.GetConfig().OpenSearchConf.Highlight.PostTag) > 0 {
			highlight.PostTags(settings.GetConfig().OpenSearchConf.Highlight.PostTag)
		}
		searchSource.Highlight(highlight)
	}

	// sort
	var preDirection string
	diff := false
	for _, order := range param.Orders {
		ascending := order.Direction == "asc"
		sort := elastic.NewFieldSort(order.Sort).Order(ascending)
		if order.Sort != es.Score {
			sort = sort.Missing(lo.If(ascending, "_first").Else("_last"))
		}
		searchSource.SortBy(sort)

		if len(preDirection) < 1 {
			preDirection = order.Direction
		} else if !diff && preDirection != order.Direction {
			diff = true
		}
	}
	idAscending := lo.If(len(param.Orders) < 2, preDirection == "asc").Else(!diff)
	searchSource.SortBy(elastic.NewFieldSort(es.ID).Order(idAscending).Missing(lo.If(idAscending, "_first").Else("_last")))

	// search_after
	if err = e.addSearchAfter(searchSource, param.NextFlag, param.Orders); err != nil {
		return nil, err
	}

	// total_count
	e.addCountAggs(searchSource)

	searchParamJson := lo.T2(json.Marshal(lo.T2(searchSource.Source()).A)).A
	log.WithContext(ctx).Infof("search param json: %s", searchParamJson)
	result, err := e.esClient.ReadClient.Search(indicesAlias).SearchSource(searchSource).Do(ctx)
	if err != nil {
		log.WithContext(ctx).Errorf("failed to search from es, err info: %v", err)
		return nil, errorcode.Detail(errorcode.PublicESError, err)
	}

	// total count
	totalCount, _ := result.Aggregations.ValueCount("total_count")

	if result.Hits == nil {
		return nil, nil
	} else {
		resp := &es.SearchResult{
			TotalCount: int64(*totalCount.Value),
		}
		resp.Items, resp.NextFlag = searchResultEach(result)
		return resp, nil
	}
}

func (e objSearch) addQuery(searchSource *elastic.SearchSource, param *es.BaseSearchParam) {
	var shouldQs, filterQs []elastic.Query
	if len(param.Keyword) > 0 {
		shouldQs = append(shouldQs, elastic.NewMultiMatchQuery(param.Keyword,
			es.Name, es.NameGraph, es.NameNgram,
			es.Code,
			es.Description, es.DescriptionGraph, es.DescriptionNgram,
			//es.OrgName, es.OrgNameNgram, es.OrgNameGraph,
			//es.DataOwnerName, es.DataOwnerNameGraph, es.DataOwnerNameNgram,
			es.FieldNameZH, es.FieldNameEN, // 字段中英文名称
		))
		// nested 匿名结构体嵌套查询
		shouldQs = append(shouldQs, elastic.NewNestedQuery(es.Fields, elastic.NewMultiMatchQuery(
			param.Keyword, es.Fields+"."+es.FieldNameZH, es.Fields+"."+es.FieldNameEN, // 字段中英文名称
			es.Fields+"."+es.FieldNameZHNgram, es.Fields+"."+es.FieldNameZHGraph,
			es.Fields+"."+es.FieldNameENNgram, es.Fields+"."+es.FieldNameENGraph)))
	}

	if len(param.SubjectDomainID) > 0 {
		filterQs = append(filterQs, elastic.NewTermsQuery(es.SubjectDomainID, lo.ToAnySlice(param.OrgCode)...))
	}

	if len(param.OrgCode) > 0 {
		filterQs = append(filterQs, elastic.NewTermsQuery(es.OrgCode, lo.ToAnySlice(param.OrgCode)...))
	}

	if param.PublishedAt != nil && (param.PublishedAt.StartTime != nil || param.PublishedAt.EndTime != nil) {
		rangeQ := elastic.NewRangeQuery(es.PublishedAt)
		if param.PublishedAt.StartTime != nil {
			rangeQ.Gte(param.PublishedAt.StartTime.Format(rfc3339ms))
		}

		if param.PublishedAt.EndTime != nil {
			rangeQ.Lte(param.PublishedAt.EndTime.Format(rfc3339ms))
		}

		filterQs = append(filterQs, rangeQ)
	}

	if len(shouldQs) < 1 && len(filterQs) < 1 {
		return
	}

	boolQ := elastic.NewBoolQuery()
	if len(shouldQs) > 0 {
		boolQ.Should(shouldQs...)
	}

	if len(filterQs) > 0 {
		boolQ.Filter(filterQs...)
	}
	if len(shouldQs) >= 2 {
		boolQ.MinimumNumberShouldMatch(1)
	}

	searchSource.Query(boolQ)
}

func (e objSearch) addSearchAfter(searchSource *elastic.SearchSource, nextFlag []string, orders []es.Order) error {
	if len(nextFlag) < 1 {
		return nil
	}

	if len(nextFlag)-1 != len(orders) {
		// search_after应该与排序字段的数量一致，不一致则有问题
		err := fmt.Errorf("internal error, next flag is %v, orders is %v", nextFlag, orders)
		log.Error(err.Error())
		return errorcode.Detail(errorcode.PublicInternalError, err)
	}

	var newFlag []any
	for _, order := range orders {
		old := nextFlag[0]
		nextFlag = nextFlag[1:]

		switch order.Sort {
		case es.PublishedAt:
			v, err := strconv.ParseFloat(old, 64)
			if err != nil {
				log.Errorf("failed to parse next flag to int, flag: %v, err: %v", old, err)
				return errorcode.Detail(errorcode.PublicInvalidParameterValue, err, "next_flag") // TODO 接口层校验
			}

			newFlag = append(newFlag, int64(v))

		case es.Score:
			v, err := strconv.ParseFloat(old, 64)
			if err != nil {
				log.Errorf("failed to parse next flag to float, flag: %v, err: %v", old, err)
				return errorcode.Detail(errorcode.PublicInvalidParameterValue, err, "next_flag") // TODO 接口层校验
			}

			newFlag = append(newFlag, v)
		}
	}

	newFlag = append(newFlag, lo.ToAnySlice(nextFlag)...)
	searchSource.SearchAfter(newFlag...)

	return nil
}

func searchResultEach(r *elastic.SearchResult) (items []es.SearchResultItem, nextFlag []string) {
	if r.Hits == nil || r.Hits.Hits == nil || len(r.Hits.Hits) == 0 {
		return nil, nil
	}

	slice := make([]es.SearchResultItem, 0, len(r.Hits.Hits))
	for _, hit := range r.Hits.Hits {
		var v es.SearchResultItem
		if hit.Source == nil {
			slice = append(slice, v)
			continue
		}

		if err := json.Unmarshal(hit.Source, &v); err != nil {
			continue
		}

		v.RawName = v.Name
		v.RawDescription = v.Description
		v.RawDataOwnerName = v.DataOwnerName

		if len(v.Fields) > 0 {
			for _, field := range v.Fields {
				field.RawFieldNameZH = field.FieldNameZH
				field.RawFieldNameEN = field.FieldNameEN
			}
		}

		var (
			existTitle       bool
			existDesc        bool
			existFieldNameZH bool
			existFieldNameEN bool
		)

		fieldsMapZH := make(map[string]string)
		fieldsMapEN := make(map[string]string)

		for field, highlightV := range hit.Highlight {
			if existTitle && existDesc {
				break
			}

			if !existTitle && strings.HasPrefix(field, es.Name) {
				v.Name = highlightV[0]
				existTitle = true
			}

			if !existDesc && strings.HasPrefix(field, es.Description) {
				v.Description = highlightV[0]
				existDesc = true
			}

			switch field {
			case es.Fields + "." + es.FieldNameZH,
				es.Fields + "." + es.FieldNameZHNgram,
				es.Fields + "." + es.FieldNameZHGraph:
				for _, s := range highlightV {
					str1 := strings.ReplaceAll(s, settings.GetConfig().OpenSearchConf.Highlight.PreTag, "")
					str1 = strings.ReplaceAll(str1, settings.GetConfig().OpenSearchConf.Highlight.PostTag, "")
					fieldsMapZH[str1] = s
				}
				existFieldNameZH = true
			case es.Fields + "." + es.FieldNameEN,
				es.Fields + "." + es.FieldNameENNgram,
				es.Fields + "." + es.FieldNameENGraph:
				for _, s := range highlightV {
					str1 := strings.ReplaceAll(s, settings.GetConfig().OpenSearchConf.Highlight.PreTag, "")
					str1 = strings.ReplaceAll(str1, settings.GetConfig().OpenSearchConf.Highlight.PostTag, "")
					fieldsMapEN[str1] = s
				}
				existFieldNameEN = true
			}
			if existFieldNameZH || existFieldNameEN {
				highlights := make([]*es_common.Field, 0)
				excluded := make([]*es_common.Field, 0)
				for _, currentField := range v.Fields {
					if name, ok := fieldsMapZH[currentField.RawFieldNameZH]; ok {
						currentField.FieldNameZH = name
						currentField.Hit = true
					}
					if name, ok := fieldsMapEN[currentField.RawFieldNameEN]; ok {
						currentField.FieldNameEN = name
						currentField.Hit = true
					}
					if currentField.Hit {
						highlights = append(highlights, currentField)
					} else {
						excluded = append(excluded, currentField)
					}
				}
				result := append(highlights, excluded...)
				v.Fields = result
			}
		}
		slice = append(slice, v)
	}

	var after []string
	if len(r.Hits.Hits) > 0 {
		after = lo.Map(r.Hits.Hits[len(r.Hits.Hits)-1].Sort, func(item any, _ int) string {
			return fmt.Sprint(item)
		})
	}

	return slice, after
}

func (e objSearch) Index(ctx context.Context, doc *es.DataViewDoc) (err error) {
	ctx, span := trace.StartInternalSpan(ctx)
	defer func() { trace.TelemetrySpanEnd(span, err) }()

	if doc == nil {
		return nil
	}
	log.WithContext(ctx).Infof("index doc to es,index: %v, doc id: %v", indicesAlias, doc.DocID)

	resp, err := e.esClient.WriteClient.
		Index().
		Index(indicesAlias).
		Id(doc.DocID).
		BodyJson(doc).
		Do(ctx)
	if err != nil {
		log.WithContext(ctx).Errorf("failed to index doc to es, err info: %v", err.Error())
		return err
	}

	log.WithContext(ctx).Infof("es index doc resp: %v", *resp)
	return nil
}

func (e objSearch) Delete(ctx context.Context, id string) (err error) {
	ctx, span := trace.StartInternalSpan(ctx)
	defer func() { trace.TelemetrySpanEnd(span, err) }()

	log.WithContext(ctx).Infof("delete data-view  doc from es, doc id")
	if id == "" {
		return nil
	}
	resp, err := e.esClient.WriteClient.
		Delete().
		Index(indicesAlias).
		Id(id).
		Do(ctx)
	if err != nil {
		var esErr *elastic.Error
		if errors.As(err, &esErr) && esErr.Status == http.StatusNotFound {
			log.WithContext(ctx).Warnf("failed to delete doc from es, doc not found, docid: %v, err: %v", id, err)
			return nil
		}

		log.WithContext(ctx).Errorf("failed to delete doc from es, err: %v", err)
		return err
	}

	log.WithContext(ctx).Infof("es delete doc resp: %v", *resp)
	return nil
}

func (e objSearch) addCountAggs(source *elastic.SearchSource) {
	source.Aggregation("total_count", elastic.NewValueCountAggregation().Field(es.ID))
}
