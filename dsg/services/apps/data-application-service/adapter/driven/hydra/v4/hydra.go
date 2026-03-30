package v4

import (
	"bytes"

	"context"
	"errors"
	"fmt"
	"io/ioutil"
	"net/http"

	jsoniter "github.com/json-iterator/go"
	Ihydra "github.com/kweaver-ai/dsg/services/apps/data-application-service/adapter/driven/hydra"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/common/settings"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"go.uber.org/zap"
)

type hydra struct {
	adminAddress   string
	client         *http.Client
	visitorTypeMap map[string]Ihydra.VisitorType
	accountTypeMap map[string]Ihydra.AccountType
	clientTypeMap  map[string]Ihydra.ClientType
}

func NewHydra(client *http.Client) Ihydra.Hydra {
	visitorTypeMap := map[string]Ihydra.VisitorType{
		"realname":  Ihydra.RealName,
		"anonymous": Ihydra.Anonymous,
		"business":  Ihydra.Business,
	}
	accountTypeMap := map[string]Ihydra.AccountType{
		"other":   Ihydra.Other,
		"id_card": Ihydra.IDCard,
	}
	clientTypeMap := map[string]Ihydra.ClientType{
		"unknown":       Ihydra.Unknown,
		"ios":           Ihydra.IOS,
		"android":       Ihydra.Android,
		"windows_phone": Ihydra.WindowsPhone,
		"windows":       Ihydra.Windows,
		"mac_os":        Ihydra.MacOS,
		"web":           Ihydra.Web,
		"mobile_web":    Ihydra.MobileWeb,
		"nas":           Ihydra.Nas,
		"console_web":   Ihydra.ConsoleWeb,
		"deploy_web":    Ihydra.DeployWeb,
		"linux":         Ihydra.Linux,
	}
	h := &hydra{
		adminAddress:   fmt.Sprintf("%s", settings.Instance.Services.HydraAdmin),
		client:         client,
		visitorTypeMap: visitorTypeMap,
		accountTypeMap: accountTypeMap,
		clientTypeMap:  clientTypeMap,
	}
	return h
}

// Introspect token内省
func (h *hydra) Introspect(ctx context.Context, token string) (info Ihydra.TokenIntrospectInfo, err error) {
	//newCtx, span := trace_util.StartSpan(ctx)
	//defer span.End()

	target := fmt.Sprintf("%v/oauth2/introspect", h.adminAddress)
	req, err := http.NewRequest(http.MethodPost, target, bytes.NewReader([]byte(fmt.Sprintf("token=%v", token))))
	if err != nil {
		log.WithContext(ctx).Error("Introspect NewRequest", zap.Error(err))
		return
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	resp, err := h.client.Do(req.WithContext(ctx))
	if err != nil {
		log.WithContext(ctx).Error("Introspect Post", zap.Error(err))
		return
	}

	defer func() {
		closeErr := resp.Body.Close()
		if closeErr != nil {
			log.WithContext(ctx).Error("Introspect Post", zap.Error(closeErr))
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
		info.VisitorTyp = Ihydra.Business
		return
	}
	// 以下字段 只在非客户端凭据模式时才存在
	// 访问者类型
	info.VisitorTyp = h.visitorTypeMap[respParam["ext"].(map[string]interface{})["visitor_type"].(string)]

	// 匿名用户
	if info.VisitorTyp == Ihydra.Anonymous {
		return
	}

	// 实名用户
	if info.VisitorTyp == Ihydra.RealName {
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
