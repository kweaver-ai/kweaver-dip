package v6

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"sync"

	jsoniter "github.com/json-iterator/go"
	Ihydra "github.com/kweaver-ai/dsg/services/apps/session/adapter/driven/http_client/hydra"
	"github.com/kweaver-ai/dsg/services/apps/session/common/settings"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/trace"
	af_trace "github.com/kweaver-ai/idrm-go-frame/core/telemetry/trace"
	"go.uber.org/zap"
)

const OAUTH2_DEFAULT_SCOPE = "openid offline all"

type hydra struct {
	adminAddress          string
	publicAddress         string
	client                *http.Client
	disableRedirectClient *http.Client
	visitorTypeMap        map[string]Ihydra.VisitorType
	accountTypeMap        map[string]Ihydra.AccountType
}

var (
	hOnce sync.Once
	h     *hydra
)

var clientTypeMap = map[string]Ihydra.ClientType{
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

// NewHydra 创建授权服务
func NewHydra(client *http.Client) Ihydra.Hydra {
	hOnce.Do(func() {
		visitorTypeMap := map[string]Ihydra.VisitorType{
			"realname":  Ihydra.RealName,
			"anonymous": Ihydra.Anonymous,
			"business":  Ihydra.App,
		}
		accountTypeMap := map[string]Ihydra.AccountType{
			"other":   Ihydra.Other,
			"id_card": Ihydra.IDCard,
		}
		h = &hydra{
			adminAddress:          settings.ConfigInstance.Config.DepServices.HydraAdmin,
			publicAddress:         settings.ConfigInstance.Config.DepServices.HydraPublic,
			client:                client,
			disableRedirectClient: af_trace.NewOtelHttpClient(),
			visitorTypeMap:        visitorTypeMap,
			accountTypeMap:        accountTypeMap,
		}
		h.disableRedirectClient.CheckRedirect = func(req *http.Request, via []*http.Request) error {
			return http.ErrUseLastResponse
		}
	})

	return h
}

// Introspect token内省
func (h *hydra) Introspect(ctx context.Context, token string) (info Ihydra.TokenIntrospectInfo, err error) {
	ctx, span := trace.StartInternalSpan(ctx)
	defer func() { trace.TelemetrySpanEnd(span, err) }()
	target := fmt.Sprintf("%v/admin/oauth2/introspect", h.adminAddress)
	//resp, err := h.client.Post(target, "application/x-www-form-urlencoded",
	//	bytes.NewReader([]byte(fmt.Sprintf("token=%v", token))))
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
			//common.NewLogger().Errorln(closeErr)
			log.WithContext(ctx).Error("Introspect resp.Body.Close", zap.Error(closeErr))

		}
	}()

	body, err := io.ReadAll(resp.Body)
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
		info.VisitorTyp = Ihydra.App
		return
	}
	// 以下字段 只在非客户端凭据模式时才存在
	// 访问者类型
	info.VisitorTyp = h.visitorTypeMap[respParam["ext"].(map[string]interface{})["visitor_type"].(string)]

	// 匿名用户
	if info.VisitorTyp == Ihydra.Anonymous {
		// 文档库访问规则接口考虑后续扩展性，clientType为必传。本身规则计算未使用clientType
		// 设备类型本身未解析,匿名时默认为web
		info.ClientTyp = Ihydra.Web
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
		info.ClientTyp = clientTypeMap[respParam["ext"].(map[string]interface{})["client_type"].(string)]
		return
	}

	return
}

// AuthorizeRequest 授权请求
func (h *hydra) AuthorizeRequest(ctx context.Context, responseType, accessHost, state string) (loginChallenge string, cookies []*http.Cookie, err error) {
	var (
		target  string
		req     *http.Request
		res     *http.Response
		resBody []byte
		u       *url.URL
	)

	target = fmt.Sprintf("%s/oauth2/auth?client_id=%v&redirect_uri=%v&response_type=%v&scope=%v&state=%v&nonce=%v",
		h.publicAddress, settings.ConfigInstance.Config.Oauth.OauthClientID,
		url.PathEscape(fmt.Sprintf("%s/af/api/session/v1/login/callback", accessHost)), url.QueryEscape(responseType),
		url.QueryEscape(OAUTH2_DEFAULT_SCOPE), state, state)

	if req, err = http.NewRequestWithContext(ctx, http.MethodGet, target, http.NoBody); err != nil {
		log.WithContext(ctx).Errorf("AuthorizeRequest NewRequestWithContext", zap.Error(err))
		return
	}
	if res, err = h.disableRedirectClient.Do(req); err != nil {
		log.WithContext(ctx).Errorf("AuthorizeRequest Get", zap.Error(err))
		return
	}
	defer func() {
		closeErr := res.Body.Close()
		if closeErr != nil {
			log.WithContext(ctx).Errorf("AuthorizeRequest resp.Body.Close", zap.Error(closeErr))
		}
	}()
	if resBody, err = io.ReadAll(res.Body); err != nil {
		log.WithContext(ctx).Errorf("AuthorizeRequest read resp.body", zap.Error(err))
		return
	}

	switch {
	case res.StatusCode == http.StatusFound:
	case res.StatusCode == http.StatusSeeOther:
	case res.StatusCode >= http.StatusBadRequest && res.StatusCode < http.StatusInternalServerError:
		fallthrough
	default:
		err = fmt.Errorf("code:%v,header:%v,body:%v", res.StatusCode, res.Header, string(resBody))
		log.WithContext(ctx).Errorf("AuthorizeRequest Get", zap.Error(err))
		return
	}

	if u, err = url.Parse(res.Header.Get("Location")); err != nil {
		log.WithContext(ctx).Errorf("AuthorizeRequest parse resp.header.Location", zap.Error(err))
		return
	}

	// 检查login_challenge存在
	loginChallenges, ok := u.Query()["login_challenge"]
	if !ok {
		err = errors.New("login_challenge not existed")
		log.WithContext(ctx).Errorf("AuthorizeRequest fetch login_challenge", zap.Error(err))
		return
	}

	return loginChallenges[0], res.Cookies(), nil
}

// GetLoginRequestInformation 获取登录请求信息
func (h *hydra) GetLoginRequestInformation(ctx context.Context, loginChallenge string) (deviceInfo *Ihydra.DeviceInfo, err error) {
	var (
		target  string
		req     *http.Request
		res     *http.Response
		body    []byte
		resBody interface{}
	)
	target = fmt.Sprintf("%s/admin/oauth2/auth/requests/login?login_challenge=%s", h.adminAddress, loginChallenge)
	if req, err = http.NewRequestWithContext(ctx, http.MethodGet, target, http.NoBody); err != nil {
		log.WithContext(ctx).Errorf("GetLoginRequestInformation NewRequestWithContext", zap.Error(err))
		return
	}
	if res, err = h.disableRedirectClient.Do(req); err != nil {
		log.WithContext(ctx).Errorf("GetLoginRequestInformation Get", zap.Error(err))
		return
	}
	defer func() {
		closeErr := res.Body.Close()
		if closeErr != nil {
			log.WithContext(ctx).Error("GetLoginRequestInformation resp.Body.Close", zap.Error(closeErr))
		}
	}()
	if body, err = io.ReadAll(res.Body); err != nil {
		log.WithContext(ctx).Errorf("GetLoginRequestInformation read resp.body", zap.Error(err))
		return
	}
	if res.StatusCode != http.StatusOK {
		err = fmt.Errorf("code:%v,header:%v,body:%v", res.StatusCode, res.Header, string(body))
		log.WithContext(ctx).Errorf("GetLoginRequestInformation Get", zap.Error(err))
		return
	}

	if err = jsoniter.Unmarshal(body, &resBody); err != nil {
		log.WithContext(ctx).Errorf("GetLoginRequestInformation Unmarshal resp.body", zap.Error(err))
		return
	}

	description := ""
	name := ""
	clientType := ""
	deviceObj := resBody.(map[string]interface{})["client"].(map[string]interface{})["metadata"].(map[string]interface{})["device"]
	if deviceObj != nil {
		device := deviceObj.(map[string]interface{})
		if device["description"] != nil {
			description = device["description"].(string)
		}
		if device["name"] != nil {
			name = device["name"].(string)
		}
		if device["client_type"] != nil {
			clientType = device["client_type"].(string)
		}
	}

	return &Ihydra.DeviceInfo{
		ClientType:  clientType,
		Description: description,
		Name:        name,
	}, nil
}

// AcceptLoginRequest 接受登录请求
func (h *hydra) AcceptLoginRequest(ctx context.Context, userID, loginChallenge string) (redirectURL string, err error) {
	var (
		payload, body []byte
		req           *http.Request
		res           *http.Response
		resBody       interface{}
	)
	permInfo := map[string]interface{}{
		"subject": userID,
	}
	if payload, err = json.Marshal(permInfo); err != nil {
		log.WithContext(ctx).Errorf("AcceptLoginRequest Marshal payload", zap.Error(err))
		return
	}

	target := fmt.Sprintf("%s/admin/oauth2/auth/requests/login/accept?login_challenge=%v", h.adminAddress, loginChallenge)
	if req, err = http.NewRequestWithContext(ctx, http.MethodPut, target, bytes.NewBuffer(payload)); err != nil {
		log.WithContext(ctx).Errorf("AcceptLoginRequest NewRequestWithContext", zap.Error(err))
		return
	}
	if res, err = h.disableRedirectClient.Do(req); err != nil {
		log.WithContext(ctx).Errorf("AcceptLoginRequest Put", zap.Error(err))
		return
	}
	defer func() {
		closeErr := res.Body.Close()
		if closeErr != nil {
			log.WithContext(ctx).Error("AcceptLoginRequest resp.Body.Close", zap.Error(closeErr))
		}
	}()

	if body, err = io.ReadAll(res.Body); err != nil {
		log.WithContext(ctx).Errorf("AcceptLoginRequest read resp.body", zap.Error(err))
		return
	}

	if res.StatusCode != http.StatusOK {
		err = fmt.Errorf("code:%v,header:%v,body:%v", res.StatusCode, res.Header, string(body))
		log.WithContext(ctx).Errorf("AcceptLoginRequest Get", zap.Error(err))
		return
	}

	if err = jsoniter.Unmarshal(body, &resBody); err != nil {
		log.WithContext(ctx).Errorf("AcceptLoginRequest Unmarshal resp.body", zap.Error(err))
		return
	}

	return resBody.(map[string]interface{})["redirect_to"].(string), nil
}

// VerifyLoginRequest 验证认证请求
func (h *hydra) VerifyLoginRequest(ctx context.Context, redirectURL string, cookies []*http.Cookie) (consentChallenge string, newCookies []*http.Cookie, err error) {
	var (
		req  *http.Request
		res  *http.Response
		u    *url.URL
		body []byte
	)
	if req, err = http.NewRequestWithContext(ctx, http.MethodGet, redirectURL, http.NoBody); err != nil {
		log.WithContext(ctx).Errorf("VerifyLoginRequest NewRequestWithContext", zap.Error(err))
		return
	}
	for _, cookie := range cookies {
		req.AddCookie(cookie)
	}
	if res, err = h.disableRedirectClient.Do(req); err != nil {
		log.WithContext(ctx).Errorf("VerifyLoginRequest Get", zap.Error(err))
		return
	}
	defer func() {
		closeErr := res.Body.Close()
		if closeErr != nil {
			log.WithContext(ctx).Error("VerifyLoginRequest resp.Body.Close", zap.Error(closeErr))
		}
	}()
	if body, err = io.ReadAll(res.Body); err != nil {
		log.WithContext(ctx).Errorf("VerifyLoginRequest read resp.body", zap.Error(err))
		return
	}
	switch {
	case res.StatusCode == http.StatusFound:
	case res.StatusCode == http.StatusSeeOther:
	case res.StatusCode >= http.StatusBadRequest && res.StatusCode < http.StatusInternalServerError:
		fallthrough
	default:
		err = fmt.Errorf("code:%v,header:%v,body:%v", res.StatusCode, res.Header, string(body))
		log.WithContext(ctx).Errorf("VerifyLoginRequest Get", zap.Error(err))
		return
	}

	if u, err = url.Parse(res.Header.Get("Location")); err != nil {
		log.WithContext(ctx).Errorf("VerifyLoginRequest parse resp.header.Location", zap.Error(err))
		return
	}

	// 检查consent_challenge存在
	consentChallenges, ok := u.Query()["consent_challenge"]
	if !ok {
		err = errors.New("consent_challenge not existed")
		log.WithContext(ctx).Errorf("VerifyLoginRequest fetch consent_challenge", zap.Error(err))
		return
	}

	return consentChallenges[0], res.Cookies(), nil
}

// AcceptConsentRequest 接受授权请求
func (h *hydra) AcceptConsentRequest(ctx context.Context, consentChallenge, clientType string) (redirectURL string, err error) {
	var (
		payload, body []byte
		req           *http.Request
		res           *http.Response
		resBody       interface{}
	)
	context := map[string]any{
		"account_type": "other",
		"client_type":  clientType,
		"login_ip":     "",
		"udid":         "",
		"visitor_type": "realname",
	}
	scopeArr := strings.Split(OAUTH2_DEFAULT_SCOPE, " ")
	permInfo := map[string]interface{}{
		"grant_scope": scopeArr,
		"session": map[string]interface{}{
			"access_token": context,
		},
	}
	if payload, err = json.Marshal(permInfo); err != nil {
		log.WithContext(ctx).Errorf("AcceptConsentRequest Marshal payload", zap.Error(err))
		return
	}

	target := fmt.Sprintf("%s/admin/oauth2/auth/requests/consent/accept?consent_challenge=%s", h.adminAddress, consentChallenge)
	if req, err = http.NewRequestWithContext(ctx, http.MethodPut, target, bytes.NewBuffer(payload)); err != nil {
		log.WithContext(ctx).Errorf("AcceptConsentRequest NewRequestWithContext", zap.Error(err))
		return
	}
	if res, err = h.disableRedirectClient.Do(req); err != nil {
		log.WithContext(ctx).Errorf("AcceptConsentRequest Put", zap.Error(err))
		return
	}
	defer func() {
		closeErr := res.Body.Close()
		if closeErr != nil {
			log.WithContext(ctx).Error("AcceptConsentRequest resp.Body.Close", zap.Error(closeErr))
		}
	}()
	if body, err = io.ReadAll(res.Body); err != nil {
		log.WithContext(ctx).Errorf("AcceptConsentRequest read resp.body", zap.Error(err))
		return
	}

	if res.StatusCode != http.StatusOK {
		err = fmt.Errorf("code:%v,header:%v,body:%v", res.StatusCode, res.Header, string(body))
		log.WithContext(ctx).Errorf("AcceptConsentRequest Put", zap.Error(err))
		return
	}

	if err = jsoniter.Unmarshal(body, &resBody); err != nil {
		log.WithContext(ctx).Errorf("AcceptConsentRequest Unmarshal resp.body", zap.Error(err))
		return
	}

	return resBody.(map[string]interface{})["redirect_to"].(string), nil
}

// VerifyConsent 验证授权请求
func (h *hydra) VerifyConsent(ctx context.Context, redirectURL, responseType string, cookies []*http.Cookie) (tInfo *Ihydra.TokenInfo, err error) {
	var (
		req  *http.Request
		res  *http.Response
		u    *url.URL
		f    url.Values
		body []byte
	)
	if req, err = http.NewRequestWithContext(ctx, http.MethodGet, redirectURL, http.NoBody); err != nil {
		log.WithContext(ctx).Errorf("VerifyConsent NewRequestWithContext", zap.Error(err))
		return
	}
	for _, cookie := range cookies {
		req.AddCookie(cookie)
	}
	if res, err = h.disableRedirectClient.Do(req); err != nil {
		log.WithContext(ctx).Errorf("VerifyConsent Get", zap.Error(err))
		return
	}
	defer func() {
		closeErr := res.Body.Close()
		if closeErr != nil {
			log.WithContext(ctx).Error("VerifyConsent resp.Body.Close", zap.Error(closeErr))
		}
	}()
	if body, err = io.ReadAll(res.Body); err != nil {
		log.WithContext(ctx).Errorf("VerifyConsent read resp.body", zap.Error(err))
		return
	}
	switch {
	case res.StatusCode == http.StatusFound:
	case res.StatusCode == http.StatusSeeOther:
	case res.StatusCode >= http.StatusBadRequest && res.StatusCode < http.StatusInternalServerError:
		fallthrough
	default:
		err = fmt.Errorf("code:%v,header:%v,body:%v", res.StatusCode, res.Header, string(body))
		log.WithContext(ctx).Errorf("VerifyConsent Get", zap.Error(err))
		return
	}

	if u, err = url.Parse(res.Header.Get("Location")); err != nil {
		log.WithContext(ctx).Errorf("VerifyConsent parse resp.header.Location", zap.Error(err))
		return
	}

	tInfo = &Ihydra.TokenInfo{}
	switch responseType {
	case "code":
		code := u.Query()["code"][0]
		scope := u.Query()["scope"][0]
		if (code != "") && (scope != "") {
			tInfo.Code = code
			tInfo.Scope = scope
			tInfo.ResponseType = "code"
		} else {
			err = fmt.Errorf("code not existed")
			log.WithContext(ctx).Errorf("VerifyConsent fetch code", zap.Error(err))
			return
		}
	case "token":
		f, err = url.ParseQuery(u.Fragment)
		if err != nil {
			tInfo = nil
			return
		}
		AccessToken := f.Get("access_token")
		ExpirsesIn := f.Get("expires_in")
		Scope := f.Get("scope")
		TokenType := f.Get("token_type")

		if (AccessToken == "") || (ExpirsesIn == "") || (Scope == "") || (TokenType == "") {
			err = fmt.Errorf("token not existed")
			log.WithContext(ctx).Errorf("VerifyConsent fetch token", zap.Error(err))
			tInfo = nil
			return
		}

		tInfo.AccessToken = AccessToken
		tInfo.ExpirsesIn, err = strconv.ParseInt(ExpirsesIn, 10, 64)
		if err != nil {
			tInfo = nil
			return
		}
		tInfo.Scope = Scope
		tInfo.TokenType = TokenType
	case "token id_token":
		f, err = url.ParseQuery(u.Fragment)
		if err != nil {
			tInfo = nil
			return
		}

		AccessToken := f.Get("access_token")
		ExpirsesIn := f.Get("expires_in")
		IDToken := f.Get("id_token")
		Scope := f.Get("scope")
		TokenType := f.Get("token_type")

		if (AccessToken == "") || (ExpirsesIn == "") || (IDToken == "") || (Scope == "") || (TokenType == "") {
			err = fmt.Errorf("token id_token not existed")
			log.WithContext(ctx).Errorf("VerifyConsent fetch token id_token", zap.Error(err))
			tInfo = nil
			return
		}

		tInfo.AccessToken = AccessToken
		tInfo.ExpirsesIn, err = strconv.ParseInt(ExpirsesIn, 10, 64)
		if err != nil {
			return nil, err
		}
		tInfo.IDToken = IDToken
		tInfo.Scope = Scope
		tInfo.TokenType = TokenType
		tInfo.ResponseType = "token id_token"
	}

	return tInfo, nil
}
