package es

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"strings"

	"github.com/kweaver-ai/dsg/services/apps/basic-search/adapter/driven/opensearch"
	"github.com/kweaver-ai/dsg/services/apps/basic-search/common/settings"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/olivere/elastic/v7"
)

const (
	indicesAlreadyExistsErrType = "resource_already_exists_exception"
)

func InitIndices(ctx context.Context, indicesAlias, indicesName, mapping string, searchCli *opensearch.SearchClient) error {
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
		return createIndicesIfNotExists(ctx, indicesAlias, indicesName, mapping, searchCli)
	}

	idxs := result.IndicesByAlias(indicesAlias)
	if len(idxs) > 1 {
		err := fmt.Errorf("internal error, es idx alias exists multi idx, alias: %v, idxs: %v", indicesAlias, idxs)
		log.WithContext(ctx).Error(err.Error())
		return err
	}
	sourceIdx := idxs[0]
	if sourceIdx == indicesName {
		return nil
	}
	if err = compareIdxVersion(sourceIdx, indicesName); err != nil {
		return err
	}

	// 根据配置动态调整映射配置
	adjustedMapping := adjustMappingString(mapping)

	// create new idx
	createIdxResp, err := searchCli.WriteClient.CreateIndex(indicesName).BodyString(adjustedMapping).Do(ctx)
	if err != nil {
		if esErr, ok := err.(*elastic.Error); ok && esErr.Details.Type == indicesAlreadyExistsErrType {
			// indices已经存在，返回错误，重新走流程
			err = fmt.Errorf("index already exists, index: %v", indicesName)
			return err
		}
	}
	log.WithContext(ctx).Infof("create indices from es, ack: %v, shards_ack: %v, index: %v", createIdxResp.Acknowledged, createIdxResp.ShardsAcknowledged, createIdxResp.Index)

	// reindex
	_, err = searchCli.WriteClient.Reindex().SourceIndex(sourceIdx).DestinationIndex(indicesName).Do(ctx)
	if err != nil {
		log.WithContext(ctx).Errorf("failed to reindex in es, err: %v", err)
		return err
	}

	// alias转移
	_, err = searchCli.WriteClient.Alias().
		Action(
			elastic.NewAliasRemoveAction(indicesAlias).Index(sourceIdx),
			elastic.NewAliasAddAction(indicesAlias).Index(indicesName),
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

func createIndicesIfNotExists(ctx context.Context, indicesAlias, indicesName, mapping string, searchCli *opensearch.SearchClient) error {
	// 查看索引是否存在
	exist, err := searchCli.WriteClient.
		IndexExists(indicesName).
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
		CreateIndex(indicesName).
		BodyJson(curMapping).
		Do(ctx)
	if err == nil {
		log.WithContext(ctx).Infof("create indices from es, ack: %v, shards_ack: %v, index: %v", result.Acknowledged, result.ShardsAcknowledged, result.Index)
		return nil
	}

	if esErr, ok := err.(*elastic.Error); ok && esErr.Details.Type == indicesAlreadyExistsErrType {
		// indices已经存在
		log.WithContext(ctx).Infof("index already exists, index: %v", indicesName)
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
		AdjustMappingForStandardTokenizer(m)
	}

	m["aliases"] = map[string]any{
		alias: map[string]any{},
	}

	return m, nil
}

// AdjustMappingForStandardTokenizer 将映射配置中的 hanlp_index tokenizer 替换为标准 tokenizer
func AdjustMappingForStandardTokenizer(m map[string]any) {
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

	AdjustMappingForStandardTokenizer(m)

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
