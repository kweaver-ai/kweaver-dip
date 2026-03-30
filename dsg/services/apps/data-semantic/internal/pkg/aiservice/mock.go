// Code scaffolded by goctl. Safe to edit.
// goctl 1.9.2

package aiservice

// MockClient 是用于测试的 Mock AI 服务客户端
type MockClient struct {
	baseURL string
}

// NewMockClient 创建一个新的 Mock 客户端
func NewMockClient() *MockClient {
	return &MockClient{
		baseURL: "http://mock-ai-service:8080",
	}
}

// Call 模拟调用 AI 服务
// 在测试环境中返回成功的模拟响应
func (c *MockClient) Call(requestType RequestType, messageID string, formView *FormView, token string) (*AIServiceResponse, error) {
	return &AIServiceResponse{
		TaskID:    "mock-task-" + messageID,
		Status:    "success",
		Message:   "Mock AI service call successful",
		MessageID: messageID,
	}, nil
}

// Ensure MockClient implements ClientInterface at compile time
var _ ClientInterface = (*MockClient)(nil)
