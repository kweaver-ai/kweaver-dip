package agentretrieval

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

// Client represents the agent-retrieval service client
type Client struct {
	baseURL    string
	httpClient *http.Client
}

// 确保 Client 实现 ClientInterface
var _ ClientInterface = (*Client)(nil)

// AccountInfo 账户信息
type AccountInfo struct {
	UserID   string
	UserType string
}

// ClientInterface 定义客户端接口
type ClientInterface interface {
	// QueryObjectInstance 使用自定义条件查询对象实例
	QueryObjectInstance(ctx context.Context, knId, otId string, condition Condition, limit int, accountInfo AccountInfo) ([]InstanceData, error)
}

// NewClient creates a new agent-retrieval service client
func NewClient(baseURL string, timeout time.Duration) *Client {
	if timeout == 0 {
		timeout = 30 * time.Second // 默认30秒超时
	}
	return &Client{
		baseURL: baseURL,
		httpClient: &http.Client{
			Timeout: timeout,
		},
	}
}

// QueryObjectInstance 使用自定义条件查询对象实例
func (c *Client) QueryObjectInstance(ctx context.Context, knId, otId string, condition Condition, limit int, accountInfo AccountInfo) ([]InstanceData, error) {
	// 构建请求体
	reqBody := QueryObjectInstanceRequest{
		Limit:     limit,
		Condition: condition,
	}

	bodyBytes, err := json.Marshal(reqBody)
	if err != nil {
		return nil, fmt.Errorf("marshal request error: %w", err)
	}

	// 构建 URL
	url := fmt.Sprintf("%s/api/agent-retrieval/in/v1/kn/query_object_instance?kn_id=%s&ot_id=%s", c.baseURL, knId, otId)

	// 创建 HTTP 请求
	httpReq, err := http.NewRequestWithContext(ctx, "POST", url, bytes.NewReader(bodyBytes))
	if err != nil {
		return nil, fmt.Errorf("create request error: %w", err)
	}
	httpReq.Header.Set("Content-Type", "application/json")

	// 设置账户信息 Header
	httpReq.Header.Set("x-account-id", accountInfo.UserID)
	httpReq.Header.Set("x-account-type", accountInfo.UserType)

	// 发送请求
	resp, err := c.httpClient.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("do request error: %w", err)
	}
	defer resp.Body.Close()

	// 读取响应体
	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("read response body error: %w", err)
	}

	// 检查 HTTP 状态码
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("http status error: %d, body: %s", resp.StatusCode, string(respBody))
	}

	// 解析响应
	var result QueryObjectInstanceResponse
	if err := json.Unmarshal(respBody, &result); err != nil {
		return nil, fmt.Errorf("decode response error: %w", err)
	}

	return result.Datas, nil
}
