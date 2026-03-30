package virtualization_engine

import (
	"context"
	"crypto/tls"
	"encoding/json"
	"fmt"
	"io"
	"io/ioutil"
	"net/http"
	"strconv"
	"time"

	jsoniter "github.com/json-iterator/go"
	"go.opentelemetry.io/contrib/instrumentation/net/http/otelhttp"
	"go.uber.org/zap"

	"github.com/kweaver-ai/dsg/services/apps/data-exploration-service/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-exploration-service/common/settings"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
)

type VirtualizationEngine interface {
	//Raw(ctx context.Context, selectSQL string) (*RawResult, error)
	//RawWithTimeOut(ctx context.Context, selectSQL string, timeOut time.Duration) (*RawResult, error)
	//Columns(ctx context.Context, catalog string, schema string, table string) (*ColumnsResult, error)
	//AsyncRaw(ctx context.Context, selectSQL string) (*AsyncResult, error)
	AsyncExplore(ctx context.Context, param io.Reader, exploreType int) (*AsyncResult, error)
	DeleteTask(ctx context.Context, param io.Reader) error
}

type virtualizationEngine struct {
	url        string
	httpClient *http.Client
	HttpClient *http.Client
}

func NewVirtualizationEngine(httpClient *http.Client) VirtualizationEngine {
	VirtualEngineTimeout, err := strconv.ParseInt(settings.GetConfig().ExplorationConf.VirtualEngineTimeout, 10, 64)
	if err != nil || VirtualEngineTimeout < 10 {
		VirtualEngineTimeout = 10
	}
	return &virtualizationEngine{
		url:        settings.GetConfig().DepServicesConf.VirtualizationEngineUrl,
		httpClient: httpClient,
		HttpClient: &http.Client{
			Transport: otelhttp.NewTransport(
				&http.Transport{
					TLSClientConfig:       &tls.Config{InsecureSkipVerify: true},
					MaxIdleConnsPerHost:   100,
					MaxIdleConns:          100,
					IdleConnTimeout:       90 * time.Second,
					TLSHandshakeTimeout:   10 * time.Second,
					ExpectContinueTimeout: 1 * time.Second,
				},
			),
			Timeout: time.Duration(VirtualEngineTimeout) * time.Second,
		},
	}
}

type RawResult struct {
	Columns []struct {
		Name string `json:"name"`
		Type string `json:"type"`
	} `json:"columns"`
	Data [][]any `json:"data"`
}

type ColumnsResult struct {
	Columns []struct {
		Name     string `json:"name"`
		Type     string `json:"type"`
		OrigType string `json:"origType"`
		Comment  string `json:"comment"`
	} `json:"data"`
}

type AsyncResult struct {
	TaskId []string `json:"task_id"`
}

/*
func (v *virtualizationEngine) Raw(ctx context.Context, selectSQL string) (*RawResult, error) {
	return v.RawWithTimeOut(ctx, selectSQL, 0)
}

func (v *virtualizationEngine) RawWithTimeOut(ctx context.Context, selectSQL string, timeOut time.Duration) (*RawResult, error) {
	url := v.url + "/api/virtual_engine_service/v1/fetch"
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, strings.NewReader(selectSQL))
	if err != nil {
		log.WithContext(ctx).Errorf("failed to create req in post vir engine, sql: %v, err: %v", selectSQL, err)
		return nil, errorcode.Detail(errorcode.PublicInternalError, err)
	}

	req.Header.Add("Content-Type", "text/plain")
	req.Header.Add("X-Presto-User", "admin")

	httpClient := v.httpClient
	if timeOut != 0 {
		httpClient = trace.NewOtelHttpClient()
		httpClient.Timeout = timeOut
	}
	resp, err := httpClient.Do(req)
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
*/
/*
func (v *virtualizationEngine) AsyncRaw(ctx context.Context, selectSQL string) (*AsyncResult, error) {
	url := v.url + "/api/virtual_engine_service/v1/task"
	// req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, strings.NewReader(selectSQL))
	// if err != nil {
	// 	log.WithContext(ctx).Errorf("failed to create req in post vir engine, sql: %v, err: %v", selectSQL, err)
	// 	return nil, err
	// }
	params := fmt.Sprintf("statement=%s&topic=%s", selectSQL, settings.GetConfig().ExplorationConf.VirtualQueryResultTopic)

	log.WithContext(ctx).Infof("query params (body): %s", params)
	log.WithContext(ctx).Info("Content-Type:application/x-www-form-urlencoded")
	log.WithContext(ctx).Infof("url:%s", url)
	log.WithContext(ctx).Infof("method:%s", http.MethodPost)

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewReader([]byte(params)))
	if err != nil {
		log.WithContext(ctx).Errorf("failed to create req in post vir engine, sql: %v, err: %v", selectSQL, err)
		return nil, err
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	// req.Header.Add("Content-Type", "text/plain")
	req.Header.Add("X-Presto-User", "admin")

	resp, err := v.httpClient.Do(req)
	if err != nil {
		log.WithContext(ctx).Errorf("failed to send req in post vir engine, sql: %v, url: %s, err: %v", selectSQL, req.URL.String(), err)
		return nil, err
	}
	defer func() {
		_ = resp.Body.Close()
	}()

	b, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		log.WithContext(ctx).Errorf("failed to read resp data in post vir engine, sql: %v, url: %s, err: %v", selectSQL, req.URL.String(), err)
		return nil, err
	}
	if resp.StatusCode >= http.StatusInternalServerError {
		log.WithContext(ctx).Errorf("failed to send req in post vir engine, sql: %v, url: %s, resp: %s", selectSQL, req.URL.String(), b)
		return nil, errorcode.Detail(errorcode.PublicInternalError, string(b))
	}

	if resp.StatusCode >= http.StatusBadRequest {
		log.WithContext(ctx).Errorf("failed to send req in post vir engine, sql: %v, url: %s, resp: %s", selectSQL, req.URL.String(), b)
		return nil, errorcode.Detail(errorcode.PublicInternalError, string(b))
	}

	var ret AsyncResult
	if err = json.Unmarshal(b, &ret); err != nil {
		log.WithContext(ctx).Errorf("failed to send req in post vir engine, sql: %v, utl: %s, resp: %s, json.Unmarshal err: %v", selectSQL, req.URL.String(), b, err)
		return nil, err
	}

	return &ret, nil
}*/

func (v *virtualizationEngine) AsyncExplore(ctx context.Context, param io.Reader, exploreType int) (*AsyncResult, error) {
	url := fmt.Sprintf("%s/api/vega-gateway/v1/task?type=%d", v.url, exploreType)
	log.WithContext(ctx).Infof("url:%s", url)
	log.WithContext(ctx).Infof("method:%s", http.MethodPost)

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, param)
	if err != nil {
		log.WithContext(ctx).Errorf("failed to create req in post vir engine, err: %v", err)
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")

	req.Header.Add("X-Presto-User", "async_task_user")

	resp, err := v.HttpClient.Do(req)
	if err != nil {
		log.WithContext(ctx).Errorf("failed to send req in post vir engine, url: %s, err: %v", req.URL.String(), err)
		return nil, err
	}
	defer func() {
		_ = resp.Body.Close()
	}()

	b, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		log.WithContext(ctx).Errorf("failed to read resp data in post vir engine, url: %s, err: %v", req.URL.String(), err)
		return nil, err
	}
	if resp.StatusCode >= http.StatusInternalServerError {
		log.WithContext(ctx).Errorf("failed to send req in post vir engine, url: %s, resp: %s", req.URL.String(), b)
		return nil, errorcode.Detail(errorcode.PublicInternalError, string(b))
	}

	if resp.StatusCode >= http.StatusBadRequest {
		log.WithContext(ctx).Errorf("failed to send req in post vir engine, url: %s, resp: %s", req.URL.String(), b)
		res := new(errorcode.ErrorCodeBody)
		if err = jsoniter.Unmarshal(b, res); err != nil {
			log.Error("执行任务失败 400 error jsoniter.Unmarshal", zap.Error(err))
			return nil, errorcode.Detail(errorcode.PublicInternalError, string(b))
		}
		return nil, errorcode.New(res.Code, res.Description, "", res.Solution, res.Detail, "")
	}

	var ret AsyncResult
	if err = json.Unmarshal(b, &ret); err != nil {
		log.WithContext(ctx).Errorf("failed to send req in post vir engine, utl: %s, resp: %s, json.Unmarshal err: %v", req.URL.String(), b, err)
		return nil, err
	}

	return &ret, nil
}

/*
func (v *virtualizationEngine) Columns(ctx context.Context, catalog string, schema string, table string) (*ColumnsResult, error) {
	url := fmt.Sprintf(v.url+"/api/virtual_engine_service/v1/metadata/columns/%s/%s/%s", catalog, schema, table)
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		log.Errorf("failed to create req in post vir engine, err: %v", err)
		return nil, errorcode.Detail(errorcode.PublicInternalError, err)
	}

	req.Header.Add("Content-Type", "text/plain")
	req.Header.Add("X-Presto-User", "admin")
	httpClient := trace.NewOtelHttpClient()
	httpClient.Timeout = 2 * time.Minute

	resp, err := httpClient.Do(req)

	if err != nil {
		log.Errorf("failed to send req in post vir engine, url: %s, err: %v", url, err)
		return nil, errorcode.Detail(errorcode.PublicInternalError, err)
	}
	defer func() {
		_ = resp.Body.Close()
	}()

	b, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		log.Errorf("failed to read resp data in post vir engine url: %s, err: %v", url, err)
		return nil, errorcode.Detail(errorcode.PublicInternalError, err)
	}
	if resp.StatusCode >= http.StatusInternalServerError {
		log.Errorf("failed to send req in post vir engine url: %s, resp: %s", url, b)
		return nil, errorcode.Detail(errorcode.PublicInternalError, string(b))
	}

	if resp.StatusCode >= http.StatusBadRequest {
		log.Errorf("failed to send req in post vir engine url: %s, resp: %s", url, b)
		return nil, errorcode.Detail(errorcode.PublicVEngineRequestBad, string(b))
	}

	var ret ColumnsResult
	if err = json.Unmarshal(b, &ret); err != nil {
		log.Errorf("failed to send req in post vir engine url: %s, resp: %s, json.Unmarshal err: %v", url, b, err)
		return nil, errorcode.Detail(errorcode.PublicInternalError, err)
	}

	return &ret, nil
}*/

func (v *virtualizationEngine) DeleteTask(ctx context.Context, param io.Reader) error {
	url := fmt.Sprintf(v.url + "/api/vega-gateway/v1/task")
	log.WithContext(ctx).Infof("url:%s", url)
	log.WithContext(ctx).Infof("method:%s", http.MethodPut)
	req, err := http.NewRequestWithContext(ctx, http.MethodPut, url, param)
	if err != nil {
		log.Errorf("failed to create req in delete vir engine, err: %v", err)
		return errorcode.Detail(errorcode.PublicInternalError, err)
	}

	req.Header.Add("Content-Type", "application/json")
	req.Header.Add("X-Presto-User", "async_task_user")

	resp, err := v.HttpClient.Do(req)

	if err != nil {
		log.Errorf("failed to send req in delete vir engine, url: %s, err: %v", url, err)
		return errorcode.Detail(errorcode.PublicInternalError, err)
	}
	defer func() {
		_ = resp.Body.Close()
	}()

	b, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		log.Errorf("failed to read resp data in delete vir engine url: %s, err: %v", url, err)
		return errorcode.Detail(errorcode.PublicInternalError, err)
	}
	if resp.StatusCode >= http.StatusInternalServerError {
		log.Errorf("failed to send req in post delete engine url: %s, resp: %s", url, b)
		return errorcode.Detail(errorcode.PublicInternalError, string(b))
	}

	if resp.StatusCode >= http.StatusBadRequest {
		log.Errorf("failed to send req in delete vir engine url: %s, resp: %s", url, b)
		return errorcode.Detail(errorcode.PublicVEngineRequestBad, string(b))
	}

	return nil
}
