package deploy_management

import (
	"context"
	"fmt"
	"net/http"

	"github.com/kweaver-ai/idrm-go-common/rest/base"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"

	"github.com/kweaver-ai/dsg/services/apps/session/adapter/driven/http_client"
	"github.com/kweaver-ai/dsg/services/apps/session/common/settings"
)

type deployMgm struct {
	baseURL    string
	httpClient http_client.HTTPClient
}

func NewDeployMgm(httpClient http_client.HTTPClient) DrivenDeployMgm {
	return &deployMgm{
		baseURL:    settings.ConfigInstance.Config.DepServices.DeployMgm,
		httpClient: httpClient,
	}
}
func (d *deployMgm) GetHost(ctx context.Context) (*GetHostRes, error) {
	res, err := d.httpClient.Get(ctx, fmt.Sprintf("%s/api/deploy-manager/v1/access-addr/app", d.baseURL), nil)
	if err != nil {
		return nil, err
	}
	return &GetHostRes{
		Host:   res.(map[string]interface{})["host"].(string),
		Port:   res.(map[string]interface{})["port"].(string),
		Scheme: res.(map[string]interface{})["scheme"].(string),
	}, nil
}
func GetHost(ctx context.Context) (*GetHostRes, error) {
	res, err := http_client.NewHTTPClient().Get(ctx, fmt.Sprintf("%s/api/deploy-manager/v1/access-addr/app", settings.ConfigInstance.Config.DepServices.DeployMgm), nil)
	if err != nil {
		return nil, err
	}
	return &GetHostRes{
		Host:   res.(map[string]interface{})["host"].(string),
		Port:   res.(map[string]interface{})["port"].(string),
		Scheme: res.(map[string]interface{})["scheme"].(string),
	}, nil
}

func (d *deployMgm) GetLoginConfig(ctx context.Context, host string) (*LoginConfig, error) {
	errorMsg := "deployMgm GetLoginConfig"
	url := host + "/api/eacp/v1/auth1/login-configs"
	res := &LoginConfig{}
	log.Infof(errorMsg+" url:%s \n ", url)
	err := base.CallInternal(ctx, d.httpClient.GetRawClient(), errorMsg, http.MethodGet, url, nil, res)
	if err != nil {
		return res, err
	}
	return res, nil
}
