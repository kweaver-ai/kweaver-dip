package impl

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/samber/lo"
	"go.uber.org/zap"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/driven/basic_search"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/settings"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/info_resource_catalog"
	"github.com/kweaver-ai/idrm-go-common/rest/base"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/trace"
	"github.com/kweaver-ai/idrm-go-frame/core/utils/httpclient"
)

type repo struct {
	httpclient    httpclient.HTTPClient
	rawHttpClient *http.Client
}

func NewRepo(client httpclient.HTTPClient, rawHttpClient *http.Client) basic_search.Repo {
	return &repo{
		httpclient:    client,
		rawHttpClient: rawHttpClient,
	}
}

func (r *repo) SearchDataCatalog(ctx context.Context, req *basic_search.SearchReqBodyParam) (resp *basic_search.SearchDataRescoureseCatalogResp, err error) {

	ctx, span := trace.StartInternalSpan(ctx)
	defer span.End()

	log := log.WithContext(ctx)

	urlStr := fmt.Sprintf("%s/api/basic-search/v1/data-catalog/search", settings.GetConfig().BasicSearchHost)
	headers := map[string]string{
		"Content-Time": "application/json",
	}
	log.Infof("data-catalog search req info: %s", lo.T2(json.Marshal(req)).A)
	code, response, err := r.httpclient.Post(ctx, urlStr, headers, req)
	if err != nil {
		log.Error("send request fail", zap.String("url", urlStr), zap.String("method", http.MethodPost), zap.Any("body", req))
		return nil, newErrorCode(err)
	}

	if code != http.StatusOK {
		log.Error("basic-search search dataCatalog return unsupported status code", zap.Int("statusCode", code), zap.Any("body", req))
		return nil, errorcode.Detail(errorcode.PublicInternalError, fmt.Sprintf("unsupported basic-search status code: %d, body: %v", code, response))
	}

	bytes, _ := json.Marshal(response)
	log.Infof("data-catalog search resp info: %v", string(bytes))
	_ = json.Unmarshal(bytes, &resp)
	return resp, nil
}

// SearchDataResource 搜索数据资源
func (r *repo) SearchDataResource(ctx context.Context, req *basic_search.SearchDataResourceRequest) (resp *basic_search.SearchDataResourceResponse, err error) {
	ctx, span := trace.StartInternalSpan(ctx)
	defer span.End()

	log := log.WithContext(ctx)

	headers := map[string]string{"Content-Time": "application/json"}

	log.Info("basic-search search data-resource", zap.Any("request", req))

	urlStr := fmt.Sprintf("%s/api/basic-search/v1/data-resource/search", settings.GetConfig().BasicSearchHost)
	code, response, err := r.httpclient.Post(ctx, urlStr, headers, req)
	if err != nil {
		log.Error("send request fail", zap.String("url", urlStr), zap.String("method", http.MethodPost), zap.Any("body", req))
		return nil, newErrorCode(err)
	}

	if code != http.StatusOK {
		log.Error("basic-search search data resource return unsupported status code", zap.Int("statusCode", code), zap.Any("body", req))
		return nil, errorcode.Detail(errorcode.PublicInternalError, fmt.Sprintf("unsupported basic-search status code: %d, body: %v", code, response))
	}

	bytes, err := json.Marshal(response)
	if err != nil {
		log.Error("encode basic-search response as json fail", zap.Error(err), zap.Any("response", response))
		return nil, errorcode.Detail(errorcode.PublicInternalError, err.Error())
	}

	log.Info("basic-search search data-resource", zap.ByteString("response", bytes))

	if err := json.Unmarshal(bytes, &resp); err != nil {
		log.Error("decode basic-search response as json fail", zap.Error(err), zap.ByteString("response", bytes))
		return nil, errorcode.Detail(errorcode.PublicInternalError, err.Error())
	}

	return resp, nil
}

func (r *repo) SearchInfoCatalog(ctx context.Context, req *info_resource_catalog.EsSearchParam) (res *info_resource_catalog.EsSearchResult, err error) {
	ctx, span := trace.StartInternalSpan(ctx)
	defer span.End()
	url := fmt.Sprintf("%s/api/basic-search/v1/info-catalog/search", settings.GetConfig().BasicSearchHost)
	res, err = base.Call[*info_resource_catalog.EsSearchResult](ctx, r.rawHttpClient, http.MethodPost, url, req)
	return
}

// SearchElecLicence 搜索电子证照
func (r *repo) SearchElecLicence(ctx context.Context, req *basic_search.SearchElecLicenceRequest) (resp *basic_search.SearchElecLicenceResponse, err error) {
	ctx, span := trace.StartInternalSpan(ctx)
	defer span.End()

	log := log.WithContext(ctx)

	headers := map[string]string{"Content-Time": "application/json"}

	log.Info("basic-search search elec-licence", zap.Any("request", req))

	urlStr := fmt.Sprintf("%s/api/basic-search/v1/elec-license/search", settings.GetConfig().BasicSearchHost)
	code, response, err := r.httpclient.Post(ctx, urlStr, headers, req)
	if err != nil {
		log.Error("send request fail", zap.String("url", urlStr), zap.String("method", http.MethodPost), zap.Any("body", req))
		return nil, newErrorCode(err)
	}

	if code != http.StatusOK {
		log.Error("basic-search search elec-licence return unsupported status code", zap.Int("statusCode", code), zap.Any("body", req))
		return nil, errorcode.Detail(errorcode.PublicInternalError, fmt.Sprintf("unsupported basic-search status code: %d, body: %v", code, response))
	}

	bytes, err := json.Marshal(response)
	if err != nil {
		log.Error("encode basic-search response as json fail", zap.Error(err), zap.Any("response", response))
		return nil, errorcode.Detail(errorcode.PublicInternalError, err.Error())
	}

	log.Info("basic-search search data-resource", zap.ByteString("response", bytes))

	if err := json.Unmarshal(bytes, &resp); err != nil {
		log.Error("decode basic-search response as json fail", zap.Error(err), zap.ByteString("response", bytes))
		return nil, errorcode.Detail(errorcode.PublicInternalError, err.Error())
	}

	return resp, nil
}
