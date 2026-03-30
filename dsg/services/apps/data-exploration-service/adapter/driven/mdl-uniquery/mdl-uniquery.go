package mdl_uniquery

import (
	"bytes"
	"context"
	"crypto/tls"
	"errors"
	"fmt"
	"io"
	"net/http"
	"strconv"
	"time"

	jsoniter "github.com/json-iterator/go"
	"github.com/kweaver-ai/dsg/services/apps/data-exploration-service/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-exploration-service/common/settings"
	"github.com/kweaver-ai/idrm-go-common/interception"
	"github.com/kweaver-ai/idrm-go-common/util"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	af_trace "github.com/kweaver-ai/idrm-go-frame/core/telemetry/trace"
	"go.uber.org/zap"
)

type MDLUniQuery struct {
	baseURL string
	client  *http.Client
}

func NewMDLUniQuery() DrivenMDLUniQuery {
	return &MDLUniQuery{
		baseURL: "http://mdl-uniquery-svc:13011",
		client: af_trace.NewOTELHttpClientParam(time.Second*time.Duration(settings.MDLUniQueryClientTimeOut), &http.Transport{
			TLSClientConfig:       &tls.Config{InsecureSkipVerify: true},
			MaxIdleConnsPerHost:   25,
			MaxIdleConns:          25,
			IdleConnTimeout:       90 * time.Second,
			TLSHandshakeTimeout:   10 * time.Second,
			ExpectContinueTimeout: 1 * time.Second,
		})}
}

type DIPErrorCode struct {
	ErrorCode    string      `json:"error_code"`
	Description  string      `json:"description"`
	Solution     string      `json:"solution"`
	ErrorLink    string      `json:"error_link"`
	ErrorDetails interface{} `json:"error_details"`
}

func StatusCodeNotOK(errorMsg string, statusCode int, body []byte) error {
	if statusCode == http.StatusBadRequest || statusCode == http.StatusInternalServerError || statusCode == http.StatusUnauthorized || statusCode == http.StatusForbidden {
		res := new(DIPErrorCode)
		if err := jsoniter.Unmarshal(body, res); err != nil {
			log.Error(errorMsg+"400 error jsoniter.Unmarshal", zap.Error(err))
			return err
		}
		log.Error(errorMsg+"400 error", zap.String("body", string(body)))
		return errors.New("MDLUniQuery error: " + string(body))
	} else {
		log.Error(errorMsg+"http status error", zap.Int("status", statusCode))
		return errors.New("http status error: " + strconv.Itoa(statusCode))
	}
}

func (m MDLUniQuery) QueryData(ctx context.Context, ids string, timeOut string, body QueryDataBody) (*QueryDataResult, error) {
	const drivenMsg = "MDLUniQuery QueryData"
	jsonReq, err := jsoniter.Marshal(body)
	if err != nil {
		log.WithContext(ctx).Error(drivenMsg+" jsoniter.Marshal error", zap.Error(err))
		return nil, errorcode.Detail(errorcode.DrivenMDLUQQueryDataError, err.Error())
	}
	url := fmt.Sprintf("%s/api/mdl-uniquery/in/v1/data-views/%s", m.baseURL, ids)
	if timeOut != "" {
		url = fmt.Sprintf("%s?time_out=%s", url, timeOut)
	}
	request, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewReader(jsonReq))
	if err != nil {
		log.WithContext(ctx).Error(drivenMsg+" http.NewRequestWithContext error", zap.Error(err))
		return nil, errorcode.Detail(errorcode.DrivenMDLUQQueryDataError, err.Error())
	}
	userInfo, err := util.GetUserInfo(ctx)
	if err != nil {
		return nil, err
	}
	userType := "user"
	if userInfo.UserType == interception.TokenTypeClient {
		userType = "app"
	}
	request.Header.Set("Content-Type", "application/json")
	request.Header.Set("X-HTTP-Method-Override", "GET")
	request.Header.Set("x-account-id", userInfo.ID)
	request.Header.Set("x-account-type", userType)

	log.Info(drivenMsg+"request", zap.String("url", url), zap.String("req body", string(jsonReq)))

	resp, err := m.client.Do(request)
	if err != nil {
		log.WithContext(ctx).Error(drivenMsg+" http.DefaultClient.Do error", zap.Error(err))
		return nil, errorcode.Detail(errorcode.DrivenMDLUQQueryDataError, err.Error())
	}
	defer resp.Body.Close()

	resBody, err := io.ReadAll(resp.Body)
	if err != nil {
		log.WithContext(ctx).Error(drivenMsg+" io.ReadAll error", zap.Error(err))
		return nil, errorcode.Detail(errorcode.DrivenMDLUQQueryDataError, err.Error())
	}

	log.Info(drivenMsg+"response", zap.String("body", string(resBody)), zap.String("url", url), zap.Int("statusCode", resp.StatusCode))

	if resp.StatusCode != http.StatusOK {
		log.WithContext(ctx).Error(drivenMsg+" resp.StatusCode != http.StatusOK ", zap.Any("ERROR", err))
		return nil, StatusCodeNotOK(drivenMsg, resp.StatusCode, resBody)
	}

	result := &QueryDataResult{}
	if err = jsoniter.Unmarshal(resBody, result); err != nil {
		log.WithContext(ctx).Error(drivenMsg+" json.Unmarshal error", zap.Error(err))
		return nil, errorcode.Detail(errorcode.DrivenMDLUQQueryDataError, err.Error())
	}

	return result, nil
}

func (m MDLUniQuery) QueryDataV2(ctx context.Context, uid, ids string, body QueryDataBody) (*QueryDataResult, error) {
	const drivenMsg = "MDLUniQuery QueryData"
	jsonReq, err := jsoniter.Marshal(body)
	if err != nil {
		log.WithContext(ctx).Error(drivenMsg+" jsoniter.Marshal error", zap.Error(err))
		return nil, errorcode.Detail(errorcode.DrivenMDLUQQueryDataError, err.Error())
	}

	timeOut := settings.MDLUniQueryClientTimeOut * 8 / 10
	url := fmt.Sprintf("%s/api/mdl-uniquery/in/v1/data-views/%s?timeout=%ds", m.baseURL, ids, timeOut)
	request, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewReader(jsonReq))
	if err != nil {
		log.WithContext(ctx).Error(drivenMsg+" http.NewRequestWithContext error", zap.Error(err))
		return nil, errorcode.Detail(errorcode.DrivenMDLUQQueryDataError, err.Error())
	}

	request.Header.Set("Content-Type", "application/json")
	request.Header.Set("X-HTTP-Method-Override", "GET")
	request.Header.Set("x-account-id", uid)
	request.Header.Set("x-account-type", "user")

	log.Info(drivenMsg+"request", zap.String("url", url), zap.String("req body", string(jsonReq)))

	resp, err := m.client.Do(request)
	if err != nil {
		log.WithContext(ctx).Error(drivenMsg+" http.DefaultClient.Do error", zap.Error(err))
		return nil, errorcode.Detail(errorcode.DrivenMDLUQQueryDataError, err.Error())
	}
	defer resp.Body.Close()

	resBody, err := io.ReadAll(resp.Body)
	if err != nil {
		log.WithContext(ctx).Error(drivenMsg+" io.ReadAll error", zap.Error(err))
		return nil, errorcode.Detail(errorcode.DrivenMDLUQQueryDataError, err.Error())
	}

	log.Info(drivenMsg+"response", zap.String("body", string(resBody)), zap.String("url", url), zap.Int("statusCode", resp.StatusCode))

	if resp.StatusCode != http.StatusOK {
		log.WithContext(ctx).Error(drivenMsg+" resp.StatusCode != http.StatusOK ", zap.Any("ERROR", err))
		return nil, StatusCodeNotOK(drivenMsg, resp.StatusCode, resBody)
	}

	result := &QueryDataResult{}
	if err = jsoniter.Unmarshal(resBody, result); err != nil {
		log.WithContext(ctx).Error(drivenMsg+" json.Unmarshal error", zap.Error(err))
		return nil, errorcode.Detail(errorcode.DrivenMDLUQQueryDataError, err.Error())
	}

	return result, nil
}
