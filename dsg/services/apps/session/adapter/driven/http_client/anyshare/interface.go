package anyshare

import "context"

type DrivenAnyshare interface {
	CheckAnyshareHostValid() bool
	GetUserInfoByASToken(ctx context.Context, asToken string) (bool, *UserInfo, error)
}

type UserInfo struct {
	UserID    string `json:"userid"`
	Account   string `json:"account"`
	Name      string `json:"name"`
	Mail      string `json:"mail"`
	TelNumber string `json:"telnumber"`
}
