package http_client

import (
	"bytes"
	"crypto/tls"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"errors"
	"fmt"
	jsoniter "github.com/json-iterator/go"
	"go.uber.org/zap"
	"io/ioutil"
	"net/http"
	"sync"
	"time"
)

//go:generate mockgen -package mock -source ./http_client.go -destination ./mock/mock_http_client.go

// HTTPClient HTTP客户端服务接口
type HTTPClient interface {
	Get(url string, headers map[string]string) (respParam interface{}, err error)
	Post(url string, headers map[string]string, reqParam interface{}) (respCode int, respParam interface{}, err error)
	Put(url string, headers map[string]string, reqParam interface{}) (respCode int, respParam interface{}, err error)
	Delete(url string, headers map[string]string) (respParam interface{}, err error)
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
			Transport: &http.Transport{
				TLSClientConfig:       &tls.Config{InsecureSkipVerify: true},
				MaxIdleConnsPerHost:   100,
				MaxIdleConns:          100,
				IdleConnTimeout:       90 * time.Second,
				TLSHandshakeTimeout:   10 * time.Second,
				ExpectContinueTimeout: 1 * time.Second,
			},
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
func (c *httpClient) Get(url string, headers map[string]string) (respParam interface{}, err error) {
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return
	}

	_, respParam, err = c.httpDo(req, headers)
	return
}

// Post http client post
func (c *httpClient) Post(url string, headers map[string]string, reqParam interface{}) (respCode int, respParam interface{}, err error) {
	var reqBody []byte
	if v, ok := reqParam.([]byte); ok {
		reqBody = v
	} else {
		reqBody, err = jsoniter.Marshal(reqParam)
		if err != nil {
			return
		}
	}

	req, err := http.NewRequest("POST", url, bytes.NewReader(reqBody))
	if err != nil {
		return
	}

	respCode, respParam, err = c.httpDo(req, headers)
	return
}

// Put http client put
func (c *httpClient) Put(url string, headers map[string]string, reqParam interface{}) (respCode int, respParam interface{}, err error) {
	reqBody, err := jsoniter.Marshal(reqParam)
	if err != nil {
		return
	}

	req, err := http.NewRequest("PUT", url, bytes.NewReader(reqBody))
	if err != nil {
		return
	}

	respCode, respParam, err = c.httpDo(req, headers)
	return
}

// Delete http client delete
func (c *httpClient) Delete(url string, headers map[string]string) (respParam interface{}, err error) {
	req, err := http.NewRequest("DELETE", url, nil)
	if err != nil {
		return
	}

	_, respParam, err = c.httpDo(req, headers)
	return
}

func (c *httpClient) httpDo(req *http.Request, headers map[string]string) (respCode int, respParam interface{}, err error) {
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
			log.Error("httpDo", zap.Error(closeErr))
			//log.WithContext(ctx).Error("httpDo", zap.Error(closeErr))  //todo

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
