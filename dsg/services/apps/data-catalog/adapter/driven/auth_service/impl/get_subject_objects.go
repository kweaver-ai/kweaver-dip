package impl

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"

	"go.uber.org/zap"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/driven/auth_service"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/settings"
	"github.com/kweaver-ai/idrm-go-common/interception"
	"github.com/kweaver-ai/idrm-go-frame/core/errorx/agcodes"
	"github.com/kweaver-ai/idrm-go-frame/core/errorx/agerrors"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/trace"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest/ginx"
	"github.com/kweaver-ai/idrm-go-frame/core/utils/httpclient"
)

// GetSubjectObjects implements auth_service.Repo.
func (r *ASDrivenRepo) GetSubjectObjects(ctx context.Context, opts auth_service.GetObjectsOptions) (*auth_service.ObjectWithPermissionsList, error) {
	ctx, span := trace.StartInternalSpan(ctx)
	defer span.End()

	log := log.WithContext(ctx)

	base, err := url.Parse(settings.GetConfig().AuthServiceHost)
	if err != nil {
		log.Error("parse auth-service host fail", zap.Error(err), zap.String("host", settings.GetConfig().AuthServiceHost))
		return nil, errorcode.Detail(errorcode.PublicInternalError, fmt.Sprintf("parse auth-service host fail: %v", err))
	}
	base.Path = "/api/auth-service/v1/subject/objects"
	base.RawQuery = opts.Query().Encode()

	headers := map[string]string{"Content-Time": "application/json"}

	if token, ok := ctx.Value(interception.Token).(string); ok {
		headers["Authorization"] = token
	}

	// httpclient.HTTPClient 会将状态码不是 200+ 的 response 作为 error 返回，所
	// 以不需要再判断 code
	response, err := r.client.Get(ctx, base.String(), headers)
	if err != nil {
		log.Error("send http request to auth-service fail", zap.Error(err), zap.String("method", http.MethodGet), zap.Stringer("url", base))

		if errEx, ok := err.(httpclient.ExHTTPError); ok {
			if errHTTP := new(ginx.HttpError); json.Unmarshal(errEx.Body, errHTTP) == nil && errHTTP.Code != "" {
				return nil, agerrors.NewCode(agcodes.New(errHTTP.Code, errHTTP.Description, errHTTP.Cause, errHTTP.Solution, errHTTP.Detail, ""))
			}
		}

		return nil, errorcode.Detail(errorcode.PublicInternalError, map[string]any{
			"method": http.MethodGet,
			"url":    base.String(),
			"err":    err.Error(),
		})
	}

	log.Info("http response", zap.Any("body", response))

	bytes, err := json.Marshal(response)
	if err != nil {
		log.Error("encode auth-service response as json fail", zap.Error(err), zap.Any("response", response))
		return nil, errorcode.Detail(errorcode.ModelJsonMarshalError, map[string]any{
			"message":  "encode auth-service response as json fail",
			"response": response,
			"err":      err.Error(),
		})
	}

	var result auth_service.ObjectWithPermissionsList
	if err := json.Unmarshal(bytes, &result); err != nil {
		log.Error("decode auth-service response as json fail", zap.Error(err), zap.ByteString("response", bytes))
		return nil, errorcode.Detail(errorcode.ModelJsonUnMarshalError, map[string]any{
			"message":  "decode auth-service response as json fail",
			"response": bytes,
			"err":      err.Error(),
		})
	}

	return &result, nil
}
