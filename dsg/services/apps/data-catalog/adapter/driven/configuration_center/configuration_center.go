package configuration_center

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strconv"
	"strings"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/settings"
	"github.com/kweaver-ai/idrm-go-common/access_control"
	"github.com/kweaver-ai/idrm-go-common/interception"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/trace"
)

type DrivenConfigurationCenter interface {
	HasAccessPermission(ctx context.Context, accessType access_control.AccessType, resource access_control.Resource) (bool, error)
}
type configurationCenter struct {
	httpClient *http.Client
	url        string
}

func NewConfigurationCenter(httpClient *http.Client) DrivenConfigurationCenter {
	return &configurationCenter{httpClient: httpClient, url: settings.GetConfig().DepServicesConf.ConfigCenterHost}
}
func (c *configurationCenter) HasAccessPermission(ctx context.Context, accessType access_control.AccessType, resource access_control.Resource) (bool, error) {
	var err error
	ctx, span := trace.StartInternalSpan(ctx)
	defer func() { trace.TelemetrySpanEnd(span, err) }()

	urlStr := fmt.Sprintf("%s/api/configuration-center/v1/access-control", c.url)
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
	request, _ := http.NewRequestWithContext(ctx, "GET", urlStr, nil)
	request.Header.Set("Authorization", ctx.Value(interception.Token).(string))
	resp, err := c.httpClient.Do(request)
	if err != nil {
		log.WithContext(ctx).Errorf("DrivenConfigurationCenter HasAccessPermission client.Do error, %v", err)
		return false, errorcode.Detail(errorcode.GetAccessPermissionError, err)
	}
	defer func() {
		_ = resp.Body.Close()
	}()
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		log.WithContext(ctx).Errorf("DrivenConfigurationCenter HasAccessPermission io.ReadAll error, %v", err)
		return false, errorcode.Detail(errorcode.GetAccessPermissionError, err)
	}
	var has bool
	if resp.StatusCode != http.StatusOK {
		return false, nil
	}
	if err = json.Unmarshal(body, &has); err != nil {
		log.WithContext(ctx).Errorf("DrivenConfigurationCenter HasAccessPermission json.Unmarshal error, %v", err)
		return false, errorcode.Detail(errorcode.GetAccessPermissionError, err)
	}
	return has, nil
}
