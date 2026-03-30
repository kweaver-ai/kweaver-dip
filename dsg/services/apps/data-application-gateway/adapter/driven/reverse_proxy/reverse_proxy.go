package reverse_proxy

import (
	"context"
	"crypto/tls"
	"io"
	"mime"
	"net/http"
	"strings"
	"time"

	"github.com/imroc/req/v2"
	"github.com/spf13/cast"
	"go.opentelemetry.io/otel/trace"
	"go.uber.org/zap"

	"github.com/kweaver-ai/TelemetrySDK-Go/exporter/v2/ar_trace"
	"github.com/kweaver-ai/dsg/services/apps/data-application-gateway/common/dto"
	"github.com/kweaver-ai/dsg/services/apps/data-application-gateway/common/errorcode"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	goframetrace "github.com/kweaver-ai/idrm-go-frame/core/telemetry/trace"
)

type ReverseProxyRepo interface {
	Serve(ctx context.Context, params map[string]*dto.Param, HTTPMethod, backendServiceHost, backendServicePath string, timeout uint32) (length int64, res io.ReadCloser, err error)
}

func NewReverseProxyRepo() ReverseProxyRepo {
	return &reverseProxyRepo{}
}

type reverseProxyRepo struct{}

func (r reverseProxyRepo) Serve(ctx context.Context, params map[string]*dto.Param, HTTPMethod, backendServiceHost, backendServicePath string, timeout uint32) (length int64, res io.ReadCloser, err error) {
	ctx, span := ar_trace.Tracer.Start(ctx, "reverseProxy", trace.WithSpanKind(trace.SpanKindClient))
	defer func() { goframetrace.TelemetrySpanEnd(span, err) }()

	headers := map[string]string{}
	queryParams := map[string]string{}
	body := map[string]interface{}{}

	for paramName, param := range params {
		switch param.Position {
		case dto.ParamPositionHeader:
			if paramName == "Accept-Encoding" {
				continue
			}
			headers[paramName] = cast.ToString(param.Value)
		case dto.ParamPositionQuery:
			queryParams[paramName] = cast.ToString(param.Value)
		case dto.ParamPositionBody:
			body[paramName] = param.Value
		}
	}

	client := req.C().
		SetTimeout(time.Duration(timeout) * time.Second).
		SetTLSClientConfig(&tls.Config{InsecureSkipVerify: true}).DisableAutoReadResponse(true)

	request := client.R().SetContext(ctx)
	if len(headers) > 0 {
		request = request.SetHeaders(headers)
	}
	if len(queryParams) > 0 {
		request = request.SetQueryParams(queryParams)
	}
	if len(body) > 0 {
		request = request.SetBody(body)
	}

	url := backendServiceHost + backendServicePath
	resp, err := request.Send(strings.ToUpper(HTTPMethod), url)
	if err != nil {
		log.WithContext(ctx).Error("Serve", zap.Error(err))
		return 0, nil, errorcode.Detail(errorcode.QueryError, err.Error())
	}

	if resp.StatusCode != http.StatusOK {
		log.WithContext(ctx).Error("Serve", zap.String("body", resp.String()))
		return 0, nil, errorcode.Detail(errorcode.QueryError, resp.String())
	}

	// 检查 response 是否为 json
	if err := validateContentType(resp.Header.Get("Content-Type")); err != nil {
		return 0, nil, err
	}

	return resp.ContentLength, resp.Body, nil
}

const mediaTypeJSON = "application/json"

// validateContentType 检查 content-type 是否满足要求
func validateContentType(contentType string) error {
	if contentType == "" {
		return nil
	}

	mediaType, _, err := mime.ParseMediaType(contentType)
	if err != nil || mediaType != mediaTypeJSON {
		return errorcode.Detail(errorcode.BackendUnsupportedContentType, contentType)
	}

	return nil
}
