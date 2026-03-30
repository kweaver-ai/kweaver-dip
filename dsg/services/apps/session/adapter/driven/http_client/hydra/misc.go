package hydra

import (
	"context"
	"net/http"
)

// TokenIntrospectInfo 令牌内省结果
type TokenIntrospectInfo struct {
	Active     bool        // 令牌状态
	VisitorID  string      // 访问者ID
	Scope      string      // 权限范围
	ClientID   string      // 客户端ID
	VisitorTyp VisitorType // 访问者类型
	// 以下字段只在visitorType=1，即实名用户时才存在
	LoginIP    string      // 登陆IP
	Udid       string      // 设备码
	AccountTyp AccountType // 账户类型
	ClientTyp  ClientType  // 设备类型
}

// VisitorType 访问者类型
type VisitorType int32

// 访问者类型定义
const (
	RealName  VisitorType = 1 // 实名用户
	Anonymous VisitorType = 4 // 匿名用户
	Business  VisitorType = 5 // 应用账户  2.4
	App       VisitorType = 6 // 应用账户  2.6
)

// AccountType 登录账号类型
type AccountType int32

// 登录账号类型定义
const (
	Other  AccountType = 0
	IDCard AccountType = 1
)

// ClientType 设备类型
type ClientType int32

// 设备类型定义
const (
	Unknown ClientType = iota
	IOS
	Android
	WindowsPhone
	Windows
	MacOS
	Web
	MobileWeb
	Nas
	ConsoleWeb
	DeployWeb
	Linux
)

// Hydra 授权服务接口
type Hydra interface {
	// Introspect token内省
	Introspect(ctx context.Context, token string) (info TokenIntrospectInfo, err error)
	// AuthorizeRequest 授权请求
	AuthorizeRequest(ctx context.Context, responseType, accessHost, state string) (loginChallenge string, cookies []*http.Cookie, err error)
	// GetLoginRequestInformation 获取登录请求信息
	GetLoginRequestInformation(ctx context.Context, loginChallenge string) (deviceInfo *DeviceInfo, err error)
	// AcceptLoginRequest 接受登录请求
	AcceptLoginRequest(ctx context.Context, userID, loginChallenge string) (redirectURL string, err error)
	// VerifyLoginRequest 验证认证请求
	VerifyLoginRequest(ctx context.Context, redirectURL string, cookies []*http.Cookie) (consentChallenge string, newCookies []*http.Cookie, err error)
	// AcceptConsentRequest 接受授权请求
	AcceptConsentRequest(ctx context.Context, consentChallenge, clientType string) (redirectURL string, err error)
	// VerifyConsent 验证授权请求
	VerifyConsent(ctx context.Context, redirectURL, responseType string, cookies []*http.Cookie) (tInfo *TokenInfo, err error)
}

// DeviceInfo 设备信息
type DeviceInfo struct {
	Name        string
	ClientType  string
	Description string
}

// TokenInfo 单点登录响应参数
type TokenInfo struct {
	Code         string `json:"-"`
	AccessToken  string `json:"access_token"`
	IDToken      string `json:"id_token"`
	RefreshToken string `json:"refresh_token"`
	TokenType    string `json:"token_type"`
	Scope        string `json:"scope"`
	ExpirsesIn   int64  `json:"expires_in"`
	ResponseType string `json:"-"`
}
