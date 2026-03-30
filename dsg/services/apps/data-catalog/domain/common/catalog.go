package common

import (
	"github.com/kweaver-ai/idrm-go-common/middleware"
	"github.com/kweaver-ai/idrm-go-common/rest/user_management"
	"github.com/samber/lo"
)

// UserOrgContainsCatalogOrg 判断部门编码是否在用户所有的部门编码中
func UserOrgContainsCatalogOrg(uInfo *middleware.User, catalogOrgCode string) (userOrgCodes []string, exist bool) {
	userOrgMap := lo.SliceToMap(uInfo.OrgInfos, func(depInfo *user_management.DepInfo) (string, struct{}) {
		return depInfo.OrgCode, struct{}{}
	})

	if _, ok := userOrgMap[catalogOrgCode]; ok {
		return lo.Keys(userOrgMap), true
	}
	return lo.Keys(userOrgMap), false
}
