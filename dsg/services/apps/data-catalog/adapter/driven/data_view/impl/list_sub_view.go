package impl

import (
	"context"
	"encoding/json"
	"net/http"
	"net/url"
	"path"
	"strconv"

	"go.uber.org/zap"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/driven/data_view"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/settings"
	"github.com/kweaver-ai/idrm-go-common/interception"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/trace"
)

// ListSubView implements data_view.Repo.
func (r *DVDrivenRepo) ListSubView(ctx context.Context, opts data_view.ListSubViewOptions) (*data_view.List[data_view.SubView], error) {
	ctx, span := trace.StartInternalSpan(ctx)
	defer span.End()

	log := log.WithContext(ctx)

	host := settings.GetConfig().DataViewHost
	base, err := url.Parse(host)
	if err != nil {
		log.Error("parse data-view host fail", zap.Error(err), zap.String("host", host))
		return nil, errorcode.Detail(errorcode.PublicInternalError, err.Error())
	}

	base.Path = path.Join(base.Path, "api/data-view/v1/sub-views")

	// query 参数
	var query = make(url.Values)
	if opts.LogicViewID != "" {
		query.Add("logic_view_id", opts.LogicViewID)
	}
	if opts.Limit != 0 {
		query.Add("limit", strconv.Itoa(opts.Limit))
	}
	if opts.Offset != 0 {
		query.Add("offset", strconv.Itoa(opts.Offset))
	}
	base.RawQuery = query.Encode()

	headers := map[string]string{"Content-Time": "application/json"}

	if token, ok := ctx.Value(interception.Token).(string); ok {
		headers["Authorization"] = token
	}

	// httpclient.HTTPClient 会将状态码不是 200+ 的 response 作为 error 返回，所
	// 以不需要再判断 code
	response, err := r.client.Get(ctx, base.String(), headers)
	if err != nil {
		log.Error("send http request to data-view fail", zap.Error(err), zap.String("method", http.MethodPost), zap.Stringer("url", base))
		return nil, errorcode.Detail(errorcode.PublicInternalError, err.Error())
	}

	log.Info("http response", zap.Any("body", response))

	bytes, err := json.Marshal(response)
	if err != nil {
		log.Error("encode data-view response as json fail", zap.Error(err), zap.Any("response", response))
		return nil, errorcode.Detail(errorcode.ModelJsonMarshalError, err.Error())
	}

	var result data_view.List[data_view.SubView]
	if err := json.Unmarshal(bytes, &result); err != nil {
		log.Error("decode data-view response as json fail", zap.Error(err), zap.ByteString("response", bytes))
		return nil, errorcode.Detail(errorcode.ModelJsonUnMarshalError, err.Error())
	}

	return &result, nil
}

func (r *DVDrivenRepo) GetDesensitizationRuleByIds(ctx context.Context, req *data_view.GetDesensitizationRuleByIdsReq) (*data_view.GetDesensitizationRuleByIdsRes, error) {
	var err error
	ctx, span := trace.StartInternalSpan(ctx)
	defer func() { trace.TelemetrySpanEnd(span, err) }()
	errorMsg := "DrivenDataView GetDesensitizationRuleByIds "

	host := settings.GetConfig().DataViewHost
	base, err := url.Parse(host)
	if err != nil {
		log.Error("parse data-view host fail", zap.Error(err), zap.String("host", host))
		return nil, errorcode.Detail(errorcode.PublicInternalError, err.Error())
	}

	base.Path = path.Join(base.Path, "api/data-view/v1/desensitization-rule/ids")

	// urlStr := fmt.Sprintf("http://%s/api/data-view/v1/desensitization-rule/ids", base)
	headers := map[string]string{"Content-Time": "application/json"}
	if token, ok := ctx.Value(interception.Token).(string); ok {
		headers["Authorization"] = token
	}
	_, response, err := r.client.Post(ctx, base.String(), headers, req)
	if err != nil {
		log.WithContext(ctx).Error(errorMsg+"client.Post error", zap.Error(err))
		return nil, errorcode.Detail(errorcode.PublicInternalError, err.Error())
	}

	result := &data_view.GetDesensitizationRuleByIdsRes{}
	bytes, err := json.Marshal(response)
	if err != nil {
		log.Error("encode data-view desensitization-rule response as json fail", zap.Error(err), zap.Any("response", response))
		return nil, errorcode.Detail(errorcode.ModelJsonMarshalError, err.Error())
	}
	if err := json.Unmarshal(bytes, &result); err != nil {
		log.Error("decode data-view desensitization-rule response as json fail", zap.Error(err), zap.ByteString("response", bytes))
		return nil, errorcode.Detail(errorcode.ModelJsonUnMarshalError, err.Error())
	}
	return result, nil
}

func (r *DVDrivenRepo) GetDataPrivacyPolicyByFormViewId(ctx context.Context, req *data_view.GetDataPrivacyPolicyByFormViewIdReq) (*data_view.DataPrivacyPolicyDetailResp, error) {
	var err error
	ctx, span := trace.StartInternalSpan(ctx)
	defer func() { trace.TelemetrySpanEnd(span, err) }()

	log := log.WithContext(ctx)

	host := settings.GetConfig().DataViewHost
	base, err := url.Parse(host)
	if err != nil {
		log.Error("parse data-view host fail", zap.Error(err), zap.String("host", host))
		return nil, errorcode.Detail(errorcode.PublicInternalError, err.Error())
	}

	base.Path = path.Join(base.Path, "api/data-view/v1/data-privacy-policy", req.FormViewID, "by-form-view")

	headers := map[string]string{"Content-Type": "application/json"}

	if token, ok := ctx.Value(interception.Token).(string); ok {
		headers["Authorization"] = token
	}

	// httpclient.HTTPClient 会将状态码不是 200+ 的 response 作为 error 返回，所
	// 以不需要再判断 code
	response, err := r.client.Get(ctx, base.String(), headers)
	if err != nil {
		log.Error("send http request to data-view fail", zap.Error(err), zap.String("method", http.MethodGet), zap.Stringer("url", base))
		return nil, errorcode.Detail(errorcode.PublicInternalError, err.Error())
	}

	log.Info("http response", zap.Any("body", response))

	bytes, err := json.Marshal(response)
	if err != nil {
		log.Error("encode data-view data-privacy-policy response as json fail", zap.Error(err), zap.Any("response", response))
		return nil, errorcode.Detail(errorcode.ModelJsonMarshalError, err.Error())
	}

	var result data_view.DataPrivacyPolicyDetailResp
	if err := json.Unmarshal(bytes, &result); err != nil {
		log.Error("decode data-view data-privacy-policy response as json fail", zap.Error(err), zap.ByteString("response", bytes))
		return nil, errorcode.Detail(errorcode.ModelJsonUnMarshalError, err.Error())
	}

	return &result, nil
}

// ListSubView implements data_view.Repo.
func (r *DVDrivenRepo) GetDataViewList(ctx context.Context, opts data_view.PageListFormViewReqQueryParam) (*data_view.PageListFormViewResp, error) {
	ctx, span := trace.StartInternalSpan(ctx)
	defer span.End()

	log := log.WithContext(ctx)

	host := settings.GetConfig().DataViewHost
	base, err := url.Parse(host)
	if err != nil {
		log.Error("parse data-view host fail", zap.Error(err), zap.String("host", host))
		return nil, errorcode.Detail(errorcode.PublicInternalError, err.Error())
	}

	base.Path = path.Join(base.Path, "api/data-view/v1/form-view")

	// query 参数
	var query = make(url.Values)
	if opts.InfoSystemID != nil {
		query.Add("info_system_id", *opts.InfoSystemID)
	}
	if opts.DataSourceSourceType != "" {
		query.Add("datasource_source_type", opts.DataSourceSourceType)
	}
	if opts.DatasourceType != "" {
		query.Add("datasource_type", opts.DatasourceType)
	}
	if opts.DatasourceId != "" {
		query.Add("datasource_id", opts.DatasourceId)
	}
	query.Add("limit", strconv.Itoa(2000))
	query.Add("offset", strconv.Itoa(1))
	base.RawQuery = query.Encode()

	headers := map[string]string{"Content-Time": "application/json"}

	if token, ok := ctx.Value(interception.Token).(string); ok {
		headers["Authorization"] = token
	}

	// httpclient.HTTPClient 会将状态码不是 200+ 的 response 作为 error 返回，所
	// 以不需要再判断 code
	response, err := r.client.Get(ctx, base.String(), headers)
	if err != nil {
		log.Error("send http request to data-view fail", zap.Error(err), zap.String("method", http.MethodPost), zap.Stringer("url", base))
		return nil, errorcode.Detail(errorcode.PublicInternalError, err.Error())
	}

	log.Info("http response", zap.Any("body", response))

	bytes, err := json.Marshal(response)
	if err != nil {
		log.Error("encode data-view response as json fail", zap.Error(err), zap.Any("response", response))
		return nil, errorcode.Detail(errorcode.ModelJsonMarshalError, err.Error())
	}

	var result data_view.PageListFormViewResp
	if err := json.Unmarshal(bytes, &result); err != nil {
		log.Error("decode data-view response as json fail", zap.Error(err), zap.ByteString("response", bytes))
		return nil, errorcode.Detail(errorcode.ModelJsonUnMarshalError, err.Error())
	}

	return &result, nil
}
