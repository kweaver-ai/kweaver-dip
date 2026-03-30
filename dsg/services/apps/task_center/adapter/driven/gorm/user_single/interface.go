package user_single

import (
	"context"
)

type Interface interface {
	// 获取用户的手机号码
	GetPhoneNumber(ctx context.Context, id string) (string, error)
}
