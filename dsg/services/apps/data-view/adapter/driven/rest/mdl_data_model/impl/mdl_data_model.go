package impl

import (
	"bytes"
	"context"
	"crypto/tls"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strconv"
	"time"

	"github.com/kweaver-ai/idrm-go-common/errorcode"
	"github.com/kweaver-ai/idrm-go-common/interception"
	"github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/rest/mdl_data_model"
	my_errorcode "github.com/kweaver-ai/dsg/services/apps/data-view/common/errorcode"
	my_config "github.com/kweaver-ai/dsg/services/apps/data-view/infrastructure/config"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	af_trace "github.com/kweaver-ai/idrm-go-frame/core/telemetry/trace"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest"
	jsoniter "github.com/json-iterator/go"
	"go.uber.org/zap"
)

const (
	// getDataViewsPageSize 单次拉取视图列表条数
	getDataViewsPageSize = 1000
)

type MdlDataModel struct {
	baseURL         string
	uniqueryBaseUrl string
	HttpClient      *http.Client
}

func NewMdlDataModel(conf *my_config.Bootstrap, httpClient *http.Client) mdl_data_model.DrivenMdlDataModel {
	return &MdlDataModel{
		baseURL:         conf.DepServices.MdlDataModelHost,
		uniqueryBaseUrl: conf.DepServices.MdlUniqueryHost,
		HttpClient:      httpClient,
	}
}

// GetDataViews 按页获取 mdl-data-model 视图列表，可按 data_source_id 过滤
func (m *MdlDataModel) GetDataViews(ctx context.Context, updateTimeStart int64, dataSourceId string, offset, limit int) (*mdl_data_model.GetDataViewsResp, error) {
	drivenMsg := "DrivenMdlDataModel GetDataViews "
	base := fmt.Sprintf("%s/api/mdl-data-model/in/v1/data-views", m.baseURL)
	if m.HttpClient == nil {
		log.WithContext(ctx).Error(drivenMsg + "http client is nil")
		return nil, errorcode.Detail(my_errorcode.MdlGetViewsError, "http client is nil")
	}
	if limit <= 0 || limit > getDataViewsPageSize {
		limit = getDataViewsPageSize
	}

	u, err := url.Parse(base)
	if err != nil {
		log.WithContext(ctx).Error(drivenMsg+"url.Parse error", zap.Error(err))
		return nil, errorcode.Detail(my_errorcode.MdlGetViewsError, err.Error())
	}
	q := u.Query()
	q.Set("type", "atomic")
	q.Set("limit", strconv.Itoa(limit))
	q.Set("offset", strconv.Itoa(offset))
	//if updateTimeStart > 0 {
	//	q.Set("update_time_start", strconv.FormatInt(updateTimeStart, 10))
	//}
	if dataSourceId != "" {
		q.Set("data_source_id", dataSourceId)
	}
	u.RawQuery = q.Encode()
	urlStr := u.String()

	request, err := http.NewRequestWithContext(ctx, http.MethodGet, urlStr, nil)
	if err != nil {
		log.WithContext(ctx).Error(drivenMsg+"http.NewRequest error", zap.Error(err))
		return nil, errorcode.Detail(my_errorcode.MdlGetViewsError, err.Error())
	}
	request.Header.Add("x-account-id", "266c6a42-6131-4d62-8f39-853e7093701c")
	request.Header.Add("x-account-type", "user")

	resp, err := m.HttpClient.Do(request)
	if err != nil {
		log.WithContext(ctx).Error(drivenMsg+"client.Do error", zap.Error(err))
		return nil, errorcode.Detail(my_errorcode.MdlGetViewsError, err.Error())
	}
	if resp == nil || resp.Body == nil {
		log.WithContext(ctx).Error(drivenMsg + "response or response body is nil")
		return nil, errorcode.Detail(my_errorcode.MdlGetViewsError, "response or response body is nil")
	}
	body, err := io.ReadAll(resp.Body)
	resp.Body.Close()
	if err != nil {
		log.WithContext(ctx).Error(drivenMsg+" io.ReadAll error", zap.Error(err))
		return nil, errorcode.Detail(my_errorcode.MdlGetViewsError, err.Error())
	}
	if resp.StatusCode != http.StatusOK {
		if resp.StatusCode == http.StatusBadRequest || resp.StatusCode == http.StatusInternalServerError || resp.StatusCode == http.StatusUnauthorized || resp.StatusCode == http.StatusForbidden {
			return nil, Unmarshal(ctx, body, drivenMsg)
		}
		log.WithContext(ctx).Error(drivenMsg+"http status error", zap.String("status", resp.Status), zap.String("body", string(body)))
		return nil, errorcode.Desc(my_errorcode.MdlGetViewsError, resp.StatusCode)
	}

	var page mdl_data_model.GetDataViewsResp
	if err = jsoniter.Unmarshal(body, &page); err != nil {
		log.WithContext(ctx).Error(drivenMsg+" jsoniter.Unmarshal error", zap.Error(err))
		return nil, errorcode.Detail(my_errorcode.MdlGetViewsError, err.Error())
	}
	return &page, nil
}

func (m *MdlDataModel) GetDataView(ctx context.Context, viewIds []string) ([]*mdl_data_model.GetDataViewResp, error) {
	drivenMsg := "DrivenMdlDataModel GetDataView "
	urlStr := fmt.Sprintf("%s/api/mdl-data-model/in/v1/data-views", m.baseURL)
	bodyReq := map[string][]string{
		"view_ids": viewIds,
	}
	jsonReq, err := jsoniter.Marshal(bodyReq)
	if err != nil {
		log.WithContext(ctx).Error(drivenMsg+" jsoniter.Marshal error", zap.Error(err))
		return nil, err
	}
	log.WithContext(ctx).Infof("%s url=%s, viewIdsLen=%d", drivenMsg, urlStr, len(viewIds))
	request, err := http.NewRequestWithContext(ctx, http.MethodPost, urlStr, bytes.NewReader(jsonReq))
	if err != nil {
		log.WithContext(ctx).Error(drivenMsg+"http.NewRequest error", zap.Error(err))
		return nil, errorcode.Detail(my_errorcode.MdlGetViewsError, err.Error())
	}
	request.Header.Add("x-http-method-override", "GET")
	request.Header.Add("x-account-id", "266c6a42-6131-4d62-8f39-853e7093701c")
	request.Header.Add("x-account-type", "user")
	request.Header.Set("Content-Type", "application/json")
	if m.HttpClient == nil {
		log.WithContext(ctx).Error(drivenMsg + "http client is nil")
		return nil, errorcode.Detail(my_errorcode.MdlGetViewsError, "http client is nil")
	}
	resp, err := m.HttpClient.Do(request)
	if err != nil {
		log.WithContext(ctx).Error(drivenMsg+"client.Do error", zap.Error(err))
		return nil, errorcode.Detail(my_errorcode.MdlGetViewsError, err.Error())
	}
	if resp == nil || resp.Body == nil {
		log.WithContext(ctx).Error(drivenMsg + "response or response body is nil")
		return nil, errorcode.Detail(my_errorcode.MdlGetViewsError, "response or response body is nil")
	}
	defer resp.Body.Close()
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		log.WithContext(ctx).Error(drivenMsg+" io.ReadAll error", zap.Error(err))
		return nil, errorcode.Detail(my_errorcode.MdlGetViewsError, err.Error())
	}
	if resp.StatusCode == http.StatusOK {
		var res []*mdl_data_model.GetDataViewResp
		if err = jsoniter.Unmarshal(body, &res); err != nil {
			log.WithContext(ctx).Error(drivenMsg+" jsoniter.Unmarshal error", zap.Error(err))
			return nil, errorcode.Detail(my_errorcode.MdlGetViewsError, err.Error())
		}
		return res, nil
	} else {
		if resp.StatusCode == http.StatusBadRequest || resp.StatusCode == http.StatusInternalServerError || resp.StatusCode == http.StatusUnauthorized || resp.StatusCode == http.StatusForbidden {
			return nil, Unmarshal(ctx, body, drivenMsg)
		} else {
			log.WithContext(ctx).Error(drivenMsg+"http status error", zap.String("status", resp.Status), zap.String("body", string(body)))
			return nil, errorcode.Desc(my_errorcode.MdlGetViewsError, resp.StatusCode)
		}
	}
}

func (m *MdlDataModel) UpdateDataView(ctx context.Context, viewId string, view *mdl_data_model.UpdateDataView) ([]*mdl_data_model.GetDataViewResp, error) {
	drivenMsg := "DrivenMdlDataModel GetDataView "
	urlStr := fmt.Sprintf("%s/api/mdl-data-model/v1/data-views/%s/attrs/name,comment,fields", m.baseURL, viewId)
	jsonReq, err := jsoniter.Marshal(view)
	if err != nil {
		log.WithContext(ctx).Error(drivenMsg+" jsoniter.Marshal error", zap.Error(err))
		return nil, err
	}
	log.WithContext(ctx).Infof("drivenMsg :%s,urlStr :%s,jsonReq :%s,", drivenMsg, urlStr, jsonReq)
	request, err := http.NewRequestWithContext(ctx, http.MethodPut, urlStr, bytes.NewReader(jsonReq))
	if err != nil {
		log.WithContext(ctx).Error(drivenMsg+"http.NewRequest error", zap.Error(err))
		return nil, errorcode.Detail(my_errorcode.MdlUpdateViewError, err.Error())
	}
	request.Header.Set("Authorization", ctx.Value(interception.Token).(string))
	request.Header.Set("Content-Type", "application/json")
	resp, err := m.HttpClient.Do(request)
	if err != nil {
		log.WithContext(ctx).Error(drivenMsg+"client.Do error", zap.Error(err))
		return nil, errorcode.Detail(my_errorcode.MdlUpdateViewError, err.Error())
	}

	defer resp.Body.Close()
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		log.WithContext(ctx).Error(drivenMsg+" io.ReadAll error", zap.Error(err))
		return nil, errorcode.Detail(my_errorcode.MdlUpdateViewError, err.Error())
	}
	if resp.StatusCode == http.StatusNoContent {
		// var res []*mdl_data_model.GetDataViewResp
		// if err = jsoniter.Unmarshal(body, &res); err != nil {
		// 	log.WithContext(ctx).Error(drivenMsg+" jsoniter.Unmarshal error", zap.Error(err))
		// 	return nil, errorcode.Detail(my_errorcode.MdlUpdateViewError, err.Error())
		// }
		//return res, nil
		return nil, nil
	} else {
		if resp.StatusCode == http.StatusBadRequest || resp.StatusCode == http.StatusInternalServerError || resp.StatusCode == http.StatusUnauthorized || resp.StatusCode == http.StatusForbidden {
			return nil, Unmarshal(ctx, body, drivenMsg)
		} else {
			log.WithContext(ctx).Error(drivenMsg+"http status error", zap.String("status", resp.Status), zap.String("body", string(body)))
			return nil, errorcode.Desc(my_errorcode.MdlUpdateViewError, resp.StatusCode)
		}
	}
}

func (m *MdlDataModel) DeleteDataView(ctx context.Context, viewId string) error {
	drivenMsg := "DrivenMdlDataModel GetDataView "
	urlStr := fmt.Sprintf("%s/api/mdl-data-model/v1/data-views/%s", m.baseURL, viewId)
	request, err := http.NewRequestWithContext(ctx, http.MethodDelete, urlStr, nil)
	if err != nil {
		log.WithContext(ctx).Error(drivenMsg+"http.NewRequest error", zap.Error(err))
		return errorcode.Detail(my_errorcode.MdlDeleteViewError, err.Error())
	}
	request.Header.Set("Authorization", ctx.Value(interception.Token).(string))
	resp, err := m.HttpClient.Do(request)
	if err != nil {
		log.WithContext(ctx).Error(drivenMsg+"client.Do error", zap.Error(err))
		return errorcode.Detail(my_errorcode.MdlDeleteViewError, err.Error())
	}

	defer resp.Body.Close()
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		log.WithContext(ctx).Error(drivenMsg+" io.ReadAll error", zap.Error(err))
		return errorcode.Detail(my_errorcode.MdlDeleteViewError, err.Error())
	}
	if resp.StatusCode == http.StatusNoContent {
		return nil
	} else {
		if resp.StatusCode == http.StatusBadRequest || resp.StatusCode == http.StatusInternalServerError || resp.StatusCode == http.StatusUnauthorized || resp.StatusCode == http.StatusForbidden {
			return Unmarshal(ctx, body, drivenMsg)
		} else {
			log.WithContext(ctx).Error(drivenMsg+"http status error", zap.String("status", resp.Status), zap.String("body", string(body)))
			return errorcode.Desc(my_errorcode.MdlDeleteViewError, resp.StatusCode)
		}
	}
}

func Unmarshal(ctx context.Context, body []byte, drivenMsg string) error {
	var res rest.HttpError
	if err := jsoniter.Unmarshal(body, &res); err != nil {
		log.WithContext(ctx).Error(drivenMsg+" jsoniter.Unmarshal error", zap.Error(err))
		return errorcode.Detail(my_errorcode.DrivenMdlError, err.Error())
	}
	return errorcode.New(res.Code, res.Description, res.Cause, res.Solution, res.Detail, "")
}

func (m *MdlDataModel) QueryData(ctx context.Context, uid, ids string, body mdl_data_model.QueryDataBody) (*mdl_data_model.QueryDataResult, error) {
	const drivenMsg = "DrivenMdlDataModel QueryData"
	jsonReq, err := jsoniter.Marshal(body)
	if err != nil {
		log.WithContext(ctx).Error(drivenMsg+" jsoniter.Marshal error", zap.Error(err))
		return nil, errorcode.Detail(my_errorcode.DrivenMdlError, err.Error())
	}
	url := fmt.Sprintf("%s/api/mdl-uniquery/in/v1/data-views/%s?timeout=2m", m.uniqueryBaseUrl, ids)
	request, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewReader(jsonReq))
	if err != nil {
		log.WithContext(ctx).Error(drivenMsg+" http.NewRequestWithContext error", zap.Error(err))
		return nil, errorcode.Detail(my_errorcode.DrivenMdlError, err.Error())
	}

	request.Header.Set("Content-Type", "application/json")
	request.Header.Set("X-HTTP-Method-Override", "GET")
	request.Header.Set("x-account-id", uid)
	request.Header.Set("x-account-type", "user")

	log.Info(drivenMsg+"request", zap.String("url", url), zap.String("req body", string(jsonReq)))

	client := af_trace.NewOTELHttpClientParam(3*time.Minute, &http.Transport{
		TLSClientConfig:       &tls.Config{InsecureSkipVerify: true},
		MaxIdleConnsPerHost:   25,
		MaxIdleConns:          25,
		IdleConnTimeout:       90 * time.Second,
		TLSHandshakeTimeout:   10 * time.Second,
		ExpectContinueTimeout: 1 * time.Second,
	})
	resp, err := client.Do(request)
	if err != nil {
		log.WithContext(ctx).Error(drivenMsg+" http.DefaultClient.Do error", zap.Error(err))
		return nil, errorcode.Detail(my_errorcode.DrivenMdlError, err.Error())
	}
	defer resp.Body.Close()

	resBody, err := io.ReadAll(resp.Body)
	if err != nil {
		log.WithContext(ctx).Error(drivenMsg+" io.ReadAll error", zap.Error(err))
		return nil, errorcode.Detail(my_errorcode.DrivenMdlError, err.Error())
	}

	log.Info(drivenMsg+"response", zap.String("body", string(resBody)), zap.String("url", url), zap.Int("statusCode", resp.StatusCode))

	if resp.StatusCode != http.StatusOK {
		log.WithContext(ctx).Error(drivenMsg+" resp.StatusCode != http.StatusOK ", zap.Any("ERROR", err))
		return nil, errorcode.Detail(my_errorcode.DrivenMdlError, "status code error")
	}

	result := &mdl_data_model.QueryDataResult{}
	if err = jsoniter.Unmarshal(resBody, result); err != nil {
		log.WithContext(ctx).Error(drivenMsg+" json.Unmarshal error", zap.Error(err))
		return nil, errorcode.Detail(my_errorcode.DrivenMdlError, err.Error())
	}

	return result, nil
}
