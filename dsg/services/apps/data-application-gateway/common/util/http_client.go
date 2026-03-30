package util

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	jsoniter "github.com/json-iterator/go"
	"io/ioutil"
	"net/http"
)

// HTTPError 服务错误结构体
type HTTPError struct {
	Cause   string                 `json:"cause"`
	Code    int                    `json:"code"`
	Message string                 `json:"message"`
	Detail  map[string]interface{} `json:"detail,omitempty"`
}

func (err HTTPError) Error() string {
	errstr, _ := jsoniter.Marshal(err)
	return string(errstr)
}

// ExHTTPError 其他服务响应的错误结构体
type ExHTTPError struct {
	Status int
	Body   []byte
}

func (err ExHTTPError) Error() string {
	return string(err.Body)
}

// HTTPClient HTTP客户端服务接口
type HTTPClient interface {
	Get(ctx context.Context, url string, headers map[string]string) (respBytes []byte, err error)
	Post(ctx context.Context, url string, headers map[string]string, reqParam interface{}) (respCode int, respBytes []byte, err error)
	Put(ctx context.Context, url string, headers map[string]string, reqParam interface{}) (respCode int, respBytes []byte, err error)
	Delete(ctx context.Context, url string, headers map[string]string) (respBytes []byte, err error)
}

// httpClient HTTP客户端结构
type httpClient struct {
	client *http.Client
}

func NewHTTPClient(hc *http.Client) HTTPClient {
	client := &httpClient{
		client: hc,
	}

	return client
}

// Get http client get
func (c *httpClient) Get(ctx context.Context, url string, headers map[string]string) (respBytes []byte, err error) {
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return
	}

	_, respBytes, err = c.httpDo(ctx, req, headers)
	return
}

// Post http client post
func (c *httpClient) Post(ctx context.Context, url string, headers map[string]string, reqParam interface{}) (respCode int, respBytes []byte, err error) {
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

	respCode, respBytes, err = c.httpDo(ctx, req, headers)
	return
}

// Put http client put
func (c *httpClient) Put(ctx context.Context, url string, headers map[string]string, reqParam interface{}) (respCode int, respBytes []byte, err error) {
	reqBody, err := jsoniter.Marshal(reqParam)
	if err != nil {
		return
	}

	req, err := http.NewRequest("PUT", url, bytes.NewReader(reqBody))
	if err != nil {
		return
	}

	respCode, respBytes, err = c.httpDo(ctx, req, headers)
	return
}

// Delete http client delete
func (c *httpClient) Delete(ctx context.Context, url string, headers map[string]string) (respBytes []byte, err error) {
	req, err := http.NewRequest("DELETE", url, nil)
	if err != nil {
		return
	}

	_, respBytes, err = c.httpDo(ctx, req, headers)
	return
}

func (c *httpClient) httpDo(ctx context.Context, req *http.Request, headers map[string]string) (respCode int, respBytes []byte, err error) {
	if c.client == nil {
		return 0, nil, errors.New("http client is unavailable")
	}

	c.addHeaders(req, headers)

	resp, err := c.client.Do(req.WithContext(ctx))
	if err != nil {
		return
	}
	defer func() {
		closeErr := resp.Body.Close()
		if closeErr != nil {

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

	return respCode, body, nil
}

func (c *httpClient) addHeaders(req *http.Request, headers map[string]string) {
	for k, v := range headers {
		if len(v) > 0 {
			req.Header.Add(k, v)
		}
	}
}
