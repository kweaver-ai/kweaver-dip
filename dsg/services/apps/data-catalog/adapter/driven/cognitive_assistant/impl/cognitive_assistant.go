package impl

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/driven/cognitive_assistant"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/settings"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/kweaver-ai/idrm-go-frame/core/utils/httpclient"
	"github.com/samber/lo"
)

type CogAssistant struct {
	client httpclient.HTTPClient
}

func NewCogAssistant(client httpclient.HTTPClient) cognitive_assistant.CogAssistant {
	return &CogAssistant{client: client}
}

func (c *CogAssistant) SubGraph(ctx context.Context, req *cognitive_assistant.SubGraphReq) (*cognitive_assistant.SubGraphResp, error) {
	resp := &cognitive_assistant.SubGraphResp{}

	cogAddr := settings.GetConfig().AfSailorServiceHost
	url := fmt.Sprintf("%s/api/af-sailor-service/v1/tools/knowledge-network/graph/analysis", cogAddr)
	headers := map[string]string{
		"Content-Time": "application/json",
	}
	_, response, err := c.client.Post(ctx, url, headers, req)
	log.WithContext(ctx).Infof("req af-sailor-service asset-search, url: %s, request: %s", url, lo.T2(json.Marshal(req)).A)
	if err != nil {
		log.WithContext(ctx).Errorf("failed to req af-sailor-service subgraph, err info: %v", err.Error())
		return resp, nil
	}

	bytes, _ := json.Marshal(response)
	//log.WithContext(ctx).Infof("req af-sailor-service subgraph succeed, response: %s", bytes)
	json.Unmarshal(bytes, resp)
	return resp, nil
}

/*
	func (c *CogAssistant) CogSearch(ctx context.Context, req *cognitive_assistant.CogSearchReq) (*cognitive_assistant.CogSearchResp, error) {
		resp := &cognitive_assistant.CogSearchResp{}

		cogAddr := settings.GetConfig().AfSailorServiceHost
		url := fmt.Sprintf("%s/api/internal/af-sailor-service/v1/recommend/asset/search", cogAddr)
		headers := map[string]string{
			"Content-Time":  "application/json",
			"Authorization": fmt.Sprintf("%v", ctx.Value("Authorization")),
		}
		_, response, err := c.client.Post(ctx, url, headers, req)
		log.WithContext(ctx).Infof("req af-sailor-service asset-search, url: %s, req: %s", url, lo.T2(json.Marshal(req)).A)
		if err != nil {
			log.WithContext(ctx).Errorf("failed to req af-sailor-service asset-search, err info: %v", err.Error())
			return resp, nil
		}

		bytes, _ := json.Marshal(response)
		log.WithContext(ctx).Infof("req af-sailor-service asset-search succeed, response: %s", bytes)
		json.Unmarshal(bytes, resp)
		return resp, nil
	}
*/
func (c *CogAssistant) CogSearchBak(ctx context.Context, keyword string, size int) (*cognitive_assistant.CogSearchBakResp, error) {
	resp := &cognitive_assistant.CogSearchBakResp{}

	cogAddr := settings.GetConfig().AfSailorServiceHost
	url := fmt.Sprintf("%s/api/internal/af-sailor-service/v1/recommend/asset/search?query=%s&limit=%v", cogAddr, keyword, size)
	headers := map[string]string{
		"Content-Time": "application/json",
	}
	response, err := c.client.Get(ctx, url, headers)
	log.WithContext(ctx).Infof("req af-sailor-service asset-search, url: %s", url)
	if err != nil {
		log.WithContext(ctx).Errorf("failed to req af-sailor-service asset-search, err info: %v", err.Error())
		return resp, nil
	}

	bytes, _ := json.Marshal(response)
	log.WithContext(ctx).Infof("req af-sailor-service asset-search succeed, response: %s", bytes)
	json.Unmarshal(bytes, resp)
	return resp, nil
}
