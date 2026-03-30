package dto

import (
	"context"
	"github.com/kweaver-ai/idrm-go-common/interception"
	middleware "github.com/kweaver-ai/idrm-go-common/middleware/v1"
)

type UserInfo struct {
	Name       string               `json:"name"`
	Roles      []string             `json:"roles"`
	ParentDeps [][]ParentDepartment `json:"parent_deps"`
	Id         string               `json:"id"`
}

type ParentDepartment struct {
	Id   string `json:"id,omitempty"`
	Name string `json:"name,omitempty"`
	Type string `json:"type,omitempty"`
}

// GetUser 从
func GetUser(c context.Context) (userInfo *UserInfo) {
	if u, err := middleware.UserFromContext(c); err == nil {
		return &UserInfo{
			Name: u.Name,
			Id:   u.ID,
		}
	}
	value := c.Value(interception.InfoName)

	if value == nil {
		return &UserInfo{}
	}

	return value.(*UserInfo)
}
