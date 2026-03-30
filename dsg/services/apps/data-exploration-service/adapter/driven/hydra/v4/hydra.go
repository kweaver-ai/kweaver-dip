package v4

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"io/ioutil"
	"net/http"

	jsoniter "github.com/json-iterator/go"
	"github.com/kweaver-ai/TelemetrySDK-Go/exporter/v2/ar_trace"
	hydra2 "github.com/kweaver-ai/dsg/services/apps/data-exploration-service/adapter/driven/hydra"
	"github.com/kweaver-ai/dsg/services/apps/data-exploration-service/common/settings"
	log "github.com/kweaver-ai/idrm-go-frame/core/logx/zapx"
	"go.uber.org/zap"
)

type hydra struct {
	adminAddress   string
	client         *http.Client
	visitorTypeMap map[string]hydra2.VisitorType
	accountTypeMap map[string]hydra2.AccountType
	clientTypeMap  map[string]hydra2.ClientType
}

func NewHydra(client *http.Client) hydra2.Hydra {
	visitorTypeMap := map[string]hydra2.VisitorType{
		"realname":  hydra2.RealName,
		"anonymous": hydra2.Anonymous,
		"business":  hydra2.Business,
	}
	accountTypeMap := map[string]hydra2.AccountType{
		"other":   hydra2.Other,
		"id_card": hydra2.IDCard,
	}
	clientTypeMap := map[string]hydra2.ClientType{
		"unknown":       hydra2.Unknown,
		"ios":           hydra2.IOS,
		"android":       hydra2.Android,
		"windows_phone": hydra2.WindowsPhone,
		"windows":       hydra2.Windows,
		"mac_os":        hydra2.MacOS,
		"web":           hydra2.Web,
		"mobile_web":    hydra2.MobileWeb,
		"nas":           hydra2.Nas,
		"console_web":   hydra2.ConsoleWeb,
		"deploy_web":    hydra2.DeployWeb,
		"linux":         hydra2.Linux,
	}
	h := &hydra{
		adminAddress:   settings.GetConfig().OAuth.HydraAdmin,
		client:         client,
		visitorTypeMap: visitorTypeMap,
		accountTypeMap: accountTypeMap,
		clientTypeMap:  clientTypeMap,
	}
	return h
}

// Introspect token内省
func (h *hydra) Introspect(ctx context.Context, token string) (info hydra2.TokenIntrospectInfo, err error) {
	ctx, span := ar_trace.Tracer.Start(ctx, "Introspect")
	defer span.End()

	target := fmt.Sprintf("%v/oauth2/introspect", h.adminAddress)
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, target, bytes.NewReader([]byte(fmt.Sprintf("token=%v", token))))
	if err != nil {
		log.Errorf("Introspect NewRequest err, err: %v", err)
	}

	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	resp, err := h.client.Do(req)
	if err != nil {
		log.Errorf("Introspect Post err, err: %v", err)
		return
	}

	defer func() {
		closeErr := resp.Body.Close()
		if closeErr != nil {
			log.Error("Introspect Post", zap.Error(closeErr))
		}
	}()

	body, err := ioutil.ReadAll(resp.Body)
	if (resp.StatusCode < http.StatusOK) || (resp.StatusCode >= http.StatusMultipleChoices) {
		err = errors.New(string(body))
		return
	}

	respParam := make(map[string]interface{})
	err = jsoniter.Unmarshal(body, &respParam)
	if err != nil {
		return
	}

	// 令牌状态
	info.Active = respParam["active"].(bool)
	if !info.Active {
		return
	}

	// 访问者ID
	info.VisitorID = respParam["sub"].(string)
	// Scope 权限范围
	info.Scope = respParam["scope"].(string)
	// 客户端ID
	info.ClientID = respParam["client_id"].(string)
	// 客户端凭据模式
	if info.VisitorID == info.ClientID {
		info.VisitorTyp = hydra2.Business
		return
	}
	// 以下字段 只在非客户端凭据模式时才存在
	// 访问者类型
	info.VisitorTyp = h.visitorTypeMap[respParam["ext"].(map[string]interface{})["visitor_type"].(string)]

	// 匿名用户
	if info.VisitorTyp == hydra2.Anonymous {
		return
	}

	// 实名用户
	if info.VisitorTyp == hydra2.RealName {
		// 登陆IP
		info.LoginIP = respParam["ext"].(map[string]interface{})["login_ip"].(string)
		// 设备ID
		info.Udid = respParam["ext"].(map[string]interface{})["udid"].(string)
		// 登录账号类型
		info.AccountTyp = h.accountTypeMap[respParam["ext"].(map[string]interface{})["account_type"].(string)]
		// 设备类型
		info.ClientTyp = h.clientTypeMap[respParam["ext"].(map[string]interface{})["client_type"].(string)]
		return
	}

	return
}
