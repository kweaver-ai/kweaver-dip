package data_resource

import (
	"testing"

	"github.com/stretchr/testify/assert"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/driven/auth_service"
)

func Test_dataResourceTypeObjectTypePolicyActionBindings(t *testing.T) {
	// drtCount 记录 DataResourceType 在 dataResourceTypeObjectTypePolicyActionBindings 中出现的次数
	var drtCount = make(map[DataResourceType]int)
	// obtCount 记录 auth_service.ObjectType dataResourceTypeObjectTypePolicyActionBindings 中出现的次数
	var obtCount = make(map[auth_service.ObjectType]int)
	for _, b := range dataResourceTypeObjectTypePolicyActionBindings {
		drtCount[b.dataResourceType]++
		obtCount[b.objectType]++
	}
	// 验证所有的 SupportedDataResourceTypes 在 dataResourceTypeObjectTypePolicyActionBinding 最多出现一次
	for drt := range SupportedDataResourceTypes {
		assert.LessOrEqual(t, drtCount[drt], 1, "DataResource %q 在 dataResourceTypeObjectTypePolicyActionBinding 中应该最多出现 1 次", drt)
	}
	// 验证所有的 auth_service.ObjectType 在 dataResourceTypeObjectTypePolicyActionBinding 最多出现一次
	for obt, c := range obtCount {
		assert.LessOrEqual(t, c, 1, obt)
	}
}
