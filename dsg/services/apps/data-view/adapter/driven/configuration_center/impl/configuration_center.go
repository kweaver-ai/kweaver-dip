package impl

import (
	"context"
	"fmt"
	"io"
	"net/http"
	"strings"

	jsoniter "github.com/json-iterator/go"
	"github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/configuration_center"
	"github.com/kweaver-ai/dsg/services/apps/data-view/common/errorcode"
	pconfig "github.com/kweaver-ai/dsg/services/apps/data-view/infrastructure/config"
	code "github.com/kweaver-ai/idrm-go-common/errorcode"
	"github.com/kweaver-ai/idrm-go-common/interception"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"go.uber.org/zap"
)

type ConfigurationCenterCall struct {
	baseURL       string
	RawHttpClient *http.Client
}

func NewConfigurationCenterCall(rawHttpClient *http.Client, bc *pconfig.Bootstrap) configuration_center.ObjectSearch {
	return &ConfigurationCenterCall{baseURL: bc.DepServices.ConfigurationCenterHost, RawHttpClient: rawHttpClient}
}

func (c ConfigurationCenterCall) GetInfoSystemDetail(ctx context.Context, infoSystemId string) (*configuration_center.GetInfoSystemRes, error) {
	errorMsg := "DrivenConfigurationCenter GetInfoSystem "
	urlStr := fmt.Sprintf("%s/api/configuration-center/v1/info-system/%s", c.baseURL, infoSystemId)

	request, _ := http.NewRequest(http.MethodGet, urlStr, nil)
	request.Header.Set("Authorization", ctx.Value(interception.Token).(string))
	resp, err := c.RawHttpClient.Do(request.WithContext(ctx))
	if err != nil {
		log.Error(errorMsg+"client.Do error", zap.Error(err))
		return nil, code.Detail(errorcode.GetInfoSystemDetail, err.Error())
	}
	defer resp.Body.Close()
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		log.Error(errorMsg+"io.ReadAll", zap.Error(err))
		return nil, code.Detail(errorcode.GetInfoSystemDetail, err.Error())
	}
	if resp.StatusCode != http.StatusOK {
		log.Error(errorMsg+" json.Unmarshal error", zap.Error(err))
		return nil, code.Detail(errorcode.GetInfoSystemDetail, err.Error())
	}

	res := &configuration_center.GetInfoSystemRes{}
	if err = jsoniter.Unmarshal(body, res); err != nil {
		log.Error(errorMsg+" json.Unmarshal error", zap.Error(err))
		return nil, code.Detail(errorcode.GetInfoSystemDetail, err.Error())
	}
	return res, nil
}

func (c ConfigurationCenterCall) GetInfoSystemsBatch(ctx context.Context, ids []string) ([]*configuration_center.GetInfoSystemByIdsRes, error) {
	errorMsg := "DrivenConfigurationCenter GetInfoSystemsPrecision "
	urlStr := fmt.Sprintf("%s/api/configuration-center/v1/info-system/precision", c.baseURL)

	params := make([]string, 0, len(ids))
	for _, id := range ids {
		params = append(params, "ids="+id)
	}
	if len(params) > 0 {
		urlStr = urlStr + "?" + strings.Join(params, "&")
	}

	request, _ := http.NewRequest(http.MethodGet, urlStr, nil)
	request.Header.Set("Authorization", ctx.Value(interception.Token).(string))
	resp, err := c.RawHttpClient.Do(request.WithContext(ctx))
	if err != nil {
		log.Error(errorMsg+"client.Do error", zap.Error(err))
		return nil, code.Detail(errorcode.GetInfoSystemDetail, err.Error())
	}
	defer resp.Body.Close()
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		log.Error(errorMsg+"io.ReadAll", zap.Error(err))
		return nil, code.Detail(errorcode.GetInfoSystemDetail, err.Error())
	}
	if resp.StatusCode != http.StatusOK {
		log.Error(errorMsg+"http status error", zap.String("status", resp.Status))
		return nil, code.Desc(errorcode.GetInfoSystemDetail)
	}

	var res []*configuration_center.GetInfoSystemByIdsRes
	if err = jsoniter.Unmarshal(body, &res); err != nil {
		log.Error(errorMsg+" json.Unmarshal error", zap.Error(err))
		return nil, code.Detail(errorcode.GetInfoSystemDetail, err.Error())
	}
	return res, nil
}

func (c ConfigurationCenterCall) GetInfoSystemNameBatch(ctx context.Context, ids []string) (map[string]string, error) {
	result := make(map[string]string)
	if len(ids) <= 0 {
		return result, nil
	}
	infos, err := c.GetInfoSystemsBatch(ctx, ids)
	if err != nil {
		return nil, err
	}
	for i := range infos {
		result[infos[i].ID] = infos[i].Name
	}
	return result, nil
}

func (c ConfigurationCenterCall) GetStatusCheck(ctx context.Context) (string, error) {
	errorMsg := "DrivenConfigurationCenter GetStatusCheck "
	urlStr := fmt.Sprintf("%s/api/configuration-center/v1/grade-label/status", c.baseURL)

	request, err := http.NewRequest(http.MethodGet, urlStr, nil)
	if err != nil {
		log.Error(errorMsg+"http.NewRequest error", zap.Error(err))
		return "", code.Detail(errorcode.GetInfoSystemDetail, "failed to create request: "+err.Error())
	}
	if tokenVal := ctx.Value(interception.Token); tokenVal != nil {
		if tokenStr, ok := tokenVal.(string); ok && tokenStr != "" {
			request.Header.Set("Authorization", tokenStr)
		} else {
			// 根据需要处理 token 不存在或类型错误的情况
			log.Error("GetStatusCheck: token 不存在或类型错误")
			return "", code.Detail(errorcode.GetStatusCheck, "token 不存在或类型错误")

		}
	} else {
		// 根据需要处理 token 不存在的情况
		log.Error("GetStatusCheck: token 不存在或类型错误")
		return "", code.Detail(errorcode.GetStatusCheck, "token 不存在或类型错误")
	}
	resp, err := c.RawHttpClient.Do(request.WithContext(ctx))
	if err != nil {
		log.Error(errorMsg+"client.Do error", zap.Error(err))
		return "", code.Detail(errorcode.GetStatusCheck, err.Error())
	}
	defer resp.Body.Close()
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		log.Error(errorMsg+"io.ReadAll", zap.Error(err))
		return "", code.Detail(errorcode.GetStatusCheck, err.Error())
	}
	if resp.StatusCode != http.StatusOK {
		errMsg := fmt.Sprintf("received non-OK HTTP status: %s, body: %s", resp.Status, string(body))
		log.Error(errorMsg+"http status error", zap.String("status", resp.Status), zap.ByteString("body", body))
		return "", code.Detail(errorcode.GetStatusCheck, errMsg)
	}
	return string(body), nil
}
