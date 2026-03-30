package virtualization_engine

import (
	"bytes"
	"context"
	"crypto/tls"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"path"
	"time"

	af_trace "github.com/kweaver-ai/idrm-go-frame/core/telemetry/trace"

	"github.com/gin-gonic/gin"
	jsoniter "github.com/json-iterator/go"
	"go.uber.org/zap"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/settings"
	"github.com/kweaver-ai/idrm-go-common/interception"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest"
)

type VirtualizationEngine struct {
	protocol   string
	baseURL    string
	HttpClient *http.Client
}

func NewVirtualizationEngine() DrivenVirtualizationEngine {
	return &VirtualizationEngine{
		protocol: settings.ConfigInstance.Config.DepServices.VirtualizationEngineProtocol,
		baseURL:  settings.ConfigInstance.Config.DepServices.VirtualizationEngineHost,
		HttpClient: af_trace.NewOTELHttpClientParam(settings.ConfigInstance.Config.VEClientExpireDuration*time.Second,
			&http.Transport{
				TLSClientConfig:       &tls.Config{InsecureSkipVerify: true},
				MaxIdleConnsPerHost:   25,
				MaxIdleConns:          25,
				IdleConnTimeout:       90 * time.Second,
				TLSHandshakeTimeout:   10 * time.Second,
				ExpectContinueTimeout: 1 * time.Second,
			}),
	}
}

func (v *VirtualizationEngine) GetDataSource(ctx context.Context) (*GetDataSourceRes, error) {
	drivenMsg := "DrivenVirtualizationEngine GetDataSource "
	urlStr := fmt.Sprintf("%s://%s/api/virtual_engine_service/v1/catalog", v.protocol, v.baseURL)

	request, err := http.NewRequest(http.MethodGet, urlStr, nil)
	if err != nil {
		log.WithContext(ctx).Error(drivenMsg+"http.NewRequest error", zap.Error(err))
		return nil, errorcode.Detail(errorcode.DrivenGetDataSourceFailed, err.Error())
	}
	request.Header.Set("Authorization", ctx.Value(interception.Token).(string))
	resp, err := v.HttpClient.Do(request)
	if err != nil {
		log.WithContext(ctx).Error(drivenMsg+"client.Do error", zap.Error(err))
		return nil, errorcode.Detail(errorcode.DrivenGetDataSourceFailed, err.Error())
	}

	defer resp.Body.Close()
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		log.WithContext(ctx).Error(drivenMsg+" io.ReadAll error", zap.Error(err))
		return nil, errorcode.Detail(errorcode.DrivenGetDataSourceFailed, err.Error())
	}
	if resp.StatusCode == http.StatusOK {
		var res GetDataSourceRes
		err = jsoniter.Unmarshal(body, &res)
		if err != nil {
			log.WithContext(ctx).Error(drivenMsg+" jsoniter.Unmarshal error", zap.Error(err))
			return nil, errorcode.Detail(errorcode.DrivenGetDataSourceFailed, err.Error())
		}
		log.Infof(drivenMsg+"res  msg : %v ,code:%v", res.Msg, res.Code)
		return &res, nil
	} else {
		if g, ok := ctx.(*gin.Context); ok {
			g.Set(interception.StatusCode, resp.StatusCode)
		}
		if resp.StatusCode == http.StatusBadRequest || resp.StatusCode == http.StatusInternalServerError || resp.StatusCode == http.StatusUnauthorized || resp.StatusCode == http.StatusForbidden {
			return nil, Unmarshal(ctx, body, drivenMsg)
		} else {
			log.WithContext(ctx).Error(drivenMsg+"http status error", zap.String("status", resp.Status), zap.String("body", string(body)))
			return nil, errorcode.Desc(errorcode.DrivenGetDataSourceFailed, resp.StatusCode)
		}
	}
}

func (v *VirtualizationEngine) CreateDataSource(ctx context.Context, req *CreateDataSourceReq) (bool, error) {
	drivenMsg := "DrivenVirtualizationEngine CreateDataSource "
	log.Infof(drivenMsg+"%+v", *req)
	urlStr := fmt.Sprintf("%s://%s/api/virtual_engine_service/v1/catalog", v.protocol, v.baseURL)

	jsonReq, err := jsoniter.Marshal(req)
	if err != nil {
		log.WithContext(ctx).Error(drivenMsg+" jsoniter.Marshal error", zap.Error(err))
		return false, errorcode.Detail(errorcode.DrivenCreateDataSourceFailed, err.Error())
	}
	log.Infof("url:%s \n %+v", urlStr, string(jsonReq))

	request, err := http.NewRequest(http.MethodPost, urlStr, bytes.NewReader(jsonReq))
	if err != nil {
		log.WithContext(ctx).Error(drivenMsg+"http.NewRequest error", zap.Error(err))
		return false, errorcode.Detail(errorcode.DrivenCreateDataSourceFailed, err.Error())
	}

	request.Header.Set("Authorization", ctx.Value(interception.Token).(string))
	request.Header.Add("Content-Type", "application/json")

	resp, err := v.HttpClient.Do(request)
	if err != nil {
		log.WithContext(ctx).Error(drivenMsg+"client.Do error", zap.Error(err))
		return false, errorcode.Detail(errorcode.DrivenCreateDataSourceFailed, err.Error())
	}

	defer resp.Body.Close()
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		log.WithContext(ctx).Error(drivenMsg+" io.ReadAll error", zap.Error(err))
		return false, errorcode.Detail(errorcode.DrivenCreateDataSourceFailed, err.Error())
	}
	if resp.StatusCode == http.StatusOK {
		return true, nil
	} else {
		log.WithContext(ctx).Info(drivenMsg+" not http.StatusOK ", zap.String("body", string(body)))
		if g, ok := ctx.(*gin.Context); ok {
			g.Set(interception.StatusCode, resp.StatusCode)
		}
		var res rest.HttpError
		if err = jsoniter.Unmarshal(body, &res); err != nil {
			log.WithContext(ctx).Error(drivenMsg+" jsoniter.Unmarshal error", zap.Error(err))
			return false, errorcode.Detail(errorcode.DrivenCreateDataSourceFailed, err.Error())
		}
		/*if strings.Contains(res.Code, "CatalogInfoError") { //捕获错误
			return false, errorcode.Detail(errorcode.DrivenCreateDataSourceParamFailed, res.Description)
		} else*/if resp.StatusCode == http.StatusBadRequest || resp.StatusCode == http.StatusInternalServerError || resp.StatusCode == http.StatusUnauthorized || resp.StatusCode == http.StatusForbidden {
			log.WithContext(ctx).Error(drivenMsg+"error", zap.Int("status", resp.StatusCode))
			return false, errorcode.New(res.Code, res.Description, res.Cause, res.Solution, res.Detail, "")
		} else {
			log.WithContext(ctx).Error(drivenMsg+"http status error", zap.String("status", resp.Status), zap.String("body", string(body)))
			return false, errorcode.Desc(errorcode.DrivenCreateDataSourceFailed)
		}
	}
}

func Unmarshal(ctx context.Context, body []byte, drivenMsg string) error {
	var res rest.HttpError
	if err := jsoniter.Unmarshal(body, &res); err != nil {
		log.WithContext(ctx).Error(drivenMsg+" jsoniter.Unmarshal error", zap.Error(err))
		return errorcode.Detail(errorcode.DrivenCreateDataSourceFailed, err.Error())
	}
	return errorcode.New(res.Code, res.Description, res.Cause, res.Solution, res.Detail, "")
}
func (v *VirtualizationEngine) ModifyDataSource(ctx context.Context, req *ModifyDataSourceReq) (bool, error) {
	drivenMsg := "DrivenVirtualizationEngine ModifyDataSource "
	log.Infof(drivenMsg+"%+v", *req)
	urlStr := fmt.Sprintf("%s://%s/api/virtual_engine_service/v1/catalog/%s", v.protocol, v.baseURL, req.CatalogName)

	jsonReq, err := jsoniter.Marshal(req)
	if err != nil {
		log.WithContext(ctx).Error(drivenMsg+" jsoniter.Marshal error", zap.Error(err))
		return false, errorcode.Detail(errorcode.DrivenModifyDataSourceFailed, err.Error())
	}

	request, err := http.NewRequest(http.MethodPut, urlStr, bytes.NewReader(jsonReq))
	if err != nil {
		log.WithContext(ctx).Error(drivenMsg+"http.NewRequest error", zap.Error(err))
		return false, errorcode.Detail(errorcode.DrivenModifyDataSourceFailed, err.Error())
	}
	request.Header.Set("Authorization", ctx.Value(interception.Token).(string))
	request.Header.Add("Content-Type", "application/json")

	resp, err := v.HttpClient.Do(request)
	if err != nil {
		log.WithContext(ctx).Error(drivenMsg+"client.Do error", zap.Error(err))
		return false, errorcode.Detail(errorcode.DrivenModifyDataSourceFailed, err.Error())
	}

	defer resp.Body.Close()
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		log.WithContext(ctx).Error(drivenMsg+" io.ReadAll error", zap.Error(err))
		return false, errorcode.Detail(errorcode.DrivenModifyDataSourceFailed, err.Error())
	}
	if resp.StatusCode == http.StatusOK {
		return true, nil
	} else {
		if g, ok := ctx.(*gin.Context); ok {
			g.Set(interception.StatusCode, resp.StatusCode)
		}
		if resp.StatusCode == http.StatusBadRequest || resp.StatusCode == http.StatusInternalServerError || resp.StatusCode == http.StatusUnauthorized || resp.StatusCode == http.StatusForbidden {
			return false, Unmarshal(ctx, body, drivenMsg)
		} else {
			log.WithContext(ctx).Error(drivenMsg+"http status error", zap.String("status", resp.Status), zap.String("body", string(body)))
			return false, errorcode.Desc(errorcode.DrivenModifyDataSourceFailed, resp.StatusCode)
		}
	}
}

func (v *VirtualizationEngine) DeleteDataSource(ctx context.Context, req *DeleteDataSourceReq) (bool, error) {
	drivenMsg := "DrivenVirtualizationEngine DeleteDataSource "
	log.Infof(drivenMsg+"%+v", *req)
	urlStr := fmt.Sprintf("%s://%s/api/virtual_engine_service/v1/catalog/%s", v.protocol, v.baseURL, req.CatalogName)

	request, err := http.NewRequest(http.MethodDelete, urlStr, nil)
	if err != nil {
		log.WithContext(ctx).Error(drivenMsg+"http.NewRequest error", zap.Error(err))
		return false, errorcode.Detail(errorcode.DrivenDeleteDataSourceFailed, err.Error())
	}

	request.Header.Set("Authorization", ctx.Value(interception.Token).(string))

	resp, err := v.HttpClient.Do(request)
	if err != nil {
		log.WithContext(ctx).Error(drivenMsg+"client.Do error", zap.Error(err))
		return false, errorcode.Detail(errorcode.DrivenDeleteDataSourceFailed, err.Error())
	}

	defer resp.Body.Close()
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		log.WithContext(ctx).Error(drivenMsg+" io.ReadAll error", zap.Error(err))
		return false, errorcode.Detail(errorcode.DrivenDeleteDataSourceFailed, err.Error())
	}
	if resp.StatusCode == http.StatusOK {
		return true, nil
	} else {
		if g, ok := ctx.(*gin.Context); ok {
			g.Set(interception.StatusCode, resp.StatusCode)
		}
		if resp.StatusCode == http.StatusBadRequest || resp.StatusCode == http.StatusInternalServerError || resp.StatusCode == http.StatusUnauthorized || resp.StatusCode == http.StatusForbidden {
			return false, Unmarshal(ctx, body, drivenMsg)
		} else {
			log.WithContext(ctx).Error(drivenMsg+"http status error", zap.String("status", resp.Status), zap.String("body", string(body)))
			return false, errorcode.Desc(errorcode.DrivenDeleteDataSourceFailed, resp.StatusCode)
		}
	}

}

// GetConnectors implements DrivenVirtualizationEngine.
func (v *VirtualizationEngine) GetConnectors(ctx context.Context) (result *GetConnectorsRes, err error) {
	const drivenMsg = "DrivenVirtualizationEngine GetConnectors"

	log.Info(drivenMsg)

	u := &url.URL{Scheme: v.protocol, Host: v.baseURL, Path: "/api/virtual_engine_service/v1/connectors"}

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, u.String(), http.NoBody)
	if err != nil {
		log.WithContext(ctx).Error(drivenMsg+" http.NewRequestWithContext error", zap.Error(err))
		err = errorcode.Detail(errorcode.DrivenGetConnectorsFailed, err.Error())
		return
	}

	if t, ok := ctx.Value(interception.Token).(string); ok {
		req.Header.Set("Authorization", t)
	}

	log.Info("request", zap.String("method", req.Method), zap.Stringer("url", u))

	resp, err := v.HttpClient.Do(req)
	if err != nil {
		log.WithContext(ctx).Error(drivenMsg+" http.DefaultClient.Do error", zap.Error(err))
		err = errorcode.Detail(errorcode.DrivenGetConnectorsFailed, err.Error())
		return
	}
	defer resp.Body.Close()

	log.Info("response", zap.String("method", req.Method), zap.Stringer("url", u), zap.Int("statusCode", resp.StatusCode))

	if resp.StatusCode != http.StatusOK {
		err = errorcode.Detail(errorcode.DrivenGetConnectorsFailed, resp.Status)
		return
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		log.WithContext(ctx).Error(drivenMsg+" io.ReadAll error", zap.Error(err))
		err = errorcode.Detail(errorcode.DrivenGetConnectorsFailed, err.Error())
		return
	}

	log.Info("response", zap.String("body", string(body)))

	result = &GetConnectorsRes{}
	if err = json.Unmarshal(body, result); err != nil {
		log.WithContext(ctx).Error(drivenMsg+" json.Unmarshal error", zap.Error(err))
		return nil, errorcode.Detail(errorcode.DrivenGetConnectorsFailed, err.Error())
	}

	return result, nil
}

// GetConnectorConfig implements DrivenVirtualizationEngine.
func (v *VirtualizationEngine) GetConnectorConfig(ctx context.Context, name string) (result *ConnectorConfig, err error) {
	const drivenMsg = "DrivenVirtualizationEngine GetConnectorConfig"

	log.Info(drivenMsg, zap.String("connector", name))

	u := &url.URL{Scheme: v.protocol, Host: v.baseURL, Path: path.Join("/api/virtual_engine_service/v1/connectors/config", name)}

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, u.String(), http.NoBody)
	if err != nil {
		log.WithContext(ctx).Error(drivenMsg+" http.NewRequestWithContext error", zap.Error(err))
		err = errorcode.Detail(errorcode.DrivenGetConnectorConfigFailed, err.Error())
		return
	}

	if t, ok := ctx.Value(interception.Token).(string); ok {
		req.Header.Set("Authorization", t)
	}

	log.Info("request", zap.String("method", req.Method), zap.Stringer("url", u))

	resp, err := v.HttpClient.Do(req)
	if err != nil {
		log.WithContext(ctx).Error(drivenMsg+" http.DefaultClient.Do error", zap.Error(err))
		err = errorcode.Detail(errorcode.DrivenGetConnectorConfigFailed, err.Error())
		return
	}
	defer resp.Body.Close()

	log.Info("response", zap.String("method", req.Method), zap.Stringer("url", u), zap.Int("statusCode", resp.StatusCode))

	if resp.StatusCode != http.StatusOK {
		err = errorcode.Detail(errorcode.DrivenGetConnectorConfigFailed, resp.Status)
		return
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		log.WithContext(ctx).Error(drivenMsg+" io.ReadAll error", zap.Error(err))
		err = errorcode.Detail(errorcode.DrivenGetConnectorConfigFailed, err.Error())
		return
	}

	log.Info("response", zap.String("body", string(body)))

	result = &ConnectorConfig{}
	if err = json.Unmarshal(body, result); err != nil {
		log.WithContext(ctx).Error(drivenMsg+" json.Unmarshal error", zap.Error(err))
		return nil, errorcode.Detail(errorcode.DrivenGetConnectorConfigFailed, err.Error())
	}

	return result, nil
}

type Res struct {
	Code        string `json:"code"`
	Description string `json:"description"`
	Solution    string `json:"solution"`
}
type ErrorRes struct {
	Error     string `json:"error"`
	Status    string `json:"status"`
	Timestamp string `json:"timestamp"`
	Path      string `json:"path"`
}
