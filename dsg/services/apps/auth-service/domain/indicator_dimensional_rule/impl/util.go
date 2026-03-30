package impl

import (
	"github.com/kweaver-ai/dsg/services/apps/auth-service/common/dto"
	v1 "github.com/kweaver-ai/idrm-go-common/api/auth-service/v1"
	"github.com/kweaver-ai/idrm-go-common/util/sets"
	"sort"
)

// 根据是否允许执行指定操作对资源 ID 排序。不允许的在前，允许的在后。
func sortObjectIDsByActionAndPolicyEnforceRes(ids []string, act v1.Action, response *dto.PolicyEnforceRes) {
	// 被允许执行指定操作的 object id
	var allowedIDs = sets.New[string]()
	for _, pee := range *response {
		if pee.Action != string(act) {
			continue
		}
		if pee.Effect != string(v1.PolicyAllow) {
			continue
		}
		allowedIDs.Insert(pee.ObjectId)
	}

	sort.Slice(ids, func(i, j int) bool {
		var ci, cj int
		if allowedIDs.Has(ids[i]) {
			ci = 1
		}
		if allowedIDs.Has(ids[j]) {
			cj = 1
		}
		return ci < cj
	})
}
