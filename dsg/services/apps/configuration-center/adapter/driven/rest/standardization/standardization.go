package standardization

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/settings"
	"github.com/kweaver-ai/idrm-go-common/interception"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest/ginx"
	"go.uber.org/zap"
)

var (
	d *driven
)

type driven struct {
	httpClient *http.Client
}

func NewStandardization(httpClient *http.Client) Standardization {
	return &driven{
		httpClient: httpClient,
	}
}

func (d *driven) DeleteLabelIds(ctx context.Context, ids string) (bool, error) {
	url := fmt.Sprintf("http://%s/api/standardization/v1/dataelement/labelIds/%s", settings.ConfigInstance.Config.DepServices.StandardizationHost, ids)
	//url := fmt.Sprintf("https://%s/api/standardization/v1/dataelement/labelIds/%s", "10.4.109.175", ids)
	req, err := http.NewRequest(http.MethodDelete, url, nil)
	if err != nil {
		return false, err
	}
	req.Header.Set("Authorization", ctx.Value(interception.Token).(string))
	//req.Header.Set("Authorization", "Bearer ory_at_DXabALKQXEDY8V8no22tpfxHc4K0vnd8OwUqrD9AUnA.6XETGTpl6Q8N_mXfdaIeU42N3BWrCoVoPulGKREOcSk")
	resp, err := d.httpClient.Do(req)
	if err != nil {
		log.WithContext(ctx).Error("DeleteLabelIds failed", zap.Error(err), zap.String("url", url))
		return false, err
	}
	// 延时关闭
	defer resp.Body.Close()

	// 返回的结果resp.Body
	body, err := io.ReadAll(resp.Body)
	if resp.StatusCode != http.StatusOK {
		log.WithContext(ctx).Error("CheckMainBusinessRepeat read body", zap.Error(err))
		if resp.StatusCode == http.StatusBadRequest {
			res := new(ginx.HttpError)
			_ = json.Unmarshal(body, res)
			if res.Code == "BusinessGrooming.Model.NameAlreadyExist" {
				return true, errorcode.Desc(errorcode.BusinessStructureObjectNameRepeat)
			}
		}
	}
	return false, nil
}
