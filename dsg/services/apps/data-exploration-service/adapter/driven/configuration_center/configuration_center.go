package configuration_center

import (
	"context"
	"fmt"
	"strconv"
	"strings"

	"github.com/jinzhu/copier"
	"github.com/kweaver-ai/dsg/services/apps/data-exploration-service/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-exploration-service/common/settings"
	"github.com/kweaver-ai/idrm-go-common/access_control"
	"github.com/kweaver-ai/idrm-go-common/interception"
	log "github.com/kweaver-ai/idrm-go-frame/core/logx/zapx"
	"github.com/kweaver-ai/idrm-go-frame/core/utils/httpclient"
	"go.uber.org/zap"
)

type ConfigurationCenter struct {
	baseURL       string
	RawHttpClient httpclient.HTTPClient
}

func NewConfigurationCenter(rawHttpClient httpclient.HTTPClient) DrivenConfigurationCenter {
	ccHost := settings.GetConfig().DepServicesConf.ConfigCenterHost
	return &ConfigurationCenter{baseURL: ccHost, RawHttpClient: rawHttpClient}
}

func (c *ConfigurationCenter) HasAccessPermission(ctx context.Context, accessType access_control.AccessType, resource access_control.Resource) (bool, error) {
	urlStr := fmt.Sprintf("http://%s/api/configuration-center/v1/access-control", c.baseURL)
	query := map[string]string{
		"access_type": strconv.Itoa(int(accessType.ToInt32())),
		"resource":    strconv.Itoa(int(resource.ToInt32())),
	}
	params := make([]string, 0, len(query))
	for k, v := range query {
		params = append(params, k+"="+v)
	}
	if len(params) > 0 {
		urlStr = urlStr + "?" + strings.Join(params, "&")
	}

	//request, _ := http.NewRequest("GET", urlStr, nil)
	//request.Header.Set("Authorization", ctx.Value(interception.Token).(string))

	header := map[string]string{
		"Authorization": ctx.Value(interception.Token).(string),
	}

	resp, err := c.RawHttpClient.Get(ctx, urlStr, header)
	if err != nil {
		log.Error("DrivenConfigurationCenter HasAccessPermission client.Do error", zap.Error(err))
		return false, errorcode.Detail(errorcode.GetAccessPermissionError, err)
	}

	return resp.(bool), nil

	//body, err := io.ReadAll(resp.Body)
	//if err != nil {
	//	log.Error("DrivenConfigurationCenter HasAccessPermission io.ReadAll error", zap.Error(err))
	//	return false, errorcode.Detail(errorcode.GetAccessPermissionError, err)
	//}
	//var has bool
	//if resp.StatusCode == http.StatusOK {
	//	err = jsoniter.Unmarshal(body, &has)
	//	if err != nil {
	//		log.Error("DrivenConfigurationCenter HasAccessPermission jsoniter.Unmarshal error", zap.Error(err))
	//		return false, errorcode.Detail(errorcode.GetAccessPermissionError, err)
	//	}
	//	return has, nil
	//}
	//return false, nil
}

func (c *ConfigurationCenter) GetStandardizationAddr(ctx context.Context, token string) (string, error) {
	return c.getThirdPartyAddr(ctx, token, "Standardization")
}

func (c *ConfigurationCenter) getThirdPartyAddr(ctx context.Context, token string, thirdPartyName string) (string, error) {
	url := fmt.Sprintf("%s/api/configuration-center/v1/third_party_addr?name=%s", c.baseURL, thirdPartyName)
	resp, err := c.RawHttpClient.Get(ctx, url, map[string]string{"Authorization": token})
	if err != nil {
		log.Errorf("DrivenConfigurationCenter getThirdPartyAddr client.Do error, %v", err)
		return "", errorcode.Detail(errorcode.PublicInternalError, err)
	}

	m := make([]map[string]any, 0)
	if err = copier.Copy(&m, resp); err != nil {
		log.Error(err.Error())
		return "", errorcode.Detail(errorcode.PublicInternalError, err)
	}

	return m[0]["addr"].(string), nil
}
