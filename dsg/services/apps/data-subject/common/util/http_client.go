package util

import (
	"context"
	"crypto/tls"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"time"

	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/trace"
	"go.opentelemetry.io/contrib/instrumentation/net/http/otelhttp"

	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"go.uber.org/zap"
)

var otelClient *http.Client = &http.Client{
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

func DoHttpGet(ctx context.Context, strUrl string, header http.Header, vals url.Values) ([]byte, error) {
	return doHttp(ctx, http.MethodGet, strUrl, header, vals, nil)
}

func DoHttpPost(ctx context.Context, strUrl string, header http.Header, body io.Reader) ([]byte, error) {
	return doHttp(ctx, http.MethodPost, strUrl, header, nil, body)
}

func DoHttpPut(ctx context.Context, strUrl string, header http.Header, body io.Reader) ([]byte, error) {
	return doHttp(ctx, http.MethodPut, strUrl, header, nil, body)
}

func doHttp(ctx context.Context, method, strUrl string, header http.Header, vals url.Values, body io.Reader) ([]byte, error) {
	statusCode, buf, err := HTTPGetResponse(ctx, method, strUrl, header, vals, body)
	if err != nil {
		return nil, err
	}

	if statusCode != http.StatusOK {
		if statusCode == http.StatusCreated {
			return buf, nil
		}
		return nil, errors.New(BytesToString(buf))
	}

	return buf, nil
}

func HTTPGetResponse(ctx context.Context, method, strUrl string, header http.Header, vals url.Values, body io.Reader) (int, []byte, error) {
	var err error
	ctx, span := trace.StartInternalSpan(ctx)
	defer func() { trace.TelemetrySpanEnd(span, err) }()

	if vals != nil {
		strUrl = fmt.Sprintf("%s?%s", strUrl, vals.Encode())
	}

	req, err := http.NewRequestWithContext(ctx, method, strUrl, body)
	if err != nil {
		return 0, nil, err
	}

	if header != nil {
		req.Header = header
	}

	resp, err := otelClient.Do(req)
	if err != nil {
		return 0, nil, err
	}

	var buf []byte
	defer func() {
		closeErr := resp.Body.Close()
		if closeErr != nil {
			log.WithContext(ctx).Error("DoHttp"+method, zap.Error(closeErr))

		}
	}()
	buf, err = io.ReadAll(resp.Body)
	if err != nil {
		return 0, nil, err
	}

	return resp.StatusCode, buf, nil
}

// BadRequestRes 400状态返回时的接收结构体
type BadRequestRes struct {
	Code        string `json:"code"`
	Description string `json:"description"`
}

// DoHttpGetWithBadRequest 400状态返回处理，以便得到接口返回的详细错误，然后自己处理
func DoHttpGetWithBadRequest(ctx context.Context, strUrl string, header http.Header, vals url.Values) ([]byte, *BadRequestRes, error) {
	return doHttpWithBadRequest(ctx, http.MethodGet, strUrl, header, vals, nil)
}

func doHttpWithBadRequest(ctx context.Context, method, strUrl string, header http.Header, vals url.Values, body io.Reader) (resBuf []byte, badRes *BadRequestRes, err error) {
	statusCode, buf, err := HTTPGetResponse(ctx, method, strUrl, header, vals, body)
	if err != nil {
		return nil, nil, err
	}

	if statusCode == http.StatusBadRequest {
		var badRequestRes = &BadRequestRes{}
		if err = json.Unmarshal(buf, badRequestRes); err != nil {
			log.WithContext(ctx).Errorf("buf转json出现问题,原因:%v", err)
			return nil, nil, err
		}
		return nil, badRequestRes, nil
	}

	return buf, nil, nil
}
