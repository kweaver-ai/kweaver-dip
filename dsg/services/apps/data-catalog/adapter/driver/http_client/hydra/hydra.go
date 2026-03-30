package hydra

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"io/ioutil"
	"net/http"

	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/trace"

	jsoniter "github.com/json-iterator/go"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/settings"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"go.uber.org/zap"
)

type hydra struct {
	adminAddress   string
	client         *http.Client
	visitorTypeMap map[string]VisitorType
	accountTypeMap map[string]AccountType
	clientTypeMap  map[string]ClientType
}

func NewHydra(client *http.Client) Hydra {
	visitorTypeMap := map[string]VisitorType{
		"realname":  RealName,
		"anonymous": Anonymous,
		"business":  Business,
	}
	accountTypeMap := map[string]AccountType{
		"other":   Other,
		"id_card": IDCard,
	}
	clientTypeMap := map[string]ClientType{
		"unknown":       Unknown,
		"ios":           IOS,
		"android":       Android,
		"windows_phone": WindowsPhone,
		"windows":       Windows,
		"mac_os":        MacOS,
		"web":           Web,
		"mobile_web":    MobileWeb,
		"nas":           Nas,
		"console_web":   ConsoleWeb,
		"deploy_web":    DeployWeb,
		"linux":         Linux,
	}
	h := &hydra{
		adminAddress:   settings.GetConfig().OauthConf.HydraAdmin,
		client:         client,
		visitorTypeMap: visitorTypeMap,
		accountTypeMap: accountTypeMap,
		clientTypeMap:  clientTypeMap,
	}
	return h
}

// Introspect token内省
func (h *hydra) Introspect(ctx context.Context, token string) (info TokenIntrospectInfo, err error) {
	ctx, span := trace.StartInternalSpan(ctx)
	defer func() { trace.TelemetrySpanEnd(span, err) }()
	target := fmt.Sprintf("%v/admin/oauth2/introspect", h.adminAddress)
	//resp, err := h.client.Post(target, "application/x-www-form-urlencoded",
	//	bytes.NewReader([]byte(fmt.Sprintf("token=%v", token))))
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, target, bytes.NewReader([]byte(fmt.Sprintf("token=%v", token))))
	if err != nil {
		log.WithContext(ctx).Error("Introspect NewRequest", zap.Error(err))
		return
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	resp, err := h.client.Do(req)
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
		info.VisitorTyp = Business
		return
	}
	// 以下字段 只在非客户端凭据模式时才存在
	// 访问者类型
	info.VisitorTyp = h.visitorTypeMap[respParam["ext"].(map[string]interface{})["visitor_type"].(string)]

	// 匿名用户
	if info.VisitorTyp == Anonymous {
		return
	}

	// 实名用户
	if info.VisitorTyp == RealName {
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
