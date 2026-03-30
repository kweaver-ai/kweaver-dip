package models

import (
	"context"

	"github.com/kweaver-ai/idrm-go-common/interception"
	"github.com/kweaver-ai/idrm-go-common/middleware"
	"github.com/kweaver-ai/idrm-go-common/rest/user_management"
)

type DepInfo struct {
	OrgCode string `json:"org_code"`
	OrgName string `json:"org_name"`
}

type UserInfo struct {
	Uid      string                     `json:"id"`
	UserName string                     `json:"name"`
	UserType int                        `json:"user_type"`
	OrgInfos []*user_management.DepInfo `json:"org_info"`
}

func (u *UserInfo) GetUId() string {
	if u == nil {
		return ""
	}

	return u.Uid
}

func GetUserInfo(ctx context.Context) *middleware.User {
	if val := ctx.Value(interception.InfoName); val != nil {
		if ret, ok := val.(*middleware.User); ok {
			return ret
		}
	}
	return nil
}
