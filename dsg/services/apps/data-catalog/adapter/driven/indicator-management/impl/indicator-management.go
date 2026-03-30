package impl

import (
	"context"
	"encoding/json"
	"net/http"
	"net/url"
	"path"

	"go.uber.org/zap"

	indicator_management "github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/driven/indicator-management"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/settings"
	"github.com/kweaver-ai/idrm-go-common/interception"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/trace"
	"github.com/kweaver-ai/idrm-go-frame/core/utils/httpclient"
)

var _ indicator_management.Repo = (*IMDrivenRepo)(nil)

type IMDrivenRepo struct {
	client httpclient.HTTPClient
}

func NewIMDrivenRepo(client httpclient.HTTPClient) indicator_management.Repo {
	return &IMDrivenRepo{client: client}
}

// GetIndicatorDetail 根据指标ID获取指标详情
func (r *IMDrivenRepo) GetIndicatorDetail(ctx context.Context, req *indicator_management.GetIndicatorDetailReq) (*indicator_management.IndicatorDetailResp, error) {
	var err error
	ctx, span := trace.StartInternalSpan(ctx)
	defer func() { trace.TelemetrySpanEnd(span, err) }()

	log := log.WithContext(ctx)

	// 获取indicator-management服务的host
	host := getIndicatorManagementHost()
	base, err := url.Parse(host)
	if err != nil {
		log.Error("parse indicator-management host fail", zap.Error(err), zap.String("host", host))
		return nil, errorcode.Detail(errorcode.PublicInternalError, err.Error())
	}

	base.Path = path.Join(base.Path, "api/indicator-management/v1/indicator", req.IndicatorID)

	headers := map[string]string{"Content-Type": "application/json"}

	if token, ok := ctx.Value(interception.Token).(string); ok {
		headers["Authorization"] = token
	}

	// httpclient.HTTPClient 会将状态码不是 200+ 的 response 作为 error 返回，所
	// 以不需要再判断 code
	response, err := r.client.Get(ctx, base.String(), headers)
	if err != nil {
		log.Error("send http request to indicator-management fail", zap.Error(err), zap.String("method", http.MethodGet), zap.Stringer("url", base))
		return nil, errorcode.Detail(errorcode.PublicInternalError, err.Error())
	}

	log.Info("http response", zap.Any("body", response))

	bytes, err := json.Marshal(response)
	if err != nil {
		log.Error("encode indicator-management response as json fail", zap.Error(err), zap.Any("response", response))
		return nil, errorcode.Detail(errorcode.ModelJsonMarshalError, err.Error())
	}

	var result indicator_management.IndicatorDetailResp
	if err := json.Unmarshal(bytes, &result); err != nil {
		log.Error("decode indicator-management response as json fail", zap.Error(err), zap.ByteString("response", bytes))
		return nil, errorcode.Detail(errorcode.ModelJsonUnMarshalError, err.Error())
	}

	return &result, nil
}

// getIndicatorManagementHost 获取indicator-management服务的host
func getIndicatorManagementHost() string {
	// 尝试从配置中获取，如果没有配置则使用默认值
	config := settings.GetConfig()
	if config != nil && config.DepServicesConf.IndicatorManagementHost != "" {
		return config.DepServicesConf.IndicatorManagementHost
	}
	// 默认值，应该根据实际环境配置
	return "http://indicator-management:8213"
}
