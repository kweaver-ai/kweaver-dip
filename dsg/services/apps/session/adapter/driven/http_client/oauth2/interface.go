package oauth2

import "context"

type DrivenOauth2 interface {
	Code2Token(ctx context.Context, code string, accessUrl string) (*Code2TokenRes, error)
	Code2TokenRaw(code string) (*Code2TokenRes, error)
	Token2Userid(ctx context.Context, accessToken string) (string, error)
	RevokeToken(ctx context.Context, accessToken string) error
	//RevokeUser(userid, state string) error
	RefreshToken(ctx context.Context, refreshToken string) (*Code2TokenRes, error)
}
type Code2TokenRes struct {
	AccessToken  string  `json:"access_token"`
	IdToken      string  `json:"id_token"`
	ExpiresIn    float64 `json:"expires_in"`
	RefreshToken string  `json:"refresh_token"`
	TokenType    string  `json:"token_type"`
	Scope        string  `json:"scope"`
}
