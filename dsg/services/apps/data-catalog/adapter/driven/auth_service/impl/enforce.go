package impl

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"

	"go.uber.org/zap"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/driven/auth_service"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/settings"
	"github.com/kweaver-ai/idrm-go-common/interception"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/trace"
)

func (r *ASDrivenRepo) Enforce(ctx context.Context, policyEnforces []auth_service.PolicyEnforce) ([]auth_service.PolicyEnforceEffect, error) {
	ctx, span := trace.StartInternalSpan(ctx)
	defer span.End()

	log := log.WithContext(ctx)

	headers := map[string]string{"Content-Time": "application/json"}

	if token, ok := ctx.Value(interception.Token).(string); ok {
		headers["Authorization"] = token
	}

	log.Info("http request", zap.Any("body", policyEnforces))

	urlStr := fmt.Sprintf("%s/api/auth-service/v1/enforce", settings.GetConfig().AuthServiceHost)
	// httpclient.HTTPClient 会将状态码不是 200+ 的 response 作为 error 返回，所
	// 以不需要再判断 code
	_, response, err := r.client.Post(ctx, urlStr, headers, policyEnforces)
	if err != nil {
		log.Error("send http request to auth-service fail", zap.Error(err), zap.String("method", http.MethodPost), zap.String("url", urlStr))
		return nil, errorcode.Detail(errorcode.PublicInternalError, err.Error())
	}

	log.Info("http response", zap.Any("body", response))

	bytes, err := json.Marshal(response)
	if err != nil {
		log.Error("encode auth-service response as json fail", zap.Error(err), zap.Any("response", response))
		return nil, errorcode.Detail(errorcode.ModelJsonMarshalError, err.Error())
	}

	var result []auth_service.PolicyEnforceEffect
	if err := json.Unmarshal(bytes, &result); err != nil {
		log.Error("decode auth-service response as json fail", zap.Error(err), zap.ByteString("response", bytes))
		return nil, errorcode.Detail(errorcode.ModelJsonUnMarshalError, err.Error())
	}

	return result, nil
}
