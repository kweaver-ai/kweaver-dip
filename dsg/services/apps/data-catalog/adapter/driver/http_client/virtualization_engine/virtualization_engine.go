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
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/trace"
)

type VirtualizationEngine interface {
	Raw(ctx context.Context, selectSQL string) (*RawResult, error)
}

type virtualizationEngine struct {
	httpClient *http.Client
}

func NewVirtualizationEngine(httpClient *http.Client) VirtualizationEngine {
	return &virtualizationEngine{httpClient: httpClient}
}

type RawResult struct {
	Columns []struct {
		Name string `json:"name"`
		Type string `json:"type"`
	} `json:"columns"`
	Data [][]any `json:"data"`
}

func (v *virtualizationEngine) Raw(ctx context.Context, selectSQL string) (*RawResult, error) {
	var err error
	ctx, span := trace.StartInternalSpan(ctx)
	defer func() { trace.TelemetrySpanEnd(span, err) }()

	url := settings.GetConfig().DepServicesConf.VirtualizationEngineUrl + "/api/virtual_engine_service/v1/fetch"
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, strings.NewReader(selectSQL))
	if err != nil {
		log.WithContext(ctx).Errorf("failed to create req in post vir engine, sql: %v, err: %v", selectSQL, err)
		return nil, errorcode.Detail(errorcode.VirtualEngineRequestErr, err)
	}

	req.Header.Add("Content-Type", "text/plain")
	req.Header.Add("X-Presto-User", "admin")
	resp, err := v.httpClient.Do(req)
	if err != nil {
		log.WithContext(ctx).Errorf("failed to send req in post vir engine, sql: %v, url: %s, err: %v", selectSQL, req.URL.String(), err)
		return nil, errorcode.Detail(errorcode.VirtualEngineRequestErr, err)
	}
	defer func() {
		_ = resp.Body.Close()
	}()

	b, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		log.WithContext(ctx).Errorf("failed to read resp data in post vir engine, sql: %v, url: %s, err: %v", selectSQL, req.URL.String(), err)
		return nil, errorcode.Detail(errorcode.VirtualEngineRequestErr, err)
	}
	if resp.StatusCode >= http.StatusInternalServerError {
		log.WithContext(ctx).Errorf("failed to send req in post vir engine, sql: %v, url: %s, resp: %s", selectSQL, req.URL.String(), b)
		return nil, errorcode.Detail(errorcode.VirtualEngineRequestErr, string(b))
	}

	if resp.StatusCode >= http.StatusBadRequest {
		log.WithContext(ctx).Errorf("failed to send req in post vir engine, sql: %v, url: %s, resp: %s", selectSQL, req.URL.String(), b)
		return nil, errorcode.Detail(errorcode.VirtualEngineRequestErr, string(b))
	}

	result, err := v.MyUnmarshal(ctx, b, selectSQL, req.URL.String())
	if err != nil {
		return nil, err
	}

	return result, nil
}

func (v *virtualizationEngine) MyUnmarshal(ctx context.Context, data []byte, selectSQL, reqUrlStr string) (*RawResult, error) {
	var ret RawResult
	decoder := json.NewDecoder(strings.NewReader(string(data)))
	decoder.UseNumber()
	err := decoder.Decode(&ret)
	if err != nil {
		log.WithContext(ctx).Errorf("failed to send req in post vir engine, sql: %v, url: %s, resp: %s, json.Unmarshal err: %v", selectSQL, reqUrlStr, string(data), err)
		return nil, errorcode.Detail(errorcode.VirtualEngineRequestErr, err)
	}
	return &ret, nil
}
