package es_data_datalog

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
	"github.com/kweaver-ai/dsg/services/apps/basic-search/adapter/driven/opensearch"
	"github.com/kweaver-ai/dsg/services/apps/basic-search/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/basic-search/common/settings"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/trace"
)

const (
	indicesAlias = "af_data_catalog_idx"
	IndicesName  = mappingVersionV12
)

const (
	mappingVersionV1  = "af_data_catalog_idx_v1"
	mappingVersionV2  = "af_data_catalog_idx_v2"
	mappingVersionV3  = "af_data_catalog_idx_v3"
	mappingVersionV4  = "af_data_catalog_idx_v4"
	mappingVersionV5  = "af_data_catalog_idx_v5"
	mappingVersionV6  = "af_data_catalog_idx_v6"
	mappingVersionV7  = "af_data_catalog_idx_v7"
	mappingVersionV8  = "af_data_catalog_idx_v8"
	mappingVersionV9  = "af_data_catalog_idx_v9"
	mappingVersionV10 = "af_data_catalog_idx_v10"
	mappingVersionV11 = "af_data_catalog_idx_v11"
	mappingVersionV12 = "af_data_catalog_idx_v12"
)

var (
	//go:embed mapping_v11.json
	mappingV11 string
	//go:embed mapping_v12.json
	mappingV12 string
)

var (
	mappingVersionMap = map[string]string{
		mappingVersionV1:  mappingV1,
		mappingVersionV2:  mappingV2,
		mappingVersionV3:  mappingV3,
		mappingVersionV4:  mappingV4,
		mappingVersionV5:  mappingV5,
		mappingVersionV6:  mappingV6,
		mappingVersionV7:  mappingV7,
		mappingVersionV8:  mappingV8,
		mappingVersionV9:  mappingV9,
		mappingVersionV10: mappingV10,
		mappingVersionV11: mappingV11,
		mappingVersionV12: mappingV12,
	}

	mapping = mappingVersionMap[IndicesName]
)

const (
	indicesAlreadyExistsErrType = "resource_already_exists_exception"
)

type search struct {
	searchCli *opensearch.SearchClient
}

func NewSearch(ctx context.Context, searchCli *opensearch.SearchClient) (Search, error) {
	if err := initIndices(ctx, searchCli); err != nil {
		return nil, err
	}

	return &search{searchCli: searchCli}, nil
}

func initIndices(ctx context.Context, searchCli *opensearch.SearchClient) error {
	// 检测alias是否存在
	notFound := false
	result, err := searchCli.WriteClient.Aliases().Alias(indicesAlias).Do(ctx)
	if err != nil {
		if esErr, ok := err.(*elastic.Error); ok && esErr.Status == http.StatusNotFound {
			notFound = true
		} else {
			return err
		}
	}

	if notFound {
		return createIndicesIfNotExists(ctx, searchCli)
	}

	idxs := result.IndicesByAlias(indicesAlias)
	if len(idxs) > 1 {
		err := fmt.Errorf("internal error, es idx alias exists multi idx, alias: %v, idxs: %v", indicesAlias, idxs)
		log.WithContext(ctx).Error(err.Error())
		return err
	}

	sourceIdx := idxs[0]
	if sourceIdx == IndicesName {
		return nil
	}
	if err = compareIdxVersion(sourceIdx, IndicesName); err != nil {
		return err
	}

	// 根据配置动态调整映射配置
	adjustedMapping := adjustMappingString(mapping)

	// create new idx
	createIdxResp, err := searchCli.WriteClient.CreateIndex(IndicesName).BodyString(adjustedMapping).Do(ctx)
	if err != nil {
		if esErr, ok := err.(*elastic.Error); ok && esErr.Details.Type == indicesAlreadyExistsErrType {
			// indices已经存在，返回错误，重新走流程
			err = fmt.Errorf("index already exists, index: %v", IndicesName)
			return err
		}
	}
	log.WithContext(ctx).Infof("create indices from es, ack: %v, shards_ack: %v, index: %v", createIdxResp.Acknowledged, createIdxResp.ShardsAcknowledged, createIdxResp.Index)

	// reindex
	_, err = searchCli.WriteClient.Reindex().SourceIndex(sourceIdx).DestinationIndex(IndicesName).Do(ctx)
	if err != nil {
		log.WithContext(ctx).Errorf("failed to reindex in es, err: %v", err)
		return err
	}

	// alias转移
	_, err = searchCli.WriteClient.Alias().
		Action(
			elastic.NewAliasRemoveAction(indicesAlias).Index(sourceIdx),
			elastic.NewAliasAddAction(indicesAlias).Index(IndicesName),
		).Do(ctx)
	if err != nil {
		log.WithContext(ctx).Errorf("failed to alias action batch opera, err: %v", err)
		return err
	}

	// 删除老idx
	//if _, err = searchCli.WriteClient.DeleteIndex(sourceIdx).Do(ctx); err != nil {
	//	log.Errorf("failed to delete old indices, old indices: %v", sourceIdx)
	//	return err
	//}

	return nil
}

func createIndicesIfNotExists(ctx context.Context, searchCli *opensearch.SearchClient) error {
	// 查看索引是否存在
	exist, err := searchCli.WriteClient.
		IndexExists(IndicesName).
		Do(ctx)
	if err != nil {
		log.WithContext(ctx).Errorf("failed to access es, err: %v", err)
		return err
	}

	// 存在，直接返回
	if exist {
		return nil
	}

	// 不存在，去创建
	curMapping, err := addAlias(mapping, indicesAlias)
	if err != nil {
		return err
	}
	result, err := searchCli.WriteClient.
		CreateIndex(IndicesName).
		BodyJson(curMapping).
		Do(ctx)
	if err == nil {
		log.WithContext(ctx).Infof("create indices from es, ack: %v, shards_ack: %v, index: %v", result.Acknowledged, result.ShardsAcknowledged, result.Index)
		return nil
	}

	if esErr, ok := err.(*elastic.Error); ok && esErr.Details.Type == indicesAlreadyExistsErrType {
		// indices已经存在
		log.WithContext(ctx).Infof("index already exists, index: %v", IndicesName)
		return nil
	}

	log.WithContext(ctx).Errorf("failed to create indices, err: %v", err)
	return err
}

func addAlias(mapping, alias string) (map[string]any, error) {
	m := make(map[string]any)
	if err := json.Unmarshal([]byte(mapping), &m); err != nil {
		return nil, fmt.Errorf("invalid es mapping format, err: %w", err)
	}

	// 根据配置动态修改 tokenizer（如果不使用 HanLP，替换为标准 tokenizer）
	config := settings.GetConfig()
	if !config.OpenSearchConf.UseHanLP {
		adjustMappingForStandardTokenizer(m)
	}

	m["aliases"] = map[string]any{
		alias: map[string]any{},
	}

	return m, nil
}

// adjustMappingForStandardTokenizer 将映射配置中的 hanlp_index tokenizer 替换为标准 tokenizer
func adjustMappingForStandardTokenizer(m map[string]any) {
	settings, ok := m["settings"].(map[string]any)
	if !ok {
		return
	}

	analysis, ok := settings["analysis"].(map[string]any)
	if !ok {
		return
	}

	tokenizers, ok := analysis["tokenizer"].(map[string]any)
	if !ok {
		return
	}

	// 查找 as_hanlp tokenizer 并替换
	if asHanlp, exists := tokenizers["as_hanlp"].(map[string]any); exists {
		// 将 hanlp_index 替换为 standard tokenizer
		asHanlp["type"] = "standard"
		asHanlp["max_token_length"] = 255
		// 移除 HanLP 特有的配置项
		delete(asHanlp, "enable_stop_dictionary")
		delete(asHanlp, "enable_custom_config")
	}
}

// adjustMappingString 根据配置调整映射字符串（用于 BodyString 调用）
func adjustMappingString(mapping string) string {
	config := settings.GetConfig()
	if config.OpenSearchConf.UseHanLP {
		// 使用 HanLP，直接返回原始映射
		return mapping
	}

	// 不使用 HanLP，需要替换 tokenizer
	m := make(map[string]any)
	if err := json.Unmarshal([]byte(mapping), &m); err != nil {
		// 如果解析失败，返回原始映射
		return mapping
	}

	adjustMappingForStandardTokenizer(m)

	// 重新序列化为 JSON
	adjustedBytes, err := json.Marshal(m)
	if err != nil {
		// 如果序列化失败，返回原始映射
		return mapping
	}

	return string(adjustedBytes)
}

func compareIdxVersion(srcV, destV string) error {
	sourceVNum, err := getIdxVersionNum(srcV)
	if err != nil {
		return err
	}

	destVNum, err := getIdxVersionNum(destV)
	if err != nil {
		return err
	}

	if sourceVNum > destVNum {
		err = fmt.Errorf("es idx mapping unsupported downgrade, cur version: %v, dest version: %v", srcV, destV)
		log.Error(err.Error())
		return err
	}

	return nil
}

func getIdxVersionNum(idxName string) (int, error) {
	idx := strings.LastIndex(idxName, "_")
	if idx < 0 || idx > len(idxName)-3 {
		return 0, fmt.Errorf("invalid es index name: %v", idxName)
	}

	vNum, err := strconv.ParseInt(idxName[idx+2:], 10, 0)
	if err != nil {
		return 0, fmt.Errorf("invalid es index name, err: %w: %v", idxName, err)
	}

	return int(vNum), nil
}

func (s search) Search(ctx context.Context, param *SearchParam) (res *SearchResult, err error) {
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
				elastic.NewHighlighterField(Name),
				elastic.NewHighlighterField(NameNgram),
				elastic.NewHighlighterField(NameGraph),
				elastic.NewHighlighterField(Code),
				elastic.NewHighlighterField(Description),
				elastic.NewHighlighterField(DescriptionGraph),
				elastic.NewHighlighterField(DescriptionNgram),
				elastic.NewHighlighterField(Fields+"."+FieldNameZH),
				elastic.NewHighlighterField(Fields+"."+FieldNameEN),
				elastic.NewHighlighterField(Fields+"."+FieldNameZHNgram),
				elastic.NewHighlighterField(Fields+"."+FieldNameZHGraph),
				elastic.NewHighlighterField(Fields+"."+FieldNameENNgram),
				elastic.NewHighlighterField(Fields+"."+FieldNameENGraph),
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
		if order.Sort == OnlineAt {
			continue
		}
		ascending := order.Direction == "asc"
		sort := elastic.NewFieldSort(order.Sort).Order(ascending)
		if order.Sort != Score {
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
	searchSource.SortBy(elastic.NewFieldSort(ID).Order(idAscending).Missing(lo.If(idAscending, "_first").Else("_last")))

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

	ret := &SearchResult{}
	//if hasAggs {
	//	aggsRes := &AggsResult{}
	//	aggsRes.DataKindCount = getDocCount(result.Aggregations, dataKindCount)
	//	aggsRes.DataRangeCount = getDocCount(result.Aggregations, dataRangeCount)
	//	aggsRes.UpdateCycleCount = getDocCount(result.Aggregations, updateCycleCount)
	//	aggsRes.SharedTypeCount = getDocCount(result.Aggregations, SharedTypeCount)
	//
	//	ret.AggsResult = aggsRes
	//}

	if result.Hits == nil {
		return ret, nil
	}

	totalCount, _ := result.Aggregations.ValueCount("total_count")
	ret.Total = int64(*totalCount.Value)
	ret.Items, ret.NextFlag = searchResultEach(result)

	return ret, nil
}

func searchResultEach(r *elastic.SearchResult) ([]SearchResultItem, []string) {
	if r.Hits == nil || r.Hits.Hits == nil || len(r.Hits.Hits) == 0 {
		return nil, nil
	}

	slice := make([]SearchResultItem, 0, len(r.Hits.Hits))
	for _, hit := range r.Hits.Hits {
		var v SearchResultItem
		if hit.Source == nil {
			slice = append(slice, v)
			continue
		}

		if err := json.Unmarshal(hit.Source, &v); err != nil {
			continue
		}

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
			if !existCode && strings.HasPrefix(field, Code) {
				v.Code = highlightV[0]
				existCode = true
			}

			if !existName && strings.HasPrefix(field, Name) {
				v.Name = highlightV[0]
				existName = true
			}

			if !existDesc && strings.HasPrefix(field, Description) {
				v.Description = highlightV[0]
				existDesc = true
			}

			switch field {
			case Fields + "." + FieldNameZH,
				Fields + "." + FieldNameZHNgram,
				Fields + "." + FieldNameZHGraph:
				for _, s := range highlightV {
					str1 := strings.ReplaceAll(s, settings.GetConfig().OpenSearchConf.Highlight.PreTag, "")
					str1 = strings.ReplaceAll(str1, settings.GetConfig().OpenSearchConf.Highlight.PostTag, "")
					fieldsMapZH[str1] = s
				}
				existFieldNameZH = true
			case Fields + "." + FieldNameEN,
				Fields + "." + FieldNameENNgram,
				Fields + "." + FieldNameENGraph:
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

func (s search) Aggs(ctx context.Context, param *AggsParam) (*AggsResult, error) {
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

	res := &AggsResult{}
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

	searchSource.Aggregation(dataRangeCount, elastic.NewTermsAggregation().Field(DataRange))
	searchSource.Aggregation(updateCycleCount, elastic.NewTermsAggregation().Field(UpdateCycle))
	searchSource.Aggregation(SharedTypeCount, elastic.NewTermsAggregation().Field(SharedType))
}

const (
	rfc3339ms = "2006-01-02T15:04:05.999Z07:00"
)

func (s search) addQuery(searchSource *elastic.SearchSource, param *BaseSearchParam) {
	var filterQs []elastic.Query

	// 根据 keyword 构造 elastic.Query
	var shouldQs = queriesForKeywordAndFields(param.Keyword, param.Fields)

	// 当不关注数据资源目录已发布，或要求数据资源目录已发布时才根据发布时间过滤搜索结果
	var wantPublished bool = param.IsPublish == nil || *param.IsPublish
	if wantPublished && param.PublishedAt != nil && (param.PublishedAt.StartTime != nil || param.PublishedAt.EndTime != nil) {
		rangeQ1 := elastic.NewRangeQuery(PublishedAt)
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
		rangeQ1 := elastic.NewRangeQuery(OnlineAt)
		boolFilter := elastic.NewBoolQuery().Should(rangeQ1)
		if param.OnlineAt.StartTime != nil {
			rangeQ1.Gte(param.OnlineAt.StartTime.Format(rfc3339ms))
		}
		if param.OnlineAt.EndTime != nil {
			rangeQ1.Lte(param.OnlineAt.EndTime.Format(rfc3339ms))
		}
		filterQs = append(filterQs, boolFilter)
	}

	if param.UpdatedAt != nil && (param.UpdatedAt.StartTime != nil || param.UpdatedAt.EndTime != nil) {
		rangeQ1 := elastic.NewRangeQuery(UpdatedAt)
		boolFilter := elastic.NewBoolQuery().Should(rangeQ1)
		if param.UpdatedAt.StartTime != nil {
			rangeQ1.Gte(param.UpdatedAt.StartTime.Format(rfc3339ms))
		}
		if param.UpdatedAt.EndTime != nil {
			rangeQ1.Lte(param.UpdatedAt.EndTime.Format(rfc3339ms))
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
			filterQs = append(filterQs, elastic.NewTermsQuery(Doc_ID, id...))
		}
	}

	//过滤数据资源类型

	if len(param.DataResourceType) > 0 {
		var dt []interface{}
		for _, v := range param.DataResourceType {

			s := strings.ToLower(v)
			if s == DataResourceTypeDataView || s == DataResourceTypeInterface || s == DataResourceTypeFile {
				dt = append(dt, s)
			}
		}

		nestedQs := elastic.NewNestedQuery("mount_data_resources", elastic.NewTermsQuery("mount_data_resources.data_resources_type", dt...))
		filterQs = append(filterQs, nestedQs)
	}

	if param.IsPublish != nil {
		filterQs = append(filterQs, elastic.NewTermQuery(IsPublish, *param.IsPublish))
	}

	if param.IsOnline != nil {
		filterQs = append(filterQs, elastic.NewTermQuery(IsOnline, *param.IsOnline))
	}

	// 根据发布状态筛选
	if param.PublishedStatus != nil {

		var pv []interface{}
		for _, v := range param.PublishedStatus {
			pv = append(pv, v)
		}
		filterQs = append(filterQs, elastic.NewTermsQuery(PubishedStatus, pv...))
	}

	// 根据上线状态筛选
	if param.OnlineStatus != nil {

		var pv []interface{}
		for _, v := range param.OnlineStatus {
			pv = append(pv, v)
		}
		filterQs = append(filterQs, elastic.NewTermsQuery(OnlineStatus, pv...))
	}

	if len(param.DataRange) > 0 {
		filterQs = append(filterQs, elastic.NewTermsQuery(DataRange, lo.ToAnySlice(param.DataRange)...))
	}

	if len(param.UpdateCycle) > 0 {
		filterQs = append(filterQs, elastic.NewTermsQuery(UpdateCycle, lo.ToAnySlice(param.UpdateCycle)...))
	}

	if len(param.SharedType) > 0 {
		filterQs = append(filterQs, elastic.NewTermsQuery(SharedType, lo.ToAnySlice(param.SharedType)...))
	}

	if len(param.BusinessObjectID) > 0 {
		nestedQs := elastic.NewNestedQuery(BusinessObjects, elastic.NewTermsQuery(BusinessObjectID, lo.ToAnySlice(param.BusinessObjectID)...))
		filterQs = append(filterQs, nestedQs)
	}

	// 逻辑：cateID是需要指定的
	//1、如果NodeIDS 都是具体的值
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
					query = elastic.NewBoolQuery().MustNot(elastic.NewNestedQuery(CateInfo, query))

				} else if !nodeIsUnCate && len(nodeIds) > 0 {
					queryStr := elastic.NewBoolQuery().Must(cateQ...)
					query = elastic.NewNestedQuery(CateInfo, queryStr)

				} else if nodeIsUnCate && len(nodeIds) > 0 {
					// 既关联了类目 也 存在未分类的
					queryStr := elastic.NewBoolQuery().Should(cateQ...).MinimumNumberShouldMatch(1)
					query = elastic.NewNestedQuery(CateInfo, queryStr)

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

func (s search) Index(ctx context.Context, item *Item) (err error) {
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

	// var buf strings.Builder
	// params := make(map[string]any)

	// log.WithContext(ctx).Infof("update script: %s, params: %v", buf.String(), params)
	// resp, err := s.searchCli.WriteClient.UpdateByQuery(indicesAlias).
	// 	Query(elastic.NewBoolQuery().Must(elastic.NewTermQuery(TableId, tableId))).
	// 	Script(elastic.NewScript(buf.String()).Params(params)).
	// 	Do(ctx)
	// if err != nil {
	// 	log.WithContext(ctx).Errorf("failed to update table rows and data updated time, err: %v", err)
	// 	return err
	// }

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

func (s search) addSearchAfter(searchSource *elastic.SearchSource, nextFlag []string, orders []Order) error {
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
		case UpdatedAt:
			v, err := strconv.ParseFloat(old, 64)
			if err != nil {
				log.Errorf("failed to parse next flag to int, flag: %v, err: %v", old, err)
				return errorcode.Detail(errorcode.PublicInvalidParameterValue, err, "next_flag") // TODO 接口层校验
			}
			newFlag = append(newFlag, int64(v))
		case OnlineAt:
			v, err := strconv.ParseFloat(old, 64)
			if err != nil {
				log.Errorf("failed to parse next flag to int, flag: %v, err: %v", old, err)
				return errorcode.Detail(errorcode.PublicInvalidParameterValue, err, "next_flag") // TODO 接口层校验
			}

			newFlag = append(newFlag, int64(v))
		case Score:
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
	source.Aggregation("total_count", elastic.NewValueCountAggregation().Field(ID))
}

var allFields = []string{
	Name,
	Code,
	Description,
	Fields,
}

// "name" 对应的字段
var fieldsForName = []string{
	Name,
	NameGraph,
	NameNgram,
}

// "code" 对应的字段
var fieldsForCode = []string{
	Code,
}

// "description" 对应的字段
var fieldsForDescription = []string{
	Description,
	DescriptionGraph,
	DescriptionNgram,
}

// "fields" 对应的字段
var (
	fieldsForFields = []string{
		FieldNameEN,
		FieldNameENNgram,
		FieldNameENNgram,
		FieldNameZH,
	}
	nestedFieldsForFields = []string{
		Fields + "." + FieldNameEN,
		Fields + "." + FieldNameENGraph,
		Fields + "." + FieldNameENNgram,
		Fields + "." + FieldNameZH,
		Fields + "." + FieldNameZHGraph,
		Fields + "." + FieldNameZHNgram,
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
		case Name:
			matchFields = append(matchFields, fieldsForName...)
		case Code:
			matchFields = append(matchFields, fieldsForCode...)
		case Description:
			matchFields = append(matchFields, fieldsForDescription...)
		case Fields:
			matchFields = append(matchFields, fieldsForFields...)
			// nested 匿名结构体嵌套查询
			queries = append(queries, elastic.NewNestedQuery(Fields, elastic.NewMultiMatchQuery(keyword, nestedFieldsForFields...)))
		default:
			log.Warn("unsupported field", zap.String("field", f))
		}
	}

	if matchFields != nil {
		queries = append(queries, elastic.NewMultiMatchQuery(keyword, matchFields...))
	}

	return
}
