package user_info

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/session/adapter/driven/http_client/user_management"
)

type UserInfoService interface {
	GetUserInfo(ctx context.Context, token string) (*user_management.UserInfo, error)
	GetUserName(ctx context.Context, sessionId string) (string, error)
}
