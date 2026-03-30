package virtualization_engine

import (
	"context"
	"encoding/json"
	"io/ioutil"
	"net/http"
	"strings"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/settings"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
)

type VirtualizationEngine interface {
	Raw(ctx context.Context, selectSQL string) (*RawResult, error)
}

type virtualizationEngine struct {
	url        string
	httpClient *http.Client
}

func NewVirtualizationEngine(httpClient *http.Client) VirtualizationEngine {
	return &virtualizationEngine{url: settings.GetConfig().DepServicesConf.VirtualizationEngineUrl, httpClient: httpClient}
}

type RawResult struct {
	Columns []struct {
		Name string `json:"name"`
		Type string `json:"type"`
	} `json:"columns"`
	Data [][]any `json:"data"`
}

func (v *virtualizationEngine) Raw(ctx context.Context, selectSQL string) (*RawResult, error) {
	url := v.url + "/api/virtual_engine_service/v1/fetch"
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, strings.NewReader(selectSQL))
	if err != nil {
		log.WithContext(ctx).Errorf("failed to create req in post vir engine, sql: %v, err: %v", selectSQL, err)
		return nil, errorcode.Detail(errorcode.PublicInternalError, err)
	}

	req.Header.Add("Content-Type", "text/plain")
	req.Header.Add("X-Presto-User", "admin")
	resp, err := v.httpClient.Do(req)
	if err != nil {
		log.WithContext(ctx).Errorf("failed to send req in post vir engine, sql: %v, url: %s, err: %v", selectSQL, req.URL.String(), err)
		return nil, errorcode.Detail(errorcode.PublicInternalError, err)
	}
	defer func() {
		_ = resp.Body.Close()
	}()

	b, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		log.WithContext(ctx).Errorf("failed to read resp data in post vir engine, sql: %v, url: %s, err: %v", selectSQL, req.URL.String(), err)
		return nil, errorcode.Detail(errorcode.PublicInternalError, err)
	}
	if resp.StatusCode >= http.StatusInternalServerError {
		log.WithContext(ctx).Errorf("failed to send req in post vir engine, sql: %v, url: %s, resp: %s", selectSQL, req.URL.String(), b)
		return nil, errorcode.Detail(errorcode.PublicInternalError, string(b))
	}

	if resp.StatusCode >= http.StatusBadRequest {
		log.WithContext(ctx).Errorf("failed to send req in post vir engine, sql: %v, url: %s, resp: %s", selectSQL, req.URL.String(), b)
		return nil, errorcode.Detail(errorcode.PublicInternalError, string(b))
	}

	var ret RawResult
	if err = json.Unmarshal(b, &ret); err != nil {
		log.WithContext(ctx).Errorf("failed to send req in post vir engine, sql: %v, utl: %s, resp: %s, json.Unmarshal err: %v", selectSQL, req.URL.String(), b, err)
		return nil, errorcode.Detail(errorcode.PublicInternalError, err)
	}

	return &ret, nil
}
