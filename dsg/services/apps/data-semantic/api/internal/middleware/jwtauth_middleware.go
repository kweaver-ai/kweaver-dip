// Code scaffolded by goctl. Safe to edit.

package middleware

import (
	"context"
	"net/http"
	"strings"

	"github.com/kweaver-ai/dsg/services/apps/data-semantic/internal/pkg/hydra"
	"github.com/kweaver-ai/dsg/services/apps/data-semantic/internal/pkg/usermgm"
	"github.com/zeromicro/go-zero/core/logx"

	errcode "github.com/kweaver-ai/dsg/services/apps/data-semantic/api/internal/errorx"
)

type JWTAuthMiddleware struct {
	hydraClient   *hydra.Client
	userMgmClient *usermgm.Client
}

func NewJWTAuthMiddleware(hydraClient *hydra.Client, userMgmClient *usermgm.Client) *JWTAuthMiddleware {
	return &JWTAuthMiddleware{
		hydraClient:   hydraClient,
		userMgmClient: userMgmClient,
	}
}

func (m *JWTAuthMiddleware) Handle(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		newCtx := r.Context()

		// 提取 token
		tokenID := r.Header.Get("Authorization")
		token := strings.TrimPrefix(tokenID, "Bearer ")
		if tokenID == "" || token == "" {
			AbortResponseWithCode(w, http.StatusUnauthorized, errcode.Desc(errcode.NotAuthentication))
			return
		}

		// 调用 Hydra introspect
		info, err := m.hydraClient.Introspect(newCtx, token)
		if err != nil {
			logx.WithContext(r.Context()).Error("Token Introspect", "error", err)
			AbortResponseWithCode(w, http.StatusBadRequest, errcode.Desc(errcode.HydraException))
			return
		}
		if !info.Active {
			AbortResponseWithCode(w, http.StatusUnauthorized, errcode.Desc(errcode.AuthenticationFailure))
			return
		}

		// 保存 Bearer token 用于身份认证
		newCtx = NewContextWithBearerToken(newCtx, token)

		// 处理用户 Token
		newCtx, err = m.handleUserToken(newCtx, &info, tokenID)
		if err != nil {
			logx.WithContext(r.Context()).Error("handleUserToken", "error", err)
			AbortResponseWithCode(w, http.StatusBadRequest, err)
			return
		}

		next(w, r.WithContext(newCtx))
	}
}

// handleUserToken 处理用户 Token
func (m *JWTAuthMiddleware) handleUserToken(ctx context.Context, info *hydra.TokenIntrospectInfo, tokenID string) (context.Context, error) {
	name, _, depInfos, err := m.userMgmClient.GetUserNameByUserID(ctx, info.VisitorID)
	if err != nil {
		return ctx, errcode.Desc(errcode.GetUserInfoFailure)
	}

	userInfo := &UserInfo{
		ID:       info.VisitorID,
		Name:     name,
		OrgInfos: depInfos,
		UserType: TokenTypeUser,
	}

	ctx = context.WithValue(ctx, InfoName, userInfo)
	ctx = context.WithValue(ctx, Token, tokenID)
	ctx = context.WithValue(ctx, TokenType, TokenTypeUser)

	return ctx, nil
}
