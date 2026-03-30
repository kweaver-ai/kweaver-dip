package http_client

import (
	"bytes"
	"context"
	"crypto/tls"
	"errors"
	"fmt"
	"io/ioutil"
	"net/http"
	"sync"
	"time"

	jsoniter "github.com/json-iterator/go"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/trace"
	"go.opentelemetry.io/contrib/instrumentation/net/http/otelhttp"
	"go.uber.org/zap"
)

//go:generate mockgen -package mock -source ./http_client.go -destination ./mock/mock_http_client.go

// HTTPClient HTTP客户端服务接口
type HTTPClient interface {
	Get(ctx context.Context, url string, headers map[string]string) (respParam interface{}, err error)
	Post(ctx context.Context, url string, headers map[string]string, reqParam interface{}) (respCode int, respParam interface{}, err error)
	Put(ctx context.Context, url string, headers map[string]string, reqParam interface{}) (respCode int, respParam interface{}, err error)
	Delete(ctx context.Context, url string, headers map[string]string) (respParam interface{}, err error)
}

var (
	rawOnce   sync.Once
	rawClient *http.Client
	httpOnce  sync.Once
	client    HTTPClient
)

// httpClient HTTP客户端结构
type httpClient struct {
	client *http.Client
}

// NewRawHTTPClient 创建原生HTTP客户端对象
func NewRawHTTPClient() *http.Client {
	rawOnce.Do(func() {
		rawClient = &http.Client{
			CheckRedirect: func(req *http.Request, via []*http.Request) error {
				return http.ErrUseLastResponse
			},
			Transport: otelhttp.NewTransport(&http.Transport{
				TLSClientConfig:       &tls.Config{InsecureSkipVerify: true},
				MaxIdleConnsPerHost:   100,
				MaxIdleConns:          100,
				IdleConnTimeout:       90 * time.Second,
				TLSHandshakeTimeout:   10 * time.Second,
				ExpectContinueTimeout: 1 * time.Second,
			}),
			Timeout: 10 * time.Second,
		}
	})

	return rawClient
}

// NewHTTPClient 创建HTTP客户端对象
func NewHTTPClient() HTTPClient {
	httpOnce.Do(func() {
		client = &httpClient{
			client: NewRawHTTPClient(),
		}
	})

	return client
}

// Get http client get
func (c *httpClient) Get(ctx context.Context, url string, headers map[string]string) (respParam interface{}, err error) {
	req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
	if err != nil {
		return
	}

	_, respParam, err = c.httpDo(ctx, req, headers)
	return
}

// Post http client post
func (c *httpClient) Post(ctx context.Context, url string, headers map[string]string, reqParam interface{}) (respCode int, respParam interface{}, err error) {
	var reqBody []byte
	if v, ok := reqParam.([]byte); ok {
		reqBody = v
	} else {
		reqBody, err = jsoniter.Marshal(reqParam)
		if err != nil {
			return
		}
	}

	req, err := http.NewRequestWithContext(ctx, "POST", url, bytes.NewReader(reqBody))
	if err != nil {
		return
	}

	respCode, respParam, err = c.httpDo(ctx, req, headers)
	return
}

// Put http client put
func (c *httpClient) Put(ctx context.Context, url string, headers map[string]string, reqParam interface{}) (respCode int, respParam interface{}, err error) {
	reqBody, err := jsoniter.Marshal(reqParam)
	if err != nil {
		return
	}

	req, err := http.NewRequestWithContext(ctx, "PUT", url, bytes.NewReader(reqBody))
	if err != nil {
		return
	}

	respCode, respParam, err = c.httpDo(ctx, req, headers)
	return
}

// Delete http client delete
func (c *httpClient) Delete(ctx context.Context, url string, headers map[string]string) (respParam interface{}, err error) {
	req, err := http.NewRequestWithContext(ctx, "DELETE", url, nil)
	if err != nil {
		return
	}

	_, respParam, err = c.httpDo(ctx, req, headers)
	return
}

func (c *httpClient) httpDo(ctx context.Context, req *http.Request, headers map[string]string) (respCode int, respParam interface{}, err error) {
	ctx, span := trace.StartInternalSpan(ctx)
	defer func() { trace.TelemetrySpanEnd(span, err) }()

	if c.client == nil {
		return 0, nil, errors.New("http client is unavailable")
	}

	c.addHeaders(req, headers)

	resp, err := c.client.Do(req)
	if err != nil {
		return
	}
	defer func() {
		closeErr := resp.Body.Close()
		if closeErr != nil {
			log.WithContext(ctx).Error("httpDo", zap.Error(closeErr))

		}
	}()
	body, err := ioutil.ReadAll(resp.Body)
	respCode = resp.StatusCode
	if (respCode < http.StatusOK) || (respCode >= http.StatusMultipleChoices) {
		httpErr := HTTPError{}
		err = jsoniter.Unmarshal(body, &httpErr)
		if err != nil {
			// Unmarshal失败时转成内部错误, body为空Unmarshal失败
			err = fmt.Errorf("code:%v,header:%v,body:%v", respCode, resp.Header, string(body))
		} else {
			err = ExHTTPError{
				Body:   body,
				Status: respCode,
			}
		}
		return
	}

	if len(body) != 0 {
		err = jsoniter.Unmarshal(body, &respParam)
	}

	return
}

func (c *httpClient) addHeaders(req *http.Request, headers map[string]string) {
	for k, v := range headers {
		if len(v) > 0 {
			req.Header.Add(k, v)
		}
	}
}
