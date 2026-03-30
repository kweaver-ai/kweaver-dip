package util

import (
	"bytes"
	"context"
	"crypto/tls"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"time"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/settings"
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

func GetClientInfo(ctx context.Context) (string, string, error) {
	params := map[string]any{
		"client_name":    "client",
		"grant_types":    []string{"client_credentials"},
		"response_types": []string{"token"},
		"scope":          "all",
	}
	buf, err := json.Marshal(params)
	if err != nil {
		log.WithContext(ctx).Errorf("Marshal failed. err: %v", err)
		return "", "", err
	}

	buf, err = DoHttpPost(ctx, settings.GetConfig().OauthConf.HydraAdmin+"/admin/clients", nil, bytes.NewReader(buf))
	if err != nil {
		log.WithContext(ctx).Errorf("failed to get client_id, err: %v", err)
		return "", "", err
	}

	var clientInfo struct {
		ClientID     string `json:"client_id"`
		ClientSecret string `json:"client_secret"`
	}
	if err = json.Unmarshal(buf, &clientInfo); err != nil {
		log.WithContext(ctx).Errorf("Unmarshal failed. err: %v", err)
		return "", "", err
	}
	return clientInfo.ClientID, clientInfo.ClientSecret, nil
}

func RequestToken(ctx context.Context, clientID, clientSecret string) (string, error) {
	info := clientID + ":" + clientSecret
	base64 := "Basic " + base64.StdEncoding.EncodeToString([]byte(info))
	header := http.Header{
		"Authorization": []string{base64},
		"Content-Time":  []string{"application/x-www-form-urlencoded"}}
	params := "grant_type=client_credentials&scope=all"
	buf, err := DoHttpPost(ctx, settings.GetConfig().OauthConf.HydraPublic+"/oauth2/token", header, bytes.NewReader([]byte(params)))
	if err != nil {
		log.WithContext(ctx).Errorf("failed to get token err: %v", err)
		return "", err
	}
	var resp struct {
		AccessToken string `json:"access_token"`
	}
	if err = json.Unmarshal(buf, &resp); err != nil {
		log.WithContext(ctx).Errorf("Unmarshal failed. err: %v", err)
		return "", err
	}
	return resp.AccessToken, err
}
