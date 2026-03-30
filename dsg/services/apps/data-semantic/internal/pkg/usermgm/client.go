package usermgm

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

// DepInfo 部门信息
type DepInfo struct {
	OrgCode string `json:"org_code"`
	OrgName string `json:"org_name"`
}

// Client 用户管理服务客户端
type Client struct {
	baseURL    string
	httpClient *http.Client
}

// NewClient 创建用户管理服务客户端
func NewClient(url string, timeout time.Duration) *Client {
	if url == "" {
		return nil
	}
	return &Client{
		baseURL: fmt.Sprintf("%s/api/user-management", url),
		httpClient: &http.Client{
			Timeout: timeout,
		},
	}
}

// GetUserNameByUserID 通过用户ID获取用户名
// 参考 D:\go\idrm-go-common\rest\user_management\user_management.go
func (c *Client) GetUserNameByUserID(ctx context.Context, userID string) (name string, isNormalUser bool, depInfos []*DepInfo, err error) {
	if c == nil {
		// 未配置 UserManagement 服务时返回默认值
		return userID, true, nil, nil
	}

	// API 格式: /api/user-management/v1/users/{userID}/roles,name,parent_deps
	fields := "roles,name,parent_deps"
	url := fmt.Sprintf("%s/v1/users/%s/%s", c.baseURL, userID, fields)

	req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
	if err != nil {
		return "", false, nil, err
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return "", false, nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", false, nil, fmt.Errorf("UserManagement service returned status %d", resp.StatusCode)
	}

	var result []interface{}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return "", false, nil, err
	}

	if len(result) == 0 {
		return "", false, nil, fmt.Errorf("user not found: %s", userID)
	}

	// 解析第一个元素
	info := result[0].(map[string]interface{})
	name = info["name"].(string)

	// 解析 roles 检查是否为普通用户
	roles := info["roles"].([]interface{})
	for _, r := range roles {
		if r.(string) == "normal_user" {
			isNormalUser = true
			break
		}
	}

	// 解析 parent_deps
	parentDeps := info["parent_deps"].([]interface{})
	for _, parentDep := range parentDeps {
		deps := parentDep.([]interface{})
		if len(deps) > 0 {
			// 取最后一个部门（当前直属部门）
			dep := deps[len(deps)-1].(map[string]interface{})
			depInfos = append(depInfos, &DepInfo{
				OrgCode: dep["id"].(string),
				OrgName: dep["name"].(string),
			})
		}
	}

	return name, isNormalUser, depInfos, nil
}
