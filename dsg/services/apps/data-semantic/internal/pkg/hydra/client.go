package hydra

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

// Client Hydra 客户端实现
type Client struct {
	adminAddress string
	httpClient   *http.Client
}

// NewClient 创建 Hydra 客户端
func NewClient(adminURL string, timeout time.Duration) *Client {
	return &Client{
		adminAddress: adminURL,
		httpClient: &http.Client{
			Timeout: timeout,
		},
	}
}

// Introspect token内省
func (c *Client) Introspect(ctx context.Context, token string) (info TokenIntrospectInfo, err error) {
	target := fmt.Sprintf("%s/admin/oauth2/introspect", c.adminAddress)
	req, err := http.NewRequestWithContext(ctx, "POST", target,
		bytes.NewReader([]byte(fmt.Sprintf("token=%v", token))))
	if err != nil {
		return
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return TokenIntrospectInfo{Active: false}, nil
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return
	}

	respParam := make(map[string]interface{})
	if unmarshalErr := json.Unmarshal(body, &respParam); unmarshalErr != nil {
		return TokenIntrospectInfo{}, unmarshalErr
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
		info.VisitorTyp = App
		return
	}

	// 以下字段 只在非客户端凭据模式时才存在
	// 访问者类型
	info.VisitorTyp = visitorTypeMap[respParam["ext"].(map[string]interface{})["visitor_type"].(string)]

	// 匿名用户
	if info.VisitorTyp == Anonymous {
		// 设备类型本身未解析,匿名时默认为web
		info.ClientTyp = Web
		return
	}

	// 实名用户
	if info.VisitorTyp == RealName {
		ext := respParam["ext"].(map[string]interface{})
		// 登陆IP
		info.LoginIP = ext["login_ip"].(string)
		// 设备ID
		info.Udid = ext["udid"].(string)
		// 登录账号类型
		info.AccountTyp = accountTypeMap[ext["account_type"].(string)]
		// 设备类型
		info.ClientTyp = clientTypeMap[ext["client_type"].(string)]
		return
	}

	return
}
