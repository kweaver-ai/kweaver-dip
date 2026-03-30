package impl

import (
	"bytes"
	"context"
	"crypto/tls"
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"github.com/kweaver-ai/idrm-go-common/rest/base"
	af_trace "github.com/kweaver-ai/idrm-go-frame/core/telemetry/trace"

	"io"
	"net/http"
	"strings"

	"github.com/kweaver-ai/idrm-go-common/errorcode"
	"github.com/kweaver-ai/idrm-go-common/interception"
	"github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/rest/virtualization_engine"
	"github.com/kweaver-ai/dsg/services/apps/data-view/common/constant"
	my_errorcode "github.com/kweaver-ai/dsg/services/apps/data-view/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-view/common/util"
	my_config "github.com/kweaver-ai/dsg/services/apps/data-view/infrastructure/config"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest"
	"github.com/gin-gonic/gin"
	jsoniter "github.com/json-iterator/go"
	"go.uber.org/zap"
)

type VirtualizationEngine struct {
	BaseURL            string
	HttpClient         *http.Client
	LongTimeHttpClient *http.Client
}

func NewVirtualizationEngine(conf *my_config.Bootstrap) virtualization_engine.DrivenVirtualizationEngine {
	return &VirtualizationEngine{
		BaseURL:    conf.DepServices.VirtualizationEngineHost,
		HttpClient: af_trace.NewOTELHttpClient20(),
		LongTimeHttpClient: af_trace.NewOTELHttpClientParam(time.Minute*3, &http.Transport{
			TLSClientConfig:       &tls.Config{InsecureSkipVerify: true},
			MaxIdleConnsPerHost:   25,
			MaxIdleConns:          25,
			IdleConnTimeout:       90 * time.Second,
			TLSHandshakeTimeout:   10 * time.Second,
			ExpectContinueTimeout: 1 * time.Second,
		}),
	}
}

func (v *VirtualizationEngine) GetView(ctx context.Context, req *virtualization_engine.GetViewReq) (*virtualization_engine.GetViewRes, error) {
	drivenMsg := "DrivenVirtualizationEngine GetView "
	urlStr := fmt.Sprintf("%s/api/virtual_engine_service/v1/view?pageNum=%d&pageSize=%d", v.BaseURL, req.PageNum, req.PageSize)

	request, err := http.NewRequestWithContext(ctx, http.MethodGet, urlStr, nil)
	if err != nil {
		log.WithContext(ctx).Error(drivenMsg+"http.NewRequest error", zap.Error(err))
		return nil, errorcode.Detail(my_errorcode.GetViewError, err.Error())
	}
	request.Header.Set("Authorization", util.ObtainToken(ctx))
	request.Header.Add("X-Presto-User", "admin")

	resp, err := v.HttpClient.Do(request)
	if err != nil {
		log.WithContext(ctx).Error(drivenMsg+"client.Do error", zap.Error(err))
		return nil, errorcode.Detail(my_errorcode.GetViewError, err.Error())
	}

	defer resp.Body.Close()
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		log.WithContext(ctx).Error(drivenMsg+" io.ReadAll error", zap.Error(err))
		return nil, errorcode.Detail(my_errorcode.GetViewError, err.Error())
	}
	if resp.StatusCode == http.StatusOK {
		var res virtualization_engine.GetViewRes
		if err = jsoniter.Unmarshal(body, &res); err != nil {
			log.WithContext(ctx).Error(drivenMsg+" jsoniter.Unmarshal error", zap.Error(err))
			return nil, errorcode.Detail(my_errorcode.GetViewError, err.Error())
		}
		log.Infof(drivenMsg+"res  msg : %v ,code:%v", res.Msg, res.Code)
		return &res, nil
	} else {
		if resp.StatusCode == http.StatusBadRequest || resp.StatusCode == http.StatusInternalServerError || resp.StatusCode == http.StatusUnauthorized || resp.StatusCode == http.StatusForbidden {
			return nil, Unmarshal(ctx, body, drivenMsg)
		} else {
			log.WithContext(ctx).Error(drivenMsg+"http status error", zap.String("status", resp.Status), zap.String("body", string(body)))
			return nil, errorcode.Desc(my_errorcode.GetViewError, resp.StatusCode)
		}
	}
}

func (v *VirtualizationEngine) CreateView(ctx context.Context, req *virtualization_engine.CreateViewReq) error {
	drivenMsg := "DrivenVirtualizationEngine createView "
	//log.Infof(drivenMsg+"%+v", *req)
	urlStr := fmt.Sprintf("%s/api/virtual_engine_service/v1/view/create", v.BaseURL)

	jsonReq, err := jsoniter.Marshal(req)
	if err != nil {
		log.WithContext(ctx).Error(drivenMsg+" jsoniter.Marshal error", zap.Error(err))
		return errorcode.Detail(my_errorcode.CreateViewError, err.Error())
	}

	request, err := http.NewRequestWithContext(ctx, http.MethodPost, urlStr, bytes.NewReader(jsonReq))
	if err != nil {
		log.WithContext(ctx).Error(drivenMsg+"http.NewRequest error", zap.Error(err))
		return errorcode.Detail(my_errorcode.CreateViewError, err.Error())
	}

	request.Header.Set("Authorization", util.ObtainToken(ctx))
	request.Header.Add("Content-Type", "application/json")
	request.Header.Add("X-Presto-User", "admin")

	resp, err := v.HttpClient.Do(request)
	if err != nil {
		log.Infof(drivenMsg+" url:%s \n %+v", urlStr, string(jsonReq))
		log.WithContext(ctx).Error(drivenMsg+"client.Do error", zap.Error(err))
		return errorcode.Detail(my_errorcode.CreateViewError, err.Error())
	}

	defer resp.Body.Close()
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		log.WithContext(ctx).Error(drivenMsg+" io.ReadAll error", zap.Error(err))
		return errorcode.Detail(my_errorcode.CreateViewError, err.Error())
	}
	if resp.StatusCode == http.StatusOK {
		return nil
	} else {
		log.Infof(drivenMsg+" url:%s \n %+v", urlStr, string(jsonReq))
		if resp.StatusCode == http.StatusBadRequest || resp.StatusCode == http.StatusInternalServerError || resp.StatusCode == http.StatusUnauthorized || resp.StatusCode == http.StatusForbidden {
			return Unmarshal(ctx, body, drivenMsg)
		} else {
			log.WithContext(ctx).Error(drivenMsg+"http status error", zap.String("status", resp.Status), zap.String("body", string(body)))
			return errorcode.Desc(my_errorcode.CreateViewError)
		}
	}
}
func (v *VirtualizationEngine) CreateExcelView(ctx context.Context, req *virtualization_engine.CreateExcelViewReq) (*virtualization_engine.CreateExcelViewRes, error) {
	drivenMsg := "DrivenVirtualizationEngine CreateExcelView "
	log.Infof(drivenMsg+"%+v", *req)
	urlStr := fmt.Sprintf("%s/api/virtual_engine_service/v1/excel/view", v.BaseURL)

	res := &virtualization_engine.CreateExcelViewRes{}
	err := base.CallWithTokenUpward(ctx, v.HttpClient, drivenMsg, http.MethodPost, urlStr, req, res, my_errorcode.CreateExcelViewError)
	if err != nil {
		return nil, err
	}
	return res, err
}
func (v *VirtualizationEngine) DeleteExcelView(ctx context.Context, req *virtualization_engine.DeleteExcelViewReq) (*virtualization_engine.DeleteExcelViewRes, error) {
	drivenMsg := "DrivenVirtualizationEngine DeleteExcelView "
	log.Infof(drivenMsg+"%+v", *req)
	urlStr := fmt.Sprintf("%s/api/virtual_engine_service/v1/excel/view/%s/%s/%s", v.BaseURL, req.VdmCatalog, req.Schema, req.View)

	res := &virtualization_engine.DeleteExcelViewRes{}
	err := base.CallWithTokenUpward(ctx, v.HttpClient, drivenMsg, http.MethodDelete, urlStr, nil, res, my_errorcode.DeleteExcelViewError)
	if err != nil {
		return nil, err
	}
	return res, err
}

func (v *VirtualizationEngine) GetPreview(ctx context.Context, req *virtualization_engine.ViewEntries) (*virtualization_engine.FetchDataRes, error) {
	drivenMsg := "DrivenVirtualizationEngine GetPreview "
	log.Infof(drivenMsg+"%+v", *req)
	urlStr := fmt.Sprintf("%s/api/virtual_engine_service/v1/preview/%s/%s/%s?limit=%d&user_id=%s", v.BaseURL, req.CatalogName, req.Schema, req.ViewName, req.Limit, req.UserId)

	request, err := http.NewRequestWithContext(ctx, http.MethodGet, urlStr, nil)
	if err != nil {
		log.WithContext(ctx).Error(drivenMsg+"http.NewRequest error", zap.Error(err))
		return nil, errorcode.Detail(my_errorcode.GetPreviewError, err.Error())
	}
	request.Header.Add("X-Presto-User", "admin")

	resp, err := v.HttpClient.Do(request)
	if err != nil {
		log.WithContext(ctx).Error(drivenMsg+"client.Do error", zap.Error(err))
		return nil, errorcode.Detail(my_errorcode.GetPreviewError, err.Error())
	}

	defer resp.Body.Close()
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		log.WithContext(ctx).Error(drivenMsg+" io.ReadAll error", zap.Error(err))
		return nil, errorcode.Detail(my_errorcode.GetViewError, err.Error())
	}
	if resp.StatusCode == http.StatusOK {
		res := &virtualization_engine.FetchDataRes{}
		if err = jsoniter.Unmarshal(body, &res); err != nil {
			log.WithContext(ctx).Error(drivenMsg+" jsoniter.Unmarshal error", zap.Error(err))
			return nil, errorcode.Detail(my_errorcode.GetPreviewError, err.Error())
		}
		return res, nil
	} else {
		if resp.StatusCode == http.StatusBadRequest || resp.StatusCode == http.StatusInternalServerError || resp.StatusCode == http.StatusUnauthorized || resp.StatusCode == http.StatusForbidden {
			return nil, Unmarshal(ctx, body, drivenMsg)
		} else {
			log.WithContext(ctx).Error(drivenMsg+"http status error", zap.String("status", resp.Status), zap.String("body", string(body)))
			return nil, errorcode.Desc(my_errorcode.GetPreviewError, resp.StatusCode)
		}
	}
}

func (v *VirtualizationEngine) DeleteView(ctx context.Context, req *virtualization_engine.DeleteViewReq) error {
	drivenMsg := "DrivenVirtualizationEngine DeleteView "
	log.Infof(drivenMsg+"%+v", *req)
	urlStr := fmt.Sprintf("%s/api/virtual_engine_service/v1/view/delete", v.BaseURL)

	jsonReq, err := jsoniter.Marshal(req)
	if err != nil {
		log.WithContext(ctx).Error(drivenMsg+" jsoniter.Marshal error", zap.Error(err))
		return errorcode.Detail(my_errorcode.DeleteViewError, err.Error())
	}

	request, err := http.NewRequestWithContext(ctx, http.MethodPost, urlStr, bytes.NewReader(jsonReq))
	if err != nil {
		log.WithContext(ctx).Error(drivenMsg+"http.NewRequest error", zap.Error(err))
		return errorcode.Detail(my_errorcode.DeleteViewError, err.Error())
	}
	//request.Header.Set("Authorization",  util.ObtainToken(ctx))
	request.Header.Add("Content-Type", "application/json")
	request.Header.Add("X-Presto-User", "admin")

	resp, err := v.HttpClient.Do(request)
	if err != nil {
		log.WithContext(ctx).Error(drivenMsg+"client.Do error", zap.Error(err))
		return errorcode.Detail(my_errorcode.DeleteViewError, err.Error())
	}

	defer resp.Body.Close()
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		log.WithContext(ctx).Error(drivenMsg+" io.ReadAll error", zap.Error(err))
		return errorcode.Detail(my_errorcode.DeleteViewError, err.Error())
	}
	if resp.StatusCode == http.StatusOK {
		return nil
	} else {
		if resp.StatusCode == http.StatusBadRequest || resp.StatusCode == http.StatusInternalServerError || resp.StatusCode == http.StatusUnauthorized || resp.StatusCode == http.StatusForbidden {
			return Unmarshal(ctx, body, drivenMsg)
		} else {
			log.WithContext(ctx).Error(drivenMsg+"http status error", zap.String("status", resp.Status), zap.String("body", string(body)))
			return errorcode.Desc(my_errorcode.DeleteViewError, resp.StatusCode)
		}
	}
}

func (v *VirtualizationEngine) ModifyView(ctx context.Context, req *virtualization_engine.ModifyViewReq) error {
	drivenMsg := "DrivenVirtualizationEngine ModifyView "
	log.Infof(drivenMsg+"%+v", *req)
	urlStr := fmt.Sprintf("%s/api/virtual_engine_service/v1/view/replace", v.BaseURL)

	jsonReq, err := jsoniter.Marshal(req)
	if err != nil {
		return errorcode.Detail(my_errorcode.ModifyViewError, err.Error())
	}
	request, err := http.NewRequestWithContext(ctx, http.MethodPost, urlStr, bytes.NewReader(jsonReq))
	if err != nil {
		log.WithContext(ctx).Error(drivenMsg+"http.NewRequest error", zap.Error(err))
		return errorcode.Detail(my_errorcode.ModifyViewError, err.Error())
	}

	request.Header.Set("Authorization", util.ObtainToken(ctx))
	request.Header.Add("Content-Type", "application/json")
	request.Header.Add("X-Presto-User", "admin")

	resp, err := v.HttpClient.Do(request)
	if err != nil {
		log.WithContext(ctx).Error(drivenMsg+"client.Do error", zap.Error(err))
		return errorcode.Detail(my_errorcode.ModifyViewError, err.Error())
	}

	defer resp.Body.Close()
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		log.WithContext(ctx).Error(drivenMsg+" io.ReadAll error", zap.Error(err))
		return errorcode.Detail(my_errorcode.ModifyViewError, err.Error())
	}
	if resp.StatusCode == http.StatusOK {
		return nil
	} else {
		if resp.StatusCode == http.StatusBadRequest || resp.StatusCode == http.StatusInternalServerError || resp.StatusCode == http.StatusUnauthorized || resp.StatusCode == http.StatusForbidden {
			return Unmarshal(ctx, body, drivenMsg)
		} else {
			log.WithContext(ctx).Error(drivenMsg+"http status error", zap.String("status", resp.Status), zap.String("body", string(body)))
			return errorcode.Desc(my_errorcode.ModifyViewError, resp.StatusCode)
		}
	}

}

func (v *VirtualizationEngine) CreateViewSource(ctx context.Context, req *virtualization_engine.CreateViewSourceReq) ([]*virtualization_engine.CreateViewSourceRes, error) {
	drivenMsg := "DrivenVirtualizationEngine CreateViewSource "
	log.Infof(drivenMsg+"%+v", *req)
	urlStr := fmt.Sprintf("%s/api/virtual_engine_service/v1/catalog", v.BaseURL)

	jsonReq, err := jsoniter.Marshal(req)
	if err != nil {
		log.WithContext(ctx).Error(drivenMsg+" jsoniter.Marshal error", zap.Error(err))
		return nil, errorcode.Detail(my_errorcode.CreateViewSourceError, err.Error())
	}
	log.Infof("url:%s \n %+v", urlStr, string(jsonReq))

	request, err := http.NewRequestWithContext(ctx, http.MethodPost, urlStr, bytes.NewReader(jsonReq))
	if err != nil {
		log.WithContext(ctx).Error(drivenMsg+"http.NewRequest error", zap.Error(err))
		return nil, errorcode.Detail(my_errorcode.CreateViewSourceError, err.Error())
	}

	request.Header.Set("Authorization", util.ObtainToken(ctx))
	request.Header.Add("Content-Type", "application/json")

	resp, err := v.HttpClient.Do(request)
	if err != nil {
		log.WithContext(ctx).Error(drivenMsg+"client.Do error", zap.Error(err))
		return nil, errorcode.Detail(my_errorcode.CreateViewSourceError, err.Error())
	}

	defer resp.Body.Close()
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		log.WithContext(ctx).Error(drivenMsg+" io.ReadAll error", zap.Error(err))
		return nil, errorcode.Detail(my_errorcode.CreateViewSourceError, err.Error())
	}
	if resp.StatusCode == http.StatusOK {
		var res []*virtualization_engine.CreateViewSourceRes
		if err = jsoniter.Unmarshal(body, &res); err != nil {
			log.WithContext(ctx).Error(drivenMsg+" jsoniter.Unmarshal error", zap.Error(err))
			return nil, errorcode.Detail(my_errorcode.GetViewError, err.Error())
		}
		log.Infof(drivenMsg+"res : %v ", res)
		return res, nil
	} else {
		if resp.StatusCode == http.StatusBadRequest || resp.StatusCode == http.StatusInternalServerError || resp.StatusCode == http.StatusUnauthorized || resp.StatusCode == http.StatusForbidden {
			return nil, Unmarshal(ctx, body, drivenMsg)
		} else {
			log.WithContext(ctx).Error(drivenMsg+"http status error", zap.String("status", resp.Status), zap.String("body", string(body)))
			return nil, errorcode.Desc(my_errorcode.CreateViewSourceError)
		}
	}
}

func (v *VirtualizationEngine) DeleteDataSource(ctx context.Context, req *virtualization_engine.DeleteDataSourceReq) error {
	drivenMsg := "DrivenVirtualizationEngine DeleteDataSource "
	log.Infof(drivenMsg+"%+v", *req)
	urlStr := fmt.Sprintf("%s/api/virtual_engine_service/v1/catalog/%s", v.BaseURL, req.CatalogName)

	request, err := http.NewRequest(http.MethodDelete, urlStr, nil)
	if err != nil {
		log.WithContext(ctx).Error(drivenMsg+"http.NewRequest error", zap.Error(err))
		return errorcode.Detail(my_errorcode.DeleteDataSourceError, err.Error())
	}

	//request.Header.Set("Authorization",  util.ObtainToken(ctx))
	resp, err := v.HttpClient.Do(request)
	if err != nil {
		log.WithContext(ctx).Error(drivenMsg+"client.Do error", zap.Error(err))
		return errorcode.Detail(my_errorcode.DeleteDataSourceError, err.Error())
	}

	defer resp.Body.Close()
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		log.WithContext(ctx).Error(drivenMsg+" io.ReadAll error", zap.Error(err))
		return errorcode.Detail(my_errorcode.DeleteDataSourceError, err.Error())
	}
	if resp.StatusCode == http.StatusOK {
		return nil
	} else {
		if g, ok := ctx.(*gin.Context); ok {
			g.Set(interception.StatusCode, resp.StatusCode)
		}
		if resp.StatusCode == http.StatusBadRequest || resp.StatusCode == http.StatusInternalServerError || resp.StatusCode == http.StatusUnauthorized || resp.StatusCode == http.StatusForbidden {
			return Unmarshal(ctx, body, drivenMsg)
		} else {
			log.WithContext(ctx).Error(drivenMsg+"http status error", zap.String("status", resp.Status), zap.String("body", string(body)))
			return errorcode.Desc(my_errorcode.DeleteDataSourceError, resp.StatusCode)
		}
	}

}

func (v *VirtualizationEngine) FetchData(ctx context.Context, statement string) (*virtualization_engine.FetchDataRes, error) {
	drivenMsg := "DrivenVirtualizationEngine FetchData "
	urlStr := fmt.Sprintf("%s/api/virtual_engine_service/v1/fetch", v.BaseURL)
	log.Infof(drivenMsg+" url:%s \n %+v", urlStr, statement)
	request, err := http.NewRequestWithContext(ctx, http.MethodPost, urlStr, bytes.NewReader([]byte(statement)))
	if err != nil {
		log.WithContext(ctx).Error(drivenMsg+"http.NewRequest error", zap.Error(err))
		return nil, errorcode.Detail(my_errorcode.FetchDataError, err.Error())
	}

	request.Header.Add("X-Presto-User", "admin")
	//request.Header.Set("Authorization",  util.ObtainToken(ctx))
	request.Header.Add("Content-Type", "application/json")

	resp, err := v.LongTimeHttpClient.Do(request)
	if err != nil {
		log.WithContext(ctx).Error(drivenMsg+"client.Do error", zap.Error(err))
		return nil, errorcode.Detail(my_errorcode.FetchDataError, err.Error())
	}

	defer resp.Body.Close()
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		log.WithContext(ctx).Error(drivenMsg+" io.ReadAll error", zap.Error(err))
		return nil, errorcode.Detail(my_errorcode.FetchDataError, err.Error())
	}
	if resp.StatusCode == http.StatusOK {
		var res virtualization_engine.FetchDataRes
		if err = jsoniter.Unmarshal(body, &res); err != nil {
			log.WithContext(ctx).Error(drivenMsg+" jsoniter.Unmarshal error", zap.Error(err))
			return nil, errorcode.Detail(my_errorcode.GetViewError, err.Error())
		}
		log.Infof(drivenMsg+"res : %v ", res)
		return &res, nil
	} else {
		if resp.StatusCode == http.StatusBadRequest || resp.StatusCode == http.StatusInternalServerError || resp.StatusCode == http.StatusUnauthorized || resp.StatusCode == http.StatusForbidden {
			return nil, UnmarshalFetch(ctx, body, drivenMsg)
		} else {
			log.WithContext(ctx).Error(drivenMsg+"http status error", zap.String("status", resp.Status), zap.String("body", string(body)))
			return nil, errorcode.Desc(my_errorcode.FetchDataError)
		}
	}
}

func (v *VirtualizationEngine) FetchAuthorizedData(ctx context.Context, statement string, req *virtualization_engine.FetchReq) (*virtualization_engine.FetchDataRes, error) {
	drivenMsg := "DrivenVirtualizationEngine FetchAuthorizedData "
	urlStr := fmt.Sprintf("%s/api/virtual_engine_service/v1/fetch", v.BaseURL)
	if req != nil {
		urlStr = fmt.Sprintf("%s?user_id=%s&action=%s", urlStr, req.UserID, req.Action)
	}
	log.Infof(drivenMsg+" url:%s \n %+v", urlStr, statement)
	request, err := http.NewRequestWithContext(ctx, http.MethodPost, urlStr, bytes.NewReader([]byte(statement)))
	if err != nil {
		log.WithContext(ctx).Error(drivenMsg+"http.NewRequest error", zap.Error(err))
		return nil, errorcode.Detail(my_errorcode.FetchDataError, err.Error())
	}

	request.Header.Add("X-Presto-User", "admin")
	request.Header.Add("Content-Type", "application/json")

	resp, err := v.LongTimeHttpClient.Do(request)
	if err != nil {
		log.WithContext(ctx).Error(drivenMsg+"client.Do error", zap.Error(err))
		return nil, errorcode.Detail(my_errorcode.FetchDataError, err.Error())
	}

	defer resp.Body.Close()
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		log.WithContext(ctx).Error(drivenMsg+" io.ReadAll error", zap.Error(err))
		return nil, errorcode.Detail(my_errorcode.FetchDataError, err.Error())
	}
	if resp.StatusCode == http.StatusOK {
		var res virtualization_engine.FetchDataRes
		if err = jsoniter.Unmarshal(body, &res); err != nil {
			log.WithContext(ctx).Error(drivenMsg+" jsoniter.Unmarshal error", zap.Error(err))
			return nil, errorcode.Detail(my_errorcode.GetViewError, err.Error())
		}
		log.Infof(drivenMsg+"res : %v ", res)
		return &res, nil
	} else {
		if resp.StatusCode == http.StatusBadRequest || resp.StatusCode == http.StatusInternalServerError || resp.StatusCode == http.StatusUnauthorized || resp.StatusCode == http.StatusForbidden {
			return nil, UnmarshalFetch(ctx, body, drivenMsg)
		} else {
			log.WithContext(ctx).Error(drivenMsg+"http status error", zap.String("status", resp.Status), zap.String("body", string(body)))
			return nil, errorcode.Desc(my_errorcode.FetchDataError)
		}
	}
}

// GetConnectors implements DrivenVirtualizationEngine.
func (v *VirtualizationEngine) GetConnectors(ctx context.Context) (result *virtualization_engine.GetConnectorsRes, err error) {
	const drivenMsg = "DrivenVirtualizationEngine GetConnectors"

	log.Info(drivenMsg)
	url := fmt.Sprintf("%s/api/virtual_engine_service/v1/connectors", v.BaseURL)
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, http.NoBody)
	if err != nil {
		log.WithContext(ctx).Error(drivenMsg+" http.NewRequestWithContext error", zap.Error(err))
		err = errorcode.Detail(my_errorcode.DrivenGetConnectorsFailed, err.Error())
		return
	}

	if t, ok := ctx.Value(interception.Token).(string); ok {
		req.Header.Set("Authorization", t)
	}

	log.Info("request", zap.String("method", req.Method), zap.String("url", url))

	resp, err := v.HttpClient.Do(req)
	if err != nil {
		log.WithContext(ctx).Error(drivenMsg+" http.DefaultClient.Do error", zap.Error(err))
		err = errorcode.Detail(my_errorcode.DrivenGetConnectorsFailed, err.Error())
		return
	}
	defer resp.Body.Close()

	log.Info("response", zap.String("method", req.Method), zap.String("url", url), zap.Int("statusCode", resp.StatusCode))

	if resp.StatusCode != http.StatusOK {
		err = errorcode.Detail(my_errorcode.DrivenGetConnectorsFailed, resp.Status)
		return
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		log.WithContext(ctx).Error(drivenMsg+" io.ReadAll error", zap.Error(err))
		err = errorcode.Detail(my_errorcode.DrivenGetConnectorsFailed, err.Error())
		return
	}

	log.Info("response", zap.String("body", string(body)))

	result = &virtualization_engine.GetConnectorsRes{}
	if err = json.Unmarshal(body, result); err != nil {
		log.WithContext(ctx).Error(drivenMsg+" json.Unmarshal error", zap.Error(err))
		return nil, errorcode.Detail(my_errorcode.DrivenGetConnectorsFailed, err.Error())
	}

	return result, nil
}

func Unmarshal(ctx context.Context, body []byte, drivenMsg string) error {
	var res rest.HttpError
	if err := jsoniter.Unmarshal(body, &res); err != nil {
		log.WithContext(ctx).Error(drivenMsg+" jsoniter.Unmarshal error", zap.Error(err))
		return errorcode.Detail(my_errorcode.VirtualizationEngineError, err.Error())
	}
	log.WithContext(ctx).Errorf("%+v", res)
	return errorcode.New(res.Code, res.Description, res.Cause, res.Solution, res.Detail, "")
}
func UnmarshalFetch(ctx context.Context, body []byte, drivenMsg string) error {
	var res rest.HttpError
	if err := jsoniter.Unmarshal(body, &res); err != nil {
		log.WithContext(ctx).Error(drivenMsg+" jsoniter.Unmarshal error", zap.Error(err))
		return errorcode.Detail(my_errorcode.VirtualizationEngineError, err.Error())
	}
	log.WithContext(ctx).Errorf("%+v", res)
	if detail, ok := res.Detail.(string); ok {
		if strings.Contains(detail, constant.ViewNeedRecreate) {
			return errorcode.Desc(my_errorcode.StructChangeNeedUpdate)
		}
		for _, formatError := range DateTimeFormatErrorList {
			if strings.Contains(detail, formatError) {
				return errorcode.Detail(my_errorcode.DateTimeFormatError, detail)
			}
		}
	}
	return errorcode.New(res.Code, res.Description, res.Cause, res.Solution, res.Detail, "")
}

var DateTimeFormatErrorList = []string{
	"Invalid format:",
	"dayOfMonth must be in the range [1,30]",
	"monthOfYear must be in the range [1,12]",
}

func (v *VirtualizationEngine) StreamDataFetch(ctx context.Context, urlStr string, statement string) (*virtualization_engine.StreamFetchResp, error) {
	var (
		request *http.Request
		err     error
	)

	drivenMsg := "DrivenVirtualizationEngine StreamDataFetch "
	if len(urlStr) == 0 {
		urlStr = fmt.Sprintf("%s/api/virtual_engine_service/v1/fetch?type=1", v.BaseURL)
		log.Infof(drivenMsg+" url:%s \n %+v", urlStr, statement)
		request, err = http.NewRequestWithContext(ctx, http.MethodPost, urlStr, bytes.NewReader(util.StringToBytes(statement)))
	} else {
		urlStr = fmt.Sprintf("%s/api/virtual_engine_service/v1/statement/executing/%s", v.BaseURL, urlStr)
		log.Infof(drivenMsg+" url:%s \n %+v", urlStr)
		request, err = http.NewRequestWithContext(ctx, http.MethodGet, urlStr, http.NoBody)

	}
	if err != nil {
		log.WithContext(ctx).Error(drivenMsg+"http.NewRequest error", zap.Error(err))
		return nil, errorcode.Detail(my_errorcode.FetchDataError, err.Error())
	}

	request.Header.Add("X-Presto-User", "admin")
	request.Header.Add("Content-Type", "application/json")

	resp, err := v.HttpClient.Do(request)
	if err != nil {
		log.WithContext(ctx).Error(drivenMsg+"client.Do error", zap.Error(err))
		return nil, errorcode.Detail(my_errorcode.FetchDataError, err.Error())
	}

	defer resp.Body.Close()
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		log.WithContext(ctx).Error(drivenMsg+" io.ReadAll error", zap.Error(err))
		return nil, errorcode.Detail(my_errorcode.FetchDataError, err.Error())
	}
	if resp.StatusCode == http.StatusOK {
		var res virtualization_engine.StreamFetchResp
		if err = jsoniter.Unmarshal(body, &res); err != nil {
			log.WithContext(ctx).Error(drivenMsg+" jsoniter.Unmarshal error", zap.Error(err))
			return nil, errorcode.Detail(my_errorcode.FetchDataError, err.Error())
		}
		log.Infof(drivenMsg+"res : %v ", res)
		return &res, nil
	} else {
		if resp.StatusCode == http.StatusBadRequest || resp.StatusCode == http.StatusInternalServerError || resp.StatusCode == http.StatusUnauthorized || resp.StatusCode == http.StatusForbidden {
			var res rest.HttpError
			if err := jsoniter.Unmarshal(body, &res); err != nil {
				log.WithContext(ctx).Error(drivenMsg+" jsoniter.Unmarshal error", zap.Error(err))
				return nil, errorcode.Detail(my_errorcode.VirtualizationEngineError, err.Error())
			}
			log.WithContext(ctx).Errorf("%+v", res)
			return nil, errors.New(util.BytesToString(body))
		} else {
			log.WithContext(ctx).Error(drivenMsg+"http status error", zap.String("status", resp.Status), zap.String("body", string(body)))
			return nil, errorcode.Desc(my_errorcode.FetchDataError)
		}
	}
}

func (v *VirtualizationEngine) StreamDataDownload(ctx context.Context, urlStr string,
	req *virtualization_engine.StreamDownloadReq) (*virtualization_engine.StreamFetchResp, error) {
	var (
		request *http.Request
		err     error
	)

	drivenMsg := "DrivenVirtualizationEngine StreamDataDownload "
	if len(urlStr) == 0 {
		if req == nil {
			err = errors.New("req params cannot be nil")
			log.WithContext(ctx).Error(drivenMsg+"params invalid", zap.Error(err))
			return nil, errorcode.Detail(my_errorcode.DownloadDataError, err.Error())
		}
		var buf []byte
		if buf, err = json.Marshal(req); err != nil {
			log.WithContext(ctx).Error(drivenMsg+"json.Marshal error", zap.Error(err))
			return nil, errorcode.Detail(my_errorcode.DownloadDataError, err.Error())
		}
		urlStr = fmt.Sprintf("%s/api/virtual_engine_service/v1/download?user_id=%s&action=%s", v.BaseURL, req.UserID, req.Action)
		log.Infof(drivenMsg+" url:%s \n %#v", urlStr, *req)
		request, err = http.NewRequestWithContext(ctx, http.MethodPost, urlStr, bytes.NewReader(buf))
		request.Header.Add("user_id", req.UserID)
	} else {
		log.Infof(drivenMsg+" url:%s \n %+v", urlStr)
		request, err = http.NewRequestWithContext(ctx, http.MethodGet, urlStr, http.NoBody)

	}
	if err != nil {
		log.WithContext(ctx).Error(drivenMsg+"http.NewRequest error", zap.Error(err))
		return nil, errorcode.Detail(my_errorcode.DownloadDataError, err.Error())
	}

	request.Header.Add("X-Presto-User", "admin")
	request.Header.Add("Content-Type", "application/json")

	resp, err := v.HttpClient.Do(request)
	if err != nil {
		log.WithContext(ctx).Error(drivenMsg+"client.Do error", zap.Error(err))
		return nil, errorcode.Detail(my_errorcode.DownloadDataError, err.Error())
	}

	defer resp.Body.Close()
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		log.WithContext(ctx).Error(drivenMsg+" io.ReadAll error", zap.Error(err))
		return nil, errorcode.Detail(my_errorcode.DownloadDataError, err.Error())
	}
	if resp.StatusCode == http.StatusOK {
		var res virtualization_engine.StreamFetchResp
		if err = jsoniter.Unmarshal(body, &res); err != nil {
			log.WithContext(ctx).Error(drivenMsg+" jsoniter.Unmarshal error", zap.Error(err))
			return nil, errorcode.Detail(my_errorcode.DownloadDataError, err.Error())
		}
		log.Infof(drivenMsg+"res : %v ", res)
		return &res, nil
	} else {
		if resp.StatusCode == http.StatusBadRequest || resp.StatusCode == http.StatusInternalServerError || resp.StatusCode == http.StatusUnauthorized || resp.StatusCode == http.StatusForbidden {
			var res rest.HttpError
			if err := jsoniter.Unmarshal(body, &res); err != nil {
				log.WithContext(ctx).Error(drivenMsg+" jsoniter.Unmarshal error", zap.Error(err))
				return nil, errorcode.Detail(my_errorcode.VirtualizationEngineError, err.Error())
			}
			log.WithContext(ctx).Errorf("%+v", res)
			return nil, errors.New(util.BytesToString(body))
		} else {
			log.WithContext(ctx).Error(drivenMsg+"http status error", zap.String("status", resp.Status), zap.String("body", string(body)))
			return nil, errorcode.Desc(my_errorcode.DownloadDataError)
		}
	}
}
