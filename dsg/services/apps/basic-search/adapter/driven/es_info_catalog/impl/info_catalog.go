package es_info_catalog

import (
	"context"
	_ "embed"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/olivere/elastic/v7"
	"github.com/samber/lo"
	"go.uber.org/zap"

	"github.com/kweaver-ai/dsg/services/apps/basic-search/adapter/driven/es_common"
	es "github.com/kweaver-ai/dsg/services/apps/basic-search/adapter/driven/es_info_catalog"
	"github.com/kweaver-ai/dsg/services/apps/basic-search/adapter/driven/opensearch"
	"github.com/kweaver-ai/dsg/services/apps/basic-search/common/errorcode"
	es_common_object "github.com/kweaver-ai/dsg/services/apps/basic-search/common/es"
	"github.com/kweaver-ai/dsg/services/apps/basic-search/common/settings"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/trace"
)

// ES索引别名,名称,mapping版本
const (
	indicesAlias = "af_info_catalog_idx"
	IndicesName  = mappingVersionV4
)

const (
	mappingVersionV1 = "af_info_catalog_idx_v1"
	//mappingVersionV3 = "af_info_catalog_idx_v3"
	mappingVersionV4 = "af_info_catalog_idx_v4"
)

var (
	//go:embed mapping_v1.json
	mappingV1 string
	//go:embed mapping_v4.json
	mappingV4 string
)

var (
	mappingVersionMap = map[string]string{
		mappingVersionV1: mappingV1,
		mappingVersionV4: mappingV4,
	}

	mapping = mappingVersionMap[IndicesName]
)

const (
	indicesAlreadyExistsErrType = "resource_already_exists_exception"
)

type search struct {
	searchCli *opensearch.SearchClient
}

func NewSearch(ctx context.Context, esClient *opensearch.SearchClient) (es.Search, error) {

	if err := es_common_object.InitIndices(
		context.Background(),
		indicesAlias,
		IndicesName,
		mapping,
		esClient,
	); err != nil {
		return nil, err
	}

	return &search{searchCli: esClient}, nil
}

func (s search) Search(ctx context.Context, param *es.SearchParam) (res *es.SearchResult, err error) {
	ctx, span := trace.StartInternalSpan(ctx)
	defer func() { trace.TelemetrySpanEnd(span, err) }()

	searchSource := elastic.NewSearchSource()

	// size
	searchSource.Size(param.Size)

	// query
	s.addQuery(searchSource, &param.BaseSearchParam)

	// highlight
	isHighlight := len(param.Keyword) > 0
	if isHighlight {
		highlight := elastic.NewHighlight().NumOfFragments(0).Order("score").
			Fields(
				elastic.NewHighlighterField(es.Name),
				elastic.NewHighlighterField(es.NameNgram),
				elastic.NewHighlighterField(es.NameGraph),
				elastic.NewHighlighterField(es.Code),
				elastic.NewHighlighterField(es.Description),
				elastic.NewHighlighterField(es.DescriptionGraph),
				elastic.NewHighlighterField(es.DescriptionNgram),
				elastic.NewHighlighterField(es.Fields+"."+es.FieldNameZH),
				elastic.NewHighlighterField(es.Fields+"."+es.FieldNameEN),
				elastic.NewHighlighterField(es.Fields+"."+es.FieldNameZHNgram),
				elastic.NewHighlighterField(es.Fields+"."+es.FieldNameZHGraph),
				elastic.NewHighlighterField(es.Fields+"."+es.FieldNameENNgram),
				elastic.NewHighlighterField(es.Fields+"."+es.FieldNameENGraph),
				elastic.NewHighlighterField(es.LabelListRespName),
				elastic.NewHighlighterField(es.LabelListRespNameNgram),
				elastic.NewHighlighterField(es.LabelListRespNameGraph),
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
		if order.Sort == es.OnlineAt {
			continue
		}
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
	if param.Keyword == "" {
		sortScript := `
		if (doc.containsKey('online_at') && doc['online_at'].size() > 0){
			return doc['online_at'].value.getMillis();
		}else {
			return 0;
		}
	`
		searchSource.SortBy(elastic.NewScriptSort(elastic.NewScript(sortScript), "number").Order(false))
	}
	searchSource.SortBy(elastic.NewFieldSort(es.ID).Order(idAscending).Missing(lo.If(idAscending, "_first").Else("_last")))

	// search_after
	if err := s.addSearchAfter(searchSource, param.NextFlag, param.Orders); err != nil {
		return nil, err
	}

	// aggs
	//hasAggs := param.Statistics && len(param.NextFlag) < 1
	//if hasAggs {
	//	s.addAggs(searchSource)
	//}
	s.addCountAggs(searchSource)

	searchParamJson := lo.T2(json.Marshal(lo.T2(searchSource.Source()).A)).A
	log.WithContext(ctx).Infof("search param json: %s", searchParamJson)
	result, err := s.searchCli.ReadClient.Search(indicesAlias).SearchSource(searchSource).Do(ctx)
	if err != nil {
		log.WithContext(ctx).Errorf("failed to search from es, body: %s, err: %v", searchParamJson, err)
		return nil, errorcode.Detail(errorcode.PublicESError, err)
	}

	ret := &es.SearchResult{}

	if result.Hits == nil {
		return ret, nil
	}

	totalCount, _ := result.Aggregations.ValueCount("total_count")
	ret.Total = int64(*totalCount.Value)
	ret.Items, ret.NextFlag = searchResultEach(result)

	return ret, nil
}

func searchResultEach(r *elastic.SearchResult) ([]es.SearchResultItem, []string) {
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
		log.Debug("info catalog source", zap.Any("source", hit.Source))

		if err := json.Unmarshal(hit.Source, &v); err != nil {
			log.Warn("unmarshal opensearch document fail", zap.Any("source", hit.Source))
			continue
		}
		log.Debug("info catalog item", zap.Any("item", v))

		v.RawName = v.Name
		v.RawDescription = v.Description
		v.RawCode = v.Code

		if len(v.Fields) > 0 {
			for _, field := range v.Fields {
				field.RawFieldNameZH = field.FieldNameZH
				field.RawFieldNameEN = field.FieldNameEN
			}
		}

		var existCode, existName, existDesc bool
		var (
			existFieldNameZH bool
			existFieldNameEN bool
		)

		fieldsMapZH := make(map[string]string)
		fieldsMapEN := make(map[string]string)

		for field, highlightV := range hit.Highlight {

			if existName && existCode && existDesc &&
				existFieldNameZH && existFieldNameEN {
				break
			}
			if !existCode && strings.HasPrefix(field, es.Code) {
				v.Code = highlightV[0]
				existCode = true
			}

			if !existName && strings.HasPrefix(field, es.Name) {
				v.Name = highlightV[0]
				existName = true
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

const (
	dataKindCount    = "data_kind_count"
	dataRangeCount   = "data_range_count"
	updateCycleCount = "update_cycle_count"
	SharedTypeCount  = "shared_type_count"
)

func (s search) Aggs(ctx context.Context, param *es.AggsParam) (*es.AggsResult, error) {
	searchSource := elastic.NewSearchSource()

	// size is 0
	searchSource.Size(0)

	// query
	s.addQuery(searchSource, &param.BaseSearchParam)

	// aggs
	s.addAggs(searchSource)

	searchParamJson := lo.T2(json.Marshal(lo.T2(searchSource.Source()).A)).A
	log.WithContext(ctx).Infof("search param json: %s", searchParamJson)
	result, err := s.searchCli.ReadClient.Search(indicesAlias).SearchSource(searchSource).Do(ctx)
	if err != nil {
		log.WithContext(ctx).Errorf("failed to search from es, body: %s, err: %v", searchParamJson, err)
		return nil, errorcode.Detail(errorcode.PublicESError, err)
	}

	res := &es.AggsResult{}
	res.DataKindCount = getDocCount(result.Aggregations, dataKindCount)
	res.DataRangeCount = getDocCount(result.Aggregations, dataRangeCount)
	res.UpdateCycleCount = getDocCount(result.Aggregations, updateCycleCount)
	res.SharedTypeCount = getDocCount(result.Aggregations, SharedTypeCount)

	return res, nil
}

func getDocCount(aggs elastic.Aggregations, name string) (ret map[int64]int64) {
	if bucketKeyItems, exist := aggs.Terms(name); exist {
		for _, keyItem := range bucketKeyItems.Buckets {
			dataKind, ok := keyItem.Key.(float64)
			if !ok {
				log.Warnf("unsupported %s kind: %T %v", name, keyItem.Key, keyItem.Key)
				continue
			}

			if ret == nil {
				ret = make(map[int64]int64)
			}

			ret[int64(dataKind)] = keyItem.DocCount
		}
	}

	return
}

func (s search) addAggs(searchSource *elastic.SearchSource) {

	searchSource.Aggregation(dataRangeCount, elastic.NewTermsAggregation().Field(es.DataRange))
	searchSource.Aggregation(updateCycleCount, elastic.NewTermsAggregation().Field(es.UpdateCycle))
	searchSource.Aggregation(SharedTypeCount, elastic.NewTermsAggregation().Field(es.SharedType))
}

const (
	rfc3339ms = "2006-01-02T15:04:05.999Z07:00"
)

func (s search) addQuery(searchSource *elastic.SearchSource, param *es.BaseSearchParam) {
	// elastic.Query ,its method Source() returns the JSON-serializable query request.
	var filterQs []elastic.Query

	// 根据 keyword 构造 elastic.Query
	// Fields是字段列表。如果非空，关键字仅匹配指定字段
	// 基础搜索支持code，name，description，fields的全文搜索
	var shouldQs = queriesForKeywordAndFields(param.Keyword, param.Fields)

	// 当用户没有筛选数据资源目录已发布，即“不限”，或要求数据资源目录已发布时才根据发布时间过滤搜索结果
	// 2.0.0.10 如果发布状态不限，那么不需要通过发布状态进行筛选，除非明确要用“已发布”或者“未发布”来进行筛选，只能单选
	// 2.0.0.10 消息和索引都没有 IsPublish 和 IsOnline

	var wantPublished bool = param.IsPublish == nil || *param.IsPublish
	if wantPublished && param.PublishedAt != nil && (param.PublishedAt.StartTime != nil || param.PublishedAt.EndTime != nil) {
		rangeQ1 := elastic.NewRangeQuery(es.PublishedAt)
		boolFilter := elastic.NewBoolQuery().Should(rangeQ1)
		if param.PublishedAt.StartTime != nil {
			rangeQ1.Gte(param.PublishedAt.StartTime.Format(rfc3339ms))
		}
		if param.PublishedAt.EndTime != nil {
			rangeQ1.Lte(param.PublishedAt.EndTime.Format(rfc3339ms))
		}
		filterQs = append(filterQs, boolFilter)
	}

	// 当用户没有筛选数据资源目录已上线，即“不限”，或要求数据资源目录已上线时才根据上线时间过滤搜索结果
	// 2.0.0.10 如果上线状态不限，那么不需要通过上线状态进行筛选，除非明确要用“已上线”或者“未上线”来进行筛选，只能单选

	var wantOnline bool = param.IsOnline == nil || *param.IsOnline
	if wantOnline && param.OnlineAt != nil && (param.OnlineAt.StartTime != nil || param.OnlineAt.EndTime != nil) {
		rangeQ1 := elastic.NewRangeQuery(es.OnlineAt)
		boolFilter := elastic.NewBoolQuery().Should(rangeQ1)
		if param.OnlineAt.StartTime != nil {
			rangeQ1.Gte(param.OnlineAt.StartTime.Format(rfc3339ms))
		}
		if param.OnlineAt.EndTime != nil {
			rangeQ1.Lte(param.OnlineAt.EndTime.Format(rfc3339ms))
		}
		filterQs = append(filterQs, boolFilter)
	}

	if len(param.IdS) > 0 {

		var id []interface{}
		for _, v := range param.IdS {
			if v != "" {
				id = append(id, v)
			}
		}

		if len(id) > 0 {
			filterQs = append(filterQs, elastic.NewTermsQuery(es.Doc_ID, id...))
		}
	}

	if param.IsPublish != nil {
		filterQs = append(filterQs, elastic.NewTermQuery(es.IsPublish, *param.IsPublish))
	}

	if param.IsOnline != nil {
		filterQs = append(filterQs, elastic.NewTermQuery(es.IsOnline, *param.IsOnline))
	}

	// 根据发布状态筛选
	if param.PublishedStatus != nil {

		var pv []interface{}
		for _, v := range param.PublishedStatus {
			pv = append(pv, v)
		}
		filterQs = append(filterQs, elastic.NewTermsQuery(es.PubishedStatus, pv...))
	}

	// 根据上线状态筛选
	if param.OnlineStatus != nil {

		var pv []interface{}
		for _, v := range param.OnlineStatus {
			pv = append(pv, v)
		}
		filterQs = append(filterQs, elastic.NewTermsQuery(es.OnlineStatus, pv...))
	}

	if len(param.DataRange) > 0 {
		filterQs = append(filterQs, elastic.NewTermsQuery(es.DataRange, lo.ToAnySlice(param.DataRange)...))
	}

	if len(param.UpdateCycle) > 0 {
		filterQs = append(filterQs, elastic.NewTermsQuery(es.UpdateCycle, lo.ToAnySlice(param.UpdateCycle)...))
	}

	if len(param.SharedType) > 0 {
		filterQs = append(filterQs, elastic.NewTermsQuery(es.SharedType, lo.ToAnySlice(param.SharedType)...))
	}

	//if len(param.BusinessObjectID) > 0 {
	//	nestedQs := elastic.NewNestedQuery(es.BusinessObjects, elastic.NewTermsQuery(es.BusinessObjectID, lo.ToAnySlice(param.BusinessObjectID)...))
	//	filterQs = append(filterQs, nestedQs)
	//}

	// 逻辑：cateID(类目id)是需要指定的
	//1、如果NodeIDS 都是具体的值(类目树中具体的节点列表)
	//对应的值之间是或的关系
	//2、如果NodeIDS 是未分类的
	//则把对应的cateID 剔除
	//3、如果NodeIDS 是具体的值和未分类的
	//既包括了具体值，或排除这个CateID的
	if len(param.CateInfoR) > 0 {

		var cateFilterQ []elastic.Query
		for _, v := range param.CateInfoR {

			var cateQ []elastic.Query
			var query elastic.Query

			if v.CateID != "" && len(v.NodeIdS) > 0 {

				var (
					nodeIds      []interface{}
					nodeIsUnCate bool
				)
				for _, v := range v.NodeIdS {

					if v == "" {
						continue
					}

					if strings.ToLower(v) == "unclassified" {
						nodeIsUnCate = true
					} else {
						nodeIds = append(nodeIds, v)
					}
				}

				// 只有未分类
				if nodeIsUnCate {
					query = elastic.NewTermQuery("cate_info.cate_id", v.CateID)
					query1 := elastic.NewBoolQuery().MustNot(query)
					cateQ = append(cateQ, query1)
				}
				if len(nodeIds) > 0 {
					// 只关联了类目
					query1 := elastic.NewBoolQuery().Filter(elastic.NewTermQuery("cate_info.cate_id", v.CateID),
						elastic.NewTermsQuery("cate_info.node_id", nodeIds...))
					cateQ = append(cateQ, query1)
				}

				if nodeIsUnCate && len(nodeIds) == 0 {
					query = elastic.NewBoolQuery().MustNot(elastic.NewNestedQuery(es.CateInfo, query))

				} else if !nodeIsUnCate && len(nodeIds) > 0 {
					queryStr := elastic.NewBoolQuery().Must(cateQ...)
					query = elastic.NewNestedQuery(es.CateInfo, queryStr)

				} else if nodeIsUnCate && len(nodeIds) > 0 {
					// 既关联了类目 也 存在未分类的
					queryStr := elastic.NewBoolQuery().Should(cateQ...).MinimumNumberShouldMatch(1)
					query = elastic.NewNestedQuery(es.CateInfo, queryStr)

				}
				cateFilterQ = append(cateFilterQ, query)
			}
		}

		filterQs = append(filterQs, cateFilterQ...)
	}

	// 2.0.0.10信息资源目录的基础搜索，增加业务流程的筛选， 支持多选， 但是必须选择业务流程，不能选择业务域筛选
	// 处理前端传来的业务流程筛选项ID列表，BusinessProcessId，不存在“unclassified”类型，为空或者都是确定的业务流程

	if len(param.BusinessProcessIDs) > 0 {
		var businessProcessIDs []interface{}
		for _, v := range param.BusinessProcessIDs {
			if v != "" {
				businessProcessIDs = append(businessProcessIDs, v)
			}
		}

		if len(businessProcessIDs) > 0 {
			var businessProcessIDsQ []elastic.Query
			businessProcessIDsQuery := elastic.NewNestedQuery("business_processes", elastic.NewTermsQuery("business_processes.id", businessProcessIDs...))
			businessProcessIDsQ = append(businessProcessIDsQ, businessProcessIDsQuery)
			filterQs = append(filterQs, businessProcessIDsQ...)
		}

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
	if len(shouldQs) != 0 {
		boolQ.MinimumNumberShouldMatch(1)
	}
	searchSource.Query(boolQ)
}

func (s search) Index(ctx context.Context, item *es.Item) (err error) {
	ctx, span := trace.StartInternalSpan(ctx)
	defer func() { trace.TelemetrySpanEnd(span, err) }()
	if item == nil {
		return nil
	}

	log.WithContext(ctx).Infof("index doc to es, docid: %v", item.DocId)
	resp, err := s.searchCli.WriteClient.
		Index().
		Index(indicesAlias).
		Id(item.DocId).
		BodyJson(item).
		Do(ctx)
	if err != nil {
		log.WithContext(ctx).Errorf("failed to index doc from es, err: %v", err)
		return err
	}

	log.WithContext(ctx).Infof("es index doc resp: %v", *resp)
	return nil
}

func (s search) UpdateTableRowsAndUpdatedAt(ctx context.Context, tableId string, tableRows *int64, updatedAt *time.Time) error {
	if len(tableId) < 1 || (tableRows == nil && updatedAt == nil) {
		return nil
	}

	// log.WithContext(ctx).Infof("es update by query resp: %v", *resp)
	return nil
}

func (s search) Delete(ctx context.Context, id string) (err error) {
	ctx, span := trace.StartInternalSpan(ctx)
	defer func() { trace.TelemetrySpanEnd(span, err) }()
	if len(id) < 1 {
		return nil
	}

	log.WithContext(ctx).Infof("delete doc from es, docid: %v", id)
	if id == "" {
		return nil
	}
	resp, err := s.searchCli.WriteClient.
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

func (s search) addSearchAfter(searchSource *elastic.SearchSource, nextFlag []string, orders []es.Order) error {
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
		case es.UpdatedAt:
			v, err := strconv.ParseFloat(old, 64)
			if err != nil {
				log.Errorf("failed to parse next flag to int, flag: %v, err: %v", old, err)
				return errorcode.Detail(errorcode.PublicInvalidParameterValue, err, "next_flag") // TODO 接口层校验
			}
			newFlag = append(newFlag, int64(v))
		case es.OnlineAt:
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

func (s *search) addCountAggs(source *elastic.SearchSource) {
	source.Aggregation("total_count", elastic.NewValueCountAggregation().Field(es.ID))
}

// 支持目录名称、编码、描述、信息项的搜索，优先进行编码的精准搜索，匹配时，展示对应的目录卡片，同时展示该目录的详细信息。
// 如果没有编码命中，再进行名称、描述及信息项的模糊搜索，信息项命中时，将命中信息项前置展示。
var allFields = []string{
	es.Name,
	es.Code,
	es.Description,
	es.Fields,
}

// "name" 对应的字段
var fieldsForName = []string{
	es.Name,
	es.NameGraph,
	es.NameNgram,
}

// "code" 对应的字段
var fieldsForCode = []string{
	es.Code,
}

// "description" 对应的字段
var fieldsForDescription = []string{
	es.Description,
	es.DescriptionGraph,
	es.DescriptionNgram,
}

var fieldsForLabelNames = []string{
	es.LabelListRespName,
	es.LabelListRespNameGraph,
	es.LabelListRespNameNgram,
}

// "fields" 对应的字段
var (
	fieldsForFields = []string{
		es.FieldNameEN,
		es.FieldNameENNgram,
		es.FieldNameENNgram,
		es.FieldNameZH,
	}
	nestedFieldsForFields = []string{
		es.Fields + "." + es.FieldNameEN,
		es.Fields + "." + es.FieldNameENGraph,
		es.Fields + "." + es.FieldNameENNgram,
		es.Fields + "." + es.FieldNameZH,
		es.Fields + "." + es.FieldNameZHGraph,
		es.Fields + "." + es.FieldNameZHNgram,
	}
)

// "business_form.name" 对应的字段
var fieldsForBusinessFormName = []string{
	es.BusinessFormName,
	es.BusinessFormNameNgram,
	es.BusinessFormNameGraph,
}

// "business_model.name" 对应的字段
var fieldsForBusinessModelName = []string{
	es.BusinessModelName,
	es.BusinessModelNameNgram,
	es.BusinessModelNameGraph,
}

// "departments.name" 对应的字段
var nestedFieldsForDepartmentsName = []string{
	es.DepartmentsName,
	es.DepartmentsNameNgram,
	es.DepartmentsNameGraph,
}

// "business_domain.name" 对应的字段
var fieldsForBusinessDomainName = []string{
	es.BusinessDomainName,
	es.BusinessDomainNameNgram,
	es.BusinessDomainNameGraph,
}

// "data_resource_catalogs.name" 对应的字段
var nestedFieldsForDataResourceCatalogsName = []string{
	es.DataResourceCatalogsName,
	es.DataResourceCatalogsNameNgram,
	es.DataResourceCatalogsNameGraph,
}

// queriesForKeywordAndFields 根据 keyword 构造 elastic.Query
// fields 是信息项字段列表。如果非空，关键字仅匹配指定字段
func queriesForKeywordAndFields(keyword string, fields []string) (queries []elastic.Query) {
	// query == "", search all docs
	if keyword == "" {
		return
	}

	// 如果未指定，匹配所有字段
	if fields == nil {
		fields = allFields
	}

	// 优先搜索 code，如果与code不匹配，采用全文搜索， name，id，description
	// 支持以下四个部分的全文搜索，id，code，name，description，fields
	var matchFields []string
	for _, f := range fields {
		switch f {
		case es.Name:
			matchFields = append(matchFields, fieldsForName...)
		case es.Code:
			matchFields = append(matchFields, fieldsForCode...)
		case es.Description:
			matchFields = append(matchFields, fieldsForDescription...)
		case es.Fields:
			matchFields = append(matchFields, fieldsForFields...)
			// nested 匿名结构体嵌套查询
			queries = append(queries, elastic.NewNestedQuery(es.Fields, elastic.NewMultiMatchQuery(keyword, nestedFieldsForFields...)))
		case es.BusinessFormName:
			matchFields = append(matchFields, fieldsForBusinessFormName...)
		case es.BusinessModelName:
			matchFields = append(matchFields, fieldsForBusinessModelName...)
		case es.DepartmentsName:
			queries = append(queries, elastic.NewNestedQuery(es.Departments, elastic.NewMultiMatchQuery(keyword, nestedFieldsForDepartmentsName...)))
		case es.BusinessDomainName:
			matchFields = append(matchFields, es.BusinessDomainName)
		case es.DataResourceCatalogsName:
			queries = append(queries, elastic.NewNestedQuery(es.DataResourceCatalogs, elastic.NewMultiMatchQuery(keyword, nestedFieldsForDataResourceCatalogsName...)))
		case es.LabelListRespName:
			queries = append(queries, elastic.NewNestedQuery(es.LabelListResp, elastic.NewMultiMatchQuery(keyword, fieldsForLabelNames...)))
		default:
			log.Warn("unsupported field", zap.String("field", f))
		}
	}

	if matchFields != nil {
		queries = append(queries, elastic.NewMultiMatchQuery(keyword, matchFields...))
	}

	return
}
