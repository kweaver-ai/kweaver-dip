package data_connection

import (
	"context"
	"crypto/tls"
	"fmt"
	"io"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	jsoniter "github.com/json-iterator/go"
	"github.com/kweaver-ai/idrm-go-common/interception"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	af_trace "github.com/kweaver-ai/idrm-go-frame/core/telemetry/trace"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest"
	"go.uber.org/zap"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/settings"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/user_util"
)

type DataConnection struct {
	protocol   string
	baseURL    string
	HttpClient *http.Client
}

func NewDataConnection() DrivenDataConnection {
	return &DataConnection{
		protocol: settings.ConfigInstance.Config.DepServices.DataConnectionProtocol,
		baseURL:  settings.ConfigInstance.Config.DepServices.DataConnectionHost,
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

func (v *DataConnection) GetDataSourceDetail(ctx context.Context, id string) (*GetDataSourceDetailRes, error) {
	drivenMsg := "DrivenDataConnection GetDataSourceDetail "
	urlStr := fmt.Sprintf("%s://%s/api/internal/data-connection/v1/datasource/%s", v.protocol, v.baseURL, id)

	request, err := http.NewRequest(http.MethodGet, urlStr, nil)
	if err != nil {
		log.WithContext(ctx).Error(drivenMsg+"http.NewRequest error", zap.Error(err))
		return nil, errorcode.Detail(errorcode.DrivenGetDataSourceDetailFailed, err.Error())
	}
	userInfo, err := user_util.GetUserInfo(ctx)
	if err != nil {
		log.WithContext(ctx).Error(drivenMsg+"user_util.GetUserInfo error", zap.Error(err))
		return nil, errorcode.Detail(errorcode.DrivenGetDataSourceDetailFailed, err.Error())
	}

	if userInfo == nil {
		errMsg := "user_util.GetUserInfo empty"
		log.WithContext(ctx).Error(drivenMsg + errMsg)
		return nil, errorcode.Detail(errorcode.DrivenGetDataSourceDetailFailed, errMsg)
	}

	request.Header.Set("x-account-id", userInfo.ID)
	request.Header.Set("x-account-type", "user")

	resp, err := v.HttpClient.Do(request)
	if err != nil {
		log.WithContext(ctx).Error(drivenMsg+"client.Do error", zap.Error(err))
		return nil, errorcode.Detail(errorcode.DrivenGetDataSourceDetailFailed, err.Error())
	}

	defer resp.Body.Close()
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		log.WithContext(ctx).Error(drivenMsg+" io.ReadAll error", zap.Error(err))
		return nil, errorcode.Detail(errorcode.DrivenGetDataSourceDetailFailed, err.Error())
	}
	if resp.StatusCode == http.StatusOK {
		var res GetDataSourceDetailRes
		err = jsoniter.Unmarshal(body, &res)
		if err != nil {
			log.WithContext(ctx).Error(drivenMsg+" jsoniter.Unmarshal error", zap.Error(err))
			return nil, errorcode.Detail(errorcode.DrivenGetDataSourceDetailFailed, err.Error())
		}
		return &res, nil
	} else {
		if g, ok := ctx.(*gin.Context); ok {
			g.Set(interception.StatusCode, resp.StatusCode)
		}
		if resp.StatusCode == http.StatusBadRequest || resp.StatusCode == http.StatusInternalServerError || resp.StatusCode == http.StatusUnauthorized || resp.StatusCode == http.StatusForbidden {
			return nil, Unmarshal(ctx, body, drivenMsg)
		} else {
			log.WithContext(ctx).Error(drivenMsg+"http status error", zap.String("status", resp.Status), zap.String("body", string(body)))
			return nil, errorcode.Desc(errorcode.DrivenGetDataSourceDetailFailed, resp.StatusCode)
		}
	}
}

func Unmarshal(ctx context.Context, body []byte, drivenMsg string) error {
	var res rest.HttpError
	if err := jsoniter.Unmarshal(body, &res); err != nil {
		log.WithContext(ctx).Error(drivenMsg+" jsoniter.Unmarshal error", zap.Error(err))
		return errorcode.Detail(errorcode.DrivenGetDataSourceDetailFailed, err.Error())
	}
	return errorcode.New(res.Code, res.Description, res.Cause, res.Solution, res.Detail, "")
}
