package middleware

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/data-semantic/internal/pkg/usermgm"
)

// UserInfo 用户信息
type UserInfo struct {
	ID        string             // 用户 ID
	Name      string             // 用户名称
	OrgInfos  []*usermgm.DepInfo // 组织信息
	UserType  int                // 用户类型 (TokenTypeUser 或 TokenTypeClient)
}

// context key 常量（与 idrm-go-common/interception 兼容）
const (
	InfoName = "info" // 用户信息 context key
	Token    = "token" // Bearer token context key
)

// BearerToken context key
const contextKeyBearerToken = "GoCommon/interception.BearerToken"

// TokenType Token 类型
const TokenType = "token_type"

// TokenType 常量
const (
	TokenTypeUser = iota // 用户 Token
	TokenTypeClient      // 应用 Token
)

// NewContextWithBearerToken 生成一个包含 BearerToken 的 context.Context
func NewContextWithBearerToken(parent context.Context, t string) context.Context {
	return context.WithValue(parent, contextKeyBearerToken, t)
}
