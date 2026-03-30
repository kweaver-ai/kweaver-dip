package impl

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/driven/interface_svc"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/settings"
	"github.com/kweaver-ai/idrm-go-common/interception"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/kweaver-ai/idrm-go-frame/core/utils/httpclient"
)

type Repo struct {
	client httpclient.HTTPClient
}

func NewRepo(client httpclient.HTTPClient) interface_svc.InterfaceSvc {
	return &Repo{client: client}
}

func (r *Repo) ServiceListByCodes(ctx context.Context, codes []string) (*interface_svc.Res, error) {
	host := settings.GetConfig().InterfaceSvcHost
	url := fmt.Sprintf("%s/api/data-application-service/v1/services/batch", host)
	headers := map[string]string{
		"Content-Time":  "application/json",
		"Authorization": ctx.Value(interception.Token).(string),
	}
	body := map[string]any{"codes": codes}
	var resp *interface_svc.Res
	_, response, err := r.client.Post(ctx, url, headers, body)
	if err != nil {
		log.WithContext(ctx).Errorf("failed to req /api/data-application-service/v1/services/batch, err info: %v", err.Error())
		return resp, nil
	}
	bytes, _ := json.Marshal(response)
	log.WithContext(ctx).Infof("list services by codes succeed, response: %v", string(bytes))
	_ = json.Unmarshal(bytes, &resp)
	return resp, nil
}
