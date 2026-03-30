package login

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/session/adapter/driven/http_client/authentication"
	"github.com/kweaver-ai/dsg/services/apps/session/adapter/driven/http_client/oauth2"
	"github.com/kweaver-ai/dsg/services/apps/session/adapter/driven/http_client/user_management"
	"github.com/kweaver-ai/dsg/services/apps/session/domain/d_session"
)

type LoginService interface {
	TokenEffect(ctx context.Context, token string) (bool, error)
	DoLogin(ctx context.Context, code string, state string, sessionId string) (*d_session.SessionInfo, error)
	SingleSignOn(ctx context.Context, asToken, sessionId string) (*oauth2.Code2TokenRes, *user_management.UserInfo, error)
	SingleSignOn2(ctx context.Context, params map[string]string, sessionId string) (*authentication.SSORes, *user_management.UserInfo, error)
}
type TestReq struct {
	Id string `json:"id" form:"id"`
}
type TestRes struct {
	Name string `json:"name" form:"name"`
}
type LoginReq struct {
	Platform   int32  `json:"platform" form:"platform,default=1" binding:"required,oneof=1 2 4 8"`
	ASRedirect string `json:"asredirect" form:"asredirect"` // 重定向地址
}

type SingleSignOn2Req struct {
	Ticket   string `json:"ticket"`
	Username string `json:"username"`
}
type SingleSignOn2Res struct {
	SessionID   string `json:"session_id"`
	AccessToken string `json:"access_token"`
	UserID      string `json:"user_id"`
}
