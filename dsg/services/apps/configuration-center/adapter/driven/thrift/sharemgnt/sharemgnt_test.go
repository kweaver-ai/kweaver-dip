package sharemanagement

import (
	"context"
	"fmt"
	"testing"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/thrift_gen/sharemgnt"
)

func Test_driven_RoleAdd(t *testing.T) {
	d := &driven{
		Host: "sharemgnt.anyshare.svc.cluster.local",
		Port: 9600,
	}
	uid := "8afa8462-d9d9-11ed-8dc4-126404968f38"
	ctx := context.Background()
	members, err := d.RoleGetMember(ctx, uid, sharemgnt.NCT_SYSTEM_ROLE_SUPPER)
	if err != nil {
		fmt.Println("RoleGetMember " + err.Error())
		return
	}
	for _, member := range members {
		fmt.Println(member.UserId, member.DisplayName)
	}
	t.Log(d.RoleSetMember(ctx, uid, sharemgnt.NCT_SYSTEM_ROLE_SUPPER, &sharemgnt.NcTRoleMemberInfo{
		UserId:          uid,
		DisplayName:     "burtn",
		DepartmentIds:   []string{},
		DepartmentNames: []string{},
		ManageDeptInfo: &sharemgnt.NcTManageDeptInfo{
			DepartmentIds:      []string{},
			DepartmentNames:    []string{},
			LimitUserSpaceSize: -1,
			LimitDocSpaceSize:  -1,
		},
	}))
}
