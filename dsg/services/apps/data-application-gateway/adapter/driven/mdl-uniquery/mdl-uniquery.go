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
		client: af_trace.NewOTELHttpClientParam(time.Minute*15, &http.Transport{
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
	var err error
	if statusCode == http.StatusBadRequest || statusCode == http.StatusInternalServerError || statusCode == http.StatusUnauthorized || statusCode == http.StatusForbidden {
		res := new(DIPErrorCode)
		if err := jsoniter.Unmarshal(body, res); err != nil {
			log.Error(errorMsg+"400 error jsoniter.Unmarshal", zap.Error(err))
			return err
		}
		log.Error(errorMsg+"400 error", zap.String("code", res.ErrorCode), zap.String("description", res.Description))
		return err
		// return errorcode.New(res.ErrorCode, res.ErrorCode+res.Description, res.Description, res.Solution, res.ErrorDetails, res.ErrorLink)
	} else {
		log.Error(errorMsg+"http status error", zap.Int("status", statusCode))
		return errors.New("http status error: " + strconv.Itoa(statusCode))
	}
}

func (m MDLUniQuery) QueryData(ctx context.Context, ids string, body QueryDataBody) (*QueryDataResult, error) {
	var err error
	const drivenMsg = "MDLUniQuery QueryData"
	jsonReq, err := jsoniter.Marshal(body)
	if err != nil {
		log.WithContext(ctx).Error(drivenMsg+" jsoniter.Marshal error", zap.Error(err))
		return nil, err
		// return nil, errorcode.Detail(errorcode.DrivenMDLUQQueryDataError, err.Error())
	}
	url := fmt.Sprintf("%s/api/mdl-uniquery/in/v1/data-views/%s", m.baseURL, ids)
	request, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewReader(jsonReq))
	if err != nil {
		log.WithContext(ctx).Error(drivenMsg+" http.NewRequestWithContext error", zap.Error(err))
		// return nil, errorcode.Detail(errorcode.DrivenMDLUQQueryDataError, err.Error())
		return nil, err
	}
	// userInfo, err := util.GetUserInfo(ctx)
	// if err != nil {
	// 	return nil, err
	// }
	// userType := "user"
	// if userInfo.UserType == interception.TokenTypeClient {
	// 	userType = "app"
	// }
	request.Header.Set("Content-Type", "application/json")
	request.Header.Set("X-HTTP-Method-Override", "GET")
	// request.Header.Set("x-account-id", userInfo.ID)
	// request.Header.Set("x-account-type", userType)

	request.Header.Set("x-account-id", "ad340106-8ce6-4cc9-8ed0-5aa43fc30a6b")
	request.Header.Set("x-account-type", "app")

	log.Info(drivenMsg+"request", zap.String("url", url), zap.String("req body", string(jsonReq)))

	resp, err := m.client.Do(request)
	if err != nil {
		log.WithContext(ctx).Error(drivenMsg+" http.DefaultClient.Do error", zap.Error(err))
		return nil, err
		// return nil, errorcode.Detail(errorcode.DrivenMDLUQQueryDataError, err.Error())
	}
	defer resp.Body.Close()

	resBody, err := io.ReadAll(resp.Body)
	if err != nil {
		log.WithContext(ctx).Error(drivenMsg+" io.ReadAll error", zap.Error(err))
		// return nil, errorcode.Detail(errorcode.DrivenMDLUQQueryDataError, err.Error())
		return nil, err
	}

	log.Info(drivenMsg+"response", zap.String("body", string(resBody)), zap.String("url", url), zap.Int("statusCode", resp.StatusCode))

	if resp.StatusCode != http.StatusOK {
		return nil, StatusCodeNotOK(drivenMsg, resp.StatusCode, resBody)
	}

	result := &QueryDataResult{}
	if err = jsoniter.Unmarshal(resBody, result); err != nil {
		log.WithContext(ctx).Error(drivenMsg+" json.Unmarshal error", zap.Error(err))
		return nil, err
		// return nil, errorcode.Detail(errorcode.DrivenMDLUQQueryDataError, err.Error())
	}

	return result, nil
}
