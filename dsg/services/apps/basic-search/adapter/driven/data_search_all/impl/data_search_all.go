package impl

import (
	"context"
	"encoding/json"
	"fmt"
	"strconv"
	"strings"
	"time"

	"github.com/olivere/elastic/v7"
	"github.com/samber/lo"
	"go.uber.org/zap"

	all "github.com/kweaver-ai/dsg/services/apps/basic-search/adapter/driven/data_search_all"
	"github.com/kweaver-ai/dsg/services/apps/basic-search/adapter/driven/es_common"
	es_data_view2 "github.com/kweaver-ai/dsg/services/apps/basic-search/adapter/driven/es_data_view"
	es_data_view "github.com/kweaver-ai/dsg/services/apps/basic-search/adapter/driven/es_data_view/impl"
	es_indicator2 "github.com/kweaver-ai/dsg/services/apps/basic-search/adapter/driven/es_indicator"
	es_indicator "github.com/kweaver-ai/dsg/services/apps/basic-search/adapter/driven/es_indicator/impl"
	es_interface_svc2 "github.com/kweaver-ai/dsg/services/apps/basic-search/adapter/driven/es_interface_svc"
	es_interface_svc "github.com/kweaver-ai/dsg/services/apps/basic-search/adapter/driven/es_interface_svc/impl"
	"github.com/kweaver-ai/dsg/services/apps/basic-search/adapter/driven/opensearch"
	"github.com/kweaver-ai/dsg/services/apps/basic-search/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/basic-search/common/settings"
	log "github.com/kweaver-ai/idrm-go-frame/core/logx/zapx"
)

var searchIndices = map[string]string{
	"data_view":     "af_data_view_idx",
	"interface_svc": "af_interface_svc_idx",
	"indicator":     "af_indicator_idx",
}

const (
	rfc3339ms = "2006-01-02T15:04:05.999Z07:00"
)

type search struct {
	esClient *opensearch.SearchClient
}

func NewSearch(esClient *opensearch.SearchClient) all.EsAll {
	return &search{esClient: esClient}
}

func (s *search) Search(ctx context.Context, param *all.SearchParam) (res *all.SearchResult, err error) {

	var searchIndexName []string

	if len(param.Type) > 0 {
		for _, v := range param.Type {
			if v != "" {
				if strings.ToLower(v) != all.DataView && strings.ToLower(v) != all.InterfaceSVC && strings.ToLower(v) != all.Indicator {
					continue
				} else {
					searchIndexName = append(searchIndexName, searchIndices[strings.ToLower(v)])
				}
			}
		}
	}

	if len(searchIndexName) == 0 {
		searchIndexName = lo.MapToSlice(searchIndices, func(_, v string) string {
			return v
		})
	}
	searchSource := elastic.NewSearchSource()
	// size
	searchSource.Size(param.Size)
	// query
	s.addQuery(searchSource, param)

	// highlight
	isHighlight := len(param.Keyword) > 0
	if isHighlight {
		highlight := elastic.NewHighlight().NumOfFragments(0).Order("score").
			Fields(

				elastic.NewHighlighterField(all.Name),
				elastic.NewHighlighterField(all.NameGraph),
				elastic.NewHighlighterField(all.NameNgram),
				elastic.NewHighlighterField(all.Code),
				elastic.NewHighlighterField(all.Description),
				elastic.NewHighlighterField(all.DescriptionGraph),
				elastic.NewHighlighterField(all.DescriptionNgram),
				elastic.NewHighlighterField(all.Fields+"."+all.FieldNameZH),
				elastic.NewHighlighterField(all.Fields+"."+all.FieldNameEN),
				elastic.NewHighlighterField(all.Fields+"."+all.FieldNameZHNgram),
				elastic.NewHighlighterField(all.Fields+"."+all.FieldNameZHGraph),
				elastic.NewHighlighterField(all.Fields+"."+all.FieldNameENNgram),
				elastic.NewHighlighterField(all.Fields+"."+all.FieldNameENGraph),
			)

		if len(settings.GetConfig().OpenSearchConf.Highlight.PreTag) > 0 {
			highlight.PreTags(settings.GetConfig().OpenSearchConf.Highlight.PreTag)
		}
		if len(settings.GetConfig().OpenSearchConf.Highlight.PostTag) > 0 {
			highlight.PostTags(settings.GetConfig().OpenSearchConf.Highlight.PostTag)
		}
		searchSource.Highlight(highlight)
	}

	// orderDiff 代表 （期望 sort 数量） - （输入 sort 数量），为了在
	// addSearchAfter 中验证期望的排序条件数量与 nextFlags 数量满足下列场景
	//
	//  | 是否存在关键字 | 输入的排序条件  | nextFlags 对应的排序条件 | orderDiff |
	//  | :------------- | :-------------- | :----------------------- | :-------- |
	//  | False          | a, b            | a, b, online_at, id      | 2         |
	//  | False          | a, b, online_at | a, b, online_at, id      | 1         |
	//  | True           | a, b            | a, b, id                 | 1         |
	//  | True           | a, b, online_at | a, b, online_at, id      | 1         |

	// sort
	var preDirection string
	diff := false
	orderParams := param.Orders

	for _, order := range orderParams {

		ascending := order.Direction == "asc"
		sort := elastic.NewFieldSort(order.Sort).Order(ascending)
		if order.Sort != all.Score {
			sort = sort.Missing(lo.If(ascending, "_first").Else("_last"))
		}
		searchSource.SortBy(sort)

		if preDirection == "" {
			preDirection = order.Direction
		} else if !diff && preDirection != order.Direction {
			diff = true
		}
	}
	idAscending := lo.If(len(orderParams) < 2, preDirection == "asc").Else(!diff)

	searchSource.SortBy(elastic.NewFieldSort(all.ID).Order(idAscending).Missing(lo.If(idAscending, "_first").Else("_last")))

	if err = s.addSearchAfter(searchSource, param.NextFlag, orderParams); err != nil {
		return nil, err
	}

	// total_count
	s.addCountAggs(searchSource)

	log.Infof("search all param json: %s", lo.T2(searchSource.MarshalJSON()).A)
	result, err := s.esClient.ReadClient.Search(searchIndexName...).SearchSource(searchSource).Do(ctx)
	if err != nil {
		log.Errorf("failed to search all from es, err info: %v", err)
		return nil, errorcode.Detail(errorcode.PublicESError, err)
	}
	log.Infof("data_resources search all result: %s", lo.T2(json.Marshal(result.Hits)).A)

	// total count
	totalCount, _ := result.Aggregations.ValueCount("total_count")

	res = &all.SearchResult{}
	if result.Hits != nil {
		res.TotalCount = int64(*totalCount.Value)
		res.Items, res.NextFlag = searchResultEach(result)
	}
	return res, nil
}

func (s *search) addQuery(searchSource *elastic.SearchSource, param *all.SearchParam) {
	var filterQs []elastic.Query

	// 根据 keyword 构造 elastic.Query
	var shouldQs = queriesForKeywordAndFields(param.Keyword, param.Fields)

	// 当不关注数据资源是已经被发布，或要求数据资源已发布时才根据发布时间过滤搜索结果
	var wantPublished bool = param.IsPublish == nil || *param.IsPublish
	if wantPublished && param.PublishedAt != nil && (param.PublishedAt.StartTime != nil || param.PublishedAt.EndTime != nil) {
		rangeQ1 := elastic.NewRangeQuery(all.PublishedAt)
		boolFilter := elastic.NewBoolQuery().Should(rangeQ1)
		if param.PublishedAt.StartTime != nil {
			rangeQ1.Gte(param.PublishedAt.StartTime.Format(rfc3339ms))
		}
		if param.PublishedAt.EndTime != nil {
			rangeQ1.Lte(param.PublishedAt.EndTime.Format(rfc3339ms))
		}
		filterQs = append(filterQs, boolFilter)
	}

	var wantOnline bool = param.IsOnline == nil || *param.IsOnline
	if wantOnline && param.OnlineAt != nil && (param.OnlineAt.StartTime != nil || param.OnlineAt.EndTime != nil) {
		rangeQ1 := elastic.NewRangeQuery(all.OnlineAt)
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
			filterQs = append(filterQs, elastic.NewTermsQuery(all.Doc_ID, id...))
		}
	}

	if param.DataOwnerID != "" {
		filterQs = append(filterQs, elastic.NewTermQuery(all.DataOwnerID, param.DataOwnerID))
	}

	if param.IsPublish != nil {
		filterQs = append(filterQs, elastic.NewTermQuery(all.IsPublish, *param.IsPublish))
	}

	if param.IsOnline != nil {
		filterQs = append(filterQs, elastic.NewTermQuery(all.IsOnline, *param.IsOnline))
	}

	if param.PublishedStatus != nil {

		var pv []interface{}
		for _, v := range param.PublishedStatus {
			pv = append(pv, v)
		}
		filterQs = append(filterQs, elastic.NewTermsQuery(all.PubishedStatus, pv...))
	}

	if param.APIType != "" {
		filterQs = append(filterQs, elastic.NewTermQuery(all.APIType, param.APIType))
	}

	// 逻辑：cateID是需要指定的
	//1、如果NodeIDS 都是具体的值
	//对应的值之间是或的关系
	//2、如果NodeIDS 是未分类的
	//则把对应的cateID 剔除
	//3、如果NodeIDS 是具体的值和未分类的
	//既包括了具体值，或排除这个CateID的
	if param.CateInfoR != nil {

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
					query = elastic.NewBoolQuery().MustNot(elastic.NewNestedQuery(all.CateInfo, query))

				} else if !nodeIsUnCate && len(nodeIds) > 0 {
					queryStr := elastic.NewBoolQuery().Must(cateQ...)
					query = elastic.NewNestedQuery(all.CateInfo, queryStr)

				} else if nodeIsUnCate && len(nodeIds) > 0 {
					// 既关联了类目 也 存在未分类的
					queryStr := elastic.NewBoolQuery().Should(cateQ...).MinimumNumberShouldMatch(1)
					query = elastic.NewNestedQuery(all.CateInfo, queryStr)

				}
				cateFilterQ = append(cateFilterQ, query)
			}
		}

		filterQs = append(filterQs, cateFilterQ...)
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

// orderDiff =（期望 sort 数量） - （输入 sort 数量）
func (s *search) addSearchAfter(searchSource *elastic.SearchSource, nextFlag []string, orders []es_common.Order) error {
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
		case all.PublishedAt:
			v, err := strconv.ParseFloat(old, 64)
			if err != nil {
				log.Errorf("failed to parse next flag to int, flag: %v, err: %v", old, err)
				return errorcode.Detail(errorcode.PublicInvalidParameterValue, err, "next_flag") // TODO 接口层校验
			}
			newFlag = append(newFlag, int64(v))

		case all.OnlineAt:
			v, err := strconv.ParseFloat(old, 64)
			if err != nil {
				log.Errorf("failed to parse next flag to int, flag: %v, err: %v", old, err)
				return errorcode.Detail(errorcode.PublicInvalidParameterValue, err, "next_flag") // TODO 接口层校验
			}

			newFlag = append(newFlag, int64(v))

		case all.Score:
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

func searchResultEach(r *elastic.SearchResult) ([]all.SearchResultItem, []string) {
	if r.Hits == nil || r.Hits.Hits == nil || len(r.Hits.Hits) == 0 {
		return nil, nil
	}

	slice := make([]all.SearchResultItem, 0, len(r.Hits.Hits))
	for _, hit := range r.Hits.Hits {

		var v all.SearchResultItem
		if hit.Source == nil {
			slice = append(slice, v)
			continue
		}

		switch hit.Index {
		case es_data_view.IndicesName:
			var dataViewDoc es_data_view2.BaseObj
			if err := json.Unmarshal(hit.Source, &dataViewDoc); err != nil {
				log.Errorf("failed to json.Unmarshal json, err info: %v", err.Error())
				continue
			}
			v = all.SearchResultItem{
				BaseDoc: all.BaseDoc{
					ID:             dataViewDoc.ID,
					Name:           dataViewDoc.Name,
					NameEn:         dataViewDoc.NameEn,
					Code:           dataViewDoc.Code,
					Description:    dataViewDoc.Description,
					OwnerName:      dataViewDoc.DataOwnerName,
					OwnerID:        dataViewDoc.DataOwnerID,
					PublishedAt:    time.UnixMilli(dataViewDoc.PublishedAt),
					IsPublish:      dataViewDoc.IsPublish,
					Fields:         dataViewDoc.Fields,
					CateInfo:       dataViewDoc.CateInfo,
					OnlineAt:       time.UnixMilli(dataViewDoc.OnlineAt),
					IsOnline:       dataViewDoc.IsOnline,
					PubishedStatus: dataViewDoc.PublishedStatus,
				},
			}
			v.DocType = all.DataView

		case es_interface_svc.IndicesName:
			var interfaceSvcDoc es_interface_svc2.BaseObj
			if err := json.Unmarshal(hit.Source, &interfaceSvcDoc); err != nil {
				log.Errorf("failed to json.Unmarshal json, err info: %v", err.Error())
				continue
			}
			v = all.SearchResultItem{
				BaseDoc: all.BaseDoc{
					ID:             interfaceSvcDoc.ID,
					Name:           interfaceSvcDoc.Name,
					Code:           interfaceSvcDoc.Code,
					Description:    interfaceSvcDoc.Description,
					OwnerName:      interfaceSvcDoc.DataOwnerName,
					OwnerID:        interfaceSvcDoc.DataOwnerID,
					PublishedAt:    time.UnixMilli(interfaceSvcDoc.OnlineAt),
					IsPublish:      interfaceSvcDoc.IsPublish,
					Fields:         interfaceSvcDoc.Fields,
					IsOnline:       interfaceSvcDoc.IsOnline,
					OnlineAt:       time.UnixMilli(interfaceSvcDoc.OnlineAt),
					CateInfo:       interfaceSvcDoc.CateInfo,
					PubishedStatus: interfaceSvcDoc.PublishedStatus,
					APIType:        interfaceSvcDoc.APIType,
				},
				DocType: all.InterfaceSVC,
			}

		case es_indicator.IndicesName:
			var indicatorDoc es_indicator2.BaseObj
			if err := json.Unmarshal(hit.Source, &indicatorDoc); err != nil {
				log.Errorf("failed to json.Unmarshal json, err info: %v", err.Error())
				continue
			}
			v = all.SearchResultItem{
				BaseDoc: all.BaseDoc{
					ID:             indicatorDoc.ID,
					Name:           indicatorDoc.Name,
					Code:           indicatorDoc.Code,
					Description:    indicatorDoc.Description,
					OwnerName:      indicatorDoc.DataOwnerName,
					OwnerID:        indicatorDoc.DataOwnerID,
					PublishedAt:    time.UnixMilli(indicatorDoc.PublishedAt),
					IsPublish:      indicatorDoc.IsPublish,
					Fields:         indicatorDoc.Fields,
					IsOnline:       indicatorDoc.IsOnline,
					OnlineAt:       time.UnixMilli(indicatorDoc.OnlineAt),
					CateInfo:       indicatorDoc.CateInfo,
					PubishedStatus: indicatorDoc.PublishedStatus,
					IndicatorType:  indicatorDoc.IndicatorType,
				},
			}
			v.DocType = all.Indicator

		}

		v.RawCode = v.Code
		v.RawName = v.Name
		v.RawDescription = v.Description

		if len(v.Fields) > 0 {
			for _, field := range v.Fields {
				field.RawFieldNameZH = field.FieldNameZH
				field.RawFieldNameEN = field.FieldNameEN
			}
		}

		var (
			existCode        bool
			existTitle       bool
			existDesc        bool
			existOwnerName   bool
			existFieldNameZH bool
			existFieldNameEN bool
		)

		fieldsMapZH := make(map[string]string)
		fieldsMapEN := make(map[string]string)

		for field, highlightV := range hit.Highlight {
			if existTitle && existCode && existDesc &&
				existOwnerName && existFieldNameZH && existFieldNameEN {
				break
			}
			if !existCode && strings.HasPrefix(field, all.Code) {
				v.Code = highlightV[0]
				existCode = true
			}

			if !existTitle && strings.HasPrefix(field, all.Name) {
				v.Name = highlightV[0]
				existTitle = true
			}

			if !existDesc && strings.HasPrefix(field, all.Description) {
				v.Description = highlightV[0]
				existDesc = true
			}

			switch field {
			case all.Fields + "." + all.FieldNameZH,
				all.Fields + "." + all.FieldNameZHNgram,
				all.Fields + "." + all.FieldNameZHGraph:
				for _, s := range highlightV {
					str1 := strings.ReplaceAll(s, settings.GetConfig().OpenSearchConf.Highlight.PreTag, "")
					str1 = strings.ReplaceAll(str1, settings.GetConfig().OpenSearchConf.Highlight.PostTag, "")
					fieldsMapZH[str1] = s
				}
				existFieldNameZH = true
			case all.Fields + "." + all.FieldNameEN,
				all.Fields + "." + all.FieldNameENNgram,
				all.Fields + "." + all.FieldNameENGraph:
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

func (s *search) addCountAggs(source *elastic.SearchSource) {
	source.Aggregation("total_count", elastic.NewValueCountAggregation().Field(all.ID))
}

var allFields = []string{
	all.Name,
	all.Code,
	all.Description,
	all.Fields,
}

// "name" 对应的字段
var fieldsForName = []string{
	all.Name,
	all.NameGraph,
	all.NameNgram,
}

// "code" 对应的字段
var fieldsForCode = []string{
	all.Code,
}

// "description" 对应的字段
var fieldsForDescription = []string{
	all.Description,
	all.DescriptionGraph,
	all.DescriptionNgram,
}

// "fields" 对应的字段
var (
	fieldsForFields = []string{
		all.FieldNameEN,
		all.FieldNameENNgram,
		all.FieldNameENNgram,
		all.FieldNameZH,
	}
	nestedFieldsForFields = []string{
		all.Fields + "." + all.FieldNameEN,
		all.Fields + "." + all.FieldNameENGraph,
		all.Fields + "." + all.FieldNameENNgram,
		all.Fields + "." + all.FieldNameZH,
		all.Fields + "." + all.FieldNameZHGraph,
		all.Fields + "." + all.FieldNameZHNgram,
	}
)

// queriesForKeywordAndFields 根据 keyword 构造 elastic.Query
func queriesForKeywordAndFields(keyword string, fields []string) (queries []elastic.Query) {
	if keyword == "" {
		return
	}

	// 如果未指定，匹配所有字段
	if fields == nil {
		fields = allFields
	}

	var matchFields []string
	for _, f := range fields {
		switch f {
		case all.Name:
			matchFields = append(matchFields, fieldsForName...)
		case all.Code:
			matchFields = append(matchFields, fieldsForCode...)
		case all.Description:
			matchFields = append(matchFields, fieldsForDescription...)
		case all.Fields:
			matchFields = append(matchFields, fieldsForFields...)
			// nested 匿名结构体嵌套查询
			queries = append(queries, elastic.NewNestedQuery(all.Fields, elastic.NewMultiMatchQuery(keyword, nestedFieldsForFields...)))
		default:
			log.Warn("unsupported field", zap.String("field", f))
		}
	}

	if matchFields != nil {
		queries = append(queries, elastic.NewMultiMatchQuery(keyword, matchFields...).FieldWithBoost(all.Name, 10.0).FieldWithBoost(all.Description, 5.0))
	}

	return
}
