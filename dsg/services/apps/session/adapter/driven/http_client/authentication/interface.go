package authentication

import "context"

type Driven interface {
	SSO(ctx context.Context, accessUrl string, req *SSOReq) (*SSORes, error)
}
type SSOReq struct {
	ClientID     string     `json:"client_id"`
	RedirectURI  string     `json:"redirect_uri"`
	ResponseType string     `json:"response_type"`
	Scope        string     `json:"scope"`
	UDIDs        []string   `json:"udids,omitempty"`
	Credential   Credential `json:"credential"`
}
type Credential struct {
	ID     string            `json:"id"`
	Params map[string]string `json:"params"`
}

type SSORes2 struct {
	Code  string `json:"code"`
	Scope string `json:"scope"`
}

type SSORes struct {
	ExpirsesIn  int    `json:"expirses_in"`
	IdToken     string `json:"id_token"`
	Scope       string `json:"scope"`
	TokenType   string `json:"token_type"`
	AccessToken string `json:"access_token"`
}
