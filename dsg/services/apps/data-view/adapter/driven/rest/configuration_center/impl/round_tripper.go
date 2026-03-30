package impl

import (
	"net/http"

	"github.com/kweaver-ai/idrm-go-common/interception"
)

// NewRoundTripper 创建 http.RoundTripper
func NewRoundTripper(cfg *Config) (tr http.RoundTripper, err error) {
	// 最底层的 round tripper 使用 http.DefaultTransport
	tr = http.DefaultTransport
	// 设置认证用的 round tripper
	tr = NewAuthRoundTripper(tr)
	return
}

// AuthRoundTripper 向 request 的 header 添加认证信息。
type AuthRoundTripper struct {
	// 下一层的 round tripper
	rt http.RoundTripper
}

var _ http.RoundTripper = &AuthRoundTripper{}

// NewAuthRoundTripper 创建 AuthRoundTripper
func NewAuthRoundTripper(rt http.RoundTripper) http.RoundTripper {
	return &AuthRoundTripper{rt: rt}
}

// RoundTrip implements http.RoundTripper.
func (rt *AuthRoundTripper) RoundTrip(req *http.Request) (*http.Response, error) {
	// 如果已经设置过认证信息则跳过
	if req.Header.Get("Authorization") != "" {
		return rt.rt.RoundTrip(req)
	}

	// 从 context 获取 token id 作为认证信息
	tokenID, ok := req.Context().Value(interception.Token).(string)
	if !ok || tokenID == "" {
		return rt.rt.RoundTrip(req)
	}

	req.Header.Set("Authorization", tokenID)
	return rt.rt.RoundTrip(req)
}
